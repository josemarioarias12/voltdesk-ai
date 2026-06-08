# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketCommentsController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:agent)      { create(:user, workspace: workspace, role: :agent) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }
  let(:ticket)     { create(:ticket, workspace: workspace, department: department, created_by: employee, assigned_to: agent) }

  describe 'POST /tickets/:ticket_id/comments' do
    before { sign_in agent }

    it 'creates a public comment and redirects' do
      expect do
        post ticket_ticket_comments_path(ticket), params: { ticket_comment: { body: 'Looking into this now.', internal: false } }
      end.to change(TicketComment, :count).by(1)
      expect(response).to have_http_status(:redirect)
    end

    it 'creates an internal comment for agent' do
      post ticket_ticket_comments_path(ticket), params: { ticket_comment: { body: 'Internal note.', internal: true } }
      expect(TicketComment.last.internal).to be true
    end

    it 'redirects on invalid comment' do
      post ticket_ticket_comments_path(ticket), params: { ticket_comment: { body: '', internal: false } }
      expect(response).to have_http_status(:redirect)
    end

    context 'when employee tries to post internal comment' do
      before { sign_in employee }

      it 'redirects with alert' do
        post ticket_ticket_comments_path(ticket), params: { ticket_comment: { body: 'Internal note.', internal: true } }
        expect(response).to have_http_status(:redirect)
      end
    end

    context 'when employee posts on own ticket' do
      before { sign_in employee }

      it 'creates a public comment' do
        expect do
          post ticket_ticket_comments_path(ticket), params: { ticket_comment: { body: 'Any update?', internal: false } }
        end.to change(TicketComment, :count).by(1)
      end
    end
  end
end
