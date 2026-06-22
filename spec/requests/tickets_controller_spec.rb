# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketsController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:agent)      { create(:user, workspace: workspace, role: :agent, department: department) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /tickets' do
    before { sign_in agent }

    it 'returns 200' do
      get tickets_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns tickets, departments, assignable_agents, and stats props' do
      get tickets_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('tickets', 'departments', 'assignable_agents', 'stats')
    end

    it 'does not return tickets from other workspaces' do
      other_ws   = create(:workspace)
      other_dept = create(:department, workspace: other_ws)
      other_user = create(:user, workspace: other_ws, role: :employee)
      create(:ticket, workspace: other_ws, department: other_dept, created_by: other_user)
      get tickets_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['tickets']).to be_empty
    end
  end

  describe 'GET /tickets/new' do
    before { sign_in employee }

    it 'returns 200' do
      get new_ticket_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /tickets/:id' do
    let(:ticket) { create(:ticket, workspace: workspace, department: department, created_by: employee, assigned_to: agent) }

    before { sign_in agent }

    it 'returns 200' do
      get ticket_path(ticket), headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns ticket props' do
      get ticket_path(ticket), headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('ticket')
    end
  end

  describe 'POST /tickets' do
    before do
      sign_in employee
      stub_openai_classify
      stub_openai_embeddings
    end

    let(:valid_params) do
      {
        ticket: {
          title: 'Printer not working in accounting',
          description: 'Cannot print invoices for month close',
          department_id: department.id,
          priority: 'medium',
          source: 'web'
        }
      }
    end

    it 'creates a ticket' do
      expect { post tickets_path, params: valid_params }.to change(Ticket, :count).by(1)
    end

    it 'redirects after creation' do
      post tickets_path, params: valid_params
      expect(response).to have_http_status(:redirect)
    end

    it 'rejects blank title' do
      post tickets_path, params: { ticket: valid_params[:ticket].merge(title: '') }
      expect(Ticket.count).to eq(0)
    end
  end

  describe 'POST /tickets/:id/resolve' do
    let(:ticket) { create(:ticket, workspace: workspace, department: department, created_by: employee, assigned_to: agent, status: :in_progress) }

    before { sign_in agent }

    it 'resolves the ticket and redirects' do
      post resolve_ticket_path(ticket)
      expect(ticket.reload.status).to eq('resolved')
    end
  end

  describe 'PATCH /tickets/bulk_update' do
    let!(:manager) { create(:user, workspace: workspace, role: :department_manager, department: department) }
    let!(:ticket_one) do
      create(:ticket, workspace: workspace, department: department, created_by: employee,
                       assigned_to: agent, status: :in_progress)
    end
    let!(:ticket_two) do
      create(:ticket, workspace: workspace, department: department, created_by: employee,
                       assigned_to: agent, status: :in_progress)
    end

    context 'when resolving tickets as the assigned agent' do
      before { sign_in agent }

      it 'resolves the tickets and reports the updated count' do
        patch bulk_update_tickets_path, params: { bulk_action: 'resolve', ticket_ids: [ticket_one.id, ticket_two.id] }

        expect(ticket_one.reload.status).to eq('resolved')
        expect(ticket_two.reload.status).to eq('resolved')
        expect(response).to redirect_to(tickets_path)
        follow_redirect!
        expect(response.body).to include('2 ticket(s) updated')
      end
    end

    context 'when an employee attempts to resolve tickets' do
      before { sign_in employee }

      it 'skips every ticket and reports zero updates' do
        patch bulk_update_tickets_path, params: { bulk_action: 'resolve', ticket_ids: [ticket_one.id] }

        expect(ticket_one.reload.status).to eq('in_progress')
        expect(response).to redirect_to(tickets_path)
      end
    end

    context 'when assigning tickets' do
      it 'allows a department manager to assign within their department' do
        sign_in manager
        patch bulk_update_tickets_path, params: { bulk_action: 'assign', value: agent.id, ticket_ids: [ticket_one.id] }

        expect(ticket_one.reload.assigned_to_id).to eq(agent.id)
      end

      it 'does not allow an agent to assign tickets' do
        sign_in agent
        patch bulk_update_tickets_path, params: { bulk_action: 'assign', value: agent.id, ticket_ids: [ticket_two.id] }

        expect(ticket_two.reload.assigned_to_id).to eq(agent.id)
      end
    end

    context 'when updating priority as the assigned agent' do
      before { sign_in agent }

      it 'updates the priority' do
        patch bulk_update_tickets_path, params: { bulk_action: 'priority', value: 'high', ticket_ids: [ticket_one.id] }

        expect(ticket_one.reload.priority).to eq('high')
      end
    end

    context 'with an unrecognized bulk_action' do
      before { sign_in agent }

      it 'redirects with an alert and changes nothing' do
        patch bulk_update_tickets_path, params: { bulk_action: 'delete', ticket_ids: [ticket_one.id] }

        expect(ticket_one.reload.status).to eq('in_progress')
        expect(response).to redirect_to(tickets_path)
      end
    end

    context 'cross-workspace security' do
      let(:other_workspace)  { create(:workspace) }
      let(:other_department) { create(:department, workspace: other_workspace) }
      let!(:foreign_ticket) do
        create(:ticket, workspace: other_workspace, department: other_department,
                        created_by: create(:user, workspace: other_workspace, role: :employee))
      end

      before { sign_in agent }

      it 'does not update tickets belonging to another workspace' do
        patch bulk_update_tickets_path, params: { bulk_action: 'resolve', ticket_ids: [foreign_ticket.id] }

        expect(foreign_ticket.reload.status).not_to eq('resolved')
      end
    end
  end

  describe 'GET /tickets with sorting' do
    let!(:critical_ticket) { create(:ticket, workspace: workspace, department: department, created_by: employee, priority: :critical) }
    let!(:low_ticket)      { create(:ticket, workspace: workspace, department: department, created_by: employee, priority: :low) }

    before { sign_in agent }

    it 'orders by priority descending by default direction' do
      get tickets_path, params: { sort: 'priority' }, headers: inertia_headers
      ids = response.parsed_body['props']['tickets'].pluck('id')

      expect(ids.index(critical_ticket.id)).to be < ids.index(low_ticket.id)
    end

    it 'orders by priority ascending when direction=asc' do
      get tickets_path, params: { sort: 'priority', direction: 'asc' }, headers: inertia_headers
      ids = response.parsed_body['props']['tickets'].pluck('id')

      expect(ids.index(low_ticket.id)).to be < ids.index(critical_ticket.id)
    end

    it 'ignores disallowed sort columns and returns 200 with default order' do
      get tickets_path, params: { sort: 'title' }, headers: inertia_headers

      expect(response).to have_http_status(:ok)
    end

    it 'echoes sort and direction back in the filters prop' do
      get tickets_path, params: { sort: 'updated_at', direction: 'asc' }, headers: inertia_headers
      filters = response.parsed_body['props']['filters']

      expect(filters).to include('sort' => 'updated_at', 'direction' => 'asc')
    end
  end
end
