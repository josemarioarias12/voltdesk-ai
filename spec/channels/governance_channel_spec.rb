# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GovernanceChannel, type: :channel do
  let(:workspace) { create(:workspace) }
  let(:admin)     { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }

  it 'confirms subscription and streams for an admin' do
    stub_connection current_user: admin
    subscribe
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from('governance_sync')
  end

  it 'rejects subscription for a non-admin role' do
    stub_connection current_user: employee
    subscribe
    expect(subscription).to be_rejected
  end

  it 'rejects when no current_user' do
    stub_connection current_user: nil
    subscribe
    expect(subscription).to be_rejected
  end
end
