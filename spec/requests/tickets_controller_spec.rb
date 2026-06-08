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

    it 'returns tickets, departments, and stats props' do
      get tickets_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('tickets', 'departments', 'stats')
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
end
