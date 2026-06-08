# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketsChannel, type: :channel do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, role: :agent) }

  before { stub_connection current_user: user, current_workspace: workspace }

  it 'confirms subscription without ticket_id' do
    subscribe
    expect(subscription).to be_confirmed
  end

  it 'confirms subscription with valid ticket_id' do
    ticket = create(:ticket, workspace: workspace, department: department, created_by: user)
    subscribe ticket_id: ticket.id
    expect(subscription).to be_confirmed
  end

  it 'rejects when ticket not found' do
    subscribe ticket_id: 0
    expect(subscription).to be_rejected
  end

  it 'unsubscribes cleanly' do
    subscribe
    expect { unsubscribe }.not_to raise_error
  end
end
