# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssetsWorkspaceChannel, type: :channel do
  let(:workspace)  { create(:workspace) }
  let(:it_manager) { create(:user, workspace: workspace, role: :it_manager) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  it 'confirms subscription and streams for an authorized role' do
    stub_connection current_user: it_manager
    subscribe
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("assets_workspace_#{workspace.id}")
  end

  it 'rejects subscription for a role without asset access' do
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
