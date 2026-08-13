# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssetsChannel, type: :channel do
  let(:workspace)       { create(:workspace) }
  let(:other_workspace) { create(:workspace) }
  let(:it_manager)      { create(:user, workspace: workspace, role: :it_manager) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }
  let(:asset)           { create(:asset, workspace: workspace) }

  it 'confirms subscription and streams for an authorized role' do
    stub_connection current_user: it_manager
    subscribe(asset_id: asset.id)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("asset_#{asset.id}")
  end

  it 'rejects subscription for a role without asset access' do
    stub_connection current_user: employee
    subscribe(asset_id: asset.id)
    expect(subscription).to be_rejected
  end

  it 'rejects when no current_user' do
    stub_connection current_user: nil
    subscribe(asset_id: asset.id)
    expect(subscription).to be_rejected
  end

  it 'rejects when the asset does not exist' do
    stub_connection current_user: it_manager
    subscribe(asset_id: 0)
    expect(subscription).to be_rejected
  end

  it 'rejects when the asset belongs to a different workspace' do
    other_asset = create(:asset, workspace: other_workspace)
    stub_connection current_user: it_manager
    subscribe(asset_id: other_asset.id)
    expect(subscription).to be_rejected
  end
end
