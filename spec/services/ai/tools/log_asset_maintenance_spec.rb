# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::LogAssetMaintenance do
  let(:workspace)  { create(:workspace) }
  let(:it_manager) { create(:user, workspace: workspace, role: :it_manager) }
  let(:asset)      { create(:asset, workspace: workspace, name: 'MacBook Pro 16', status: :active) }

  describe '.visible_to?' do
    it 'is visible only to roles allowed by AssetPolicy#update?' do
      allowed = %i[super_admin workspace_admin it_manager]
      denied  = %i[hr_manager facilities_manager operations_manager department_manager agent employee guest]

      allowed.each do |role|
        expect(described_class.visible_to?(build(:user, role: role, workspace: workspace))).to be(true)
      end

      denied.each do |role|
        expect(described_class.visible_to?(build(:user, role: role, workspace: workspace))).to be(false)
      end
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: it_manager, workspace: workspace, locale: 'en') }

    context 'asset resolution' do
      before { asset }

      it 'resolves by exact asset_number, case-insensitive' do
        result = tool.call(asset_identifier: asset.asset_number.downcase, status: 'in_maintenance')

        expect(result).to be_success
        expect(result.data[:summary][:asset_number]).to eq(asset.asset_number)
      end

      it 'resolves by exact name match' do
        result = tool.call(asset_identifier: 'MacBook Pro 16', status: 'in_maintenance')

        expect(result).to be_success
      end

      it 'resolves a unique partial name match' do
        result = tool.call(asset_identifier: 'MacBook', status: 'in_maintenance')

        expect(result).to be_success
        expect(result.data[:summary][:asset_name]).to eq('MacBook Pro 16')
      end

      it 'fails without raising when the name matches multiple assets' do
        create(:asset, workspace: workspace, name: 'MacBook Pro 14')

        result = tool.call(asset_identifier: 'MacBook', status: 'in_maintenance')

        expect(result).to be_failure
        expect(result.error).to include('matches multiple assets')
      end

      it 'fails without raising when no asset matches' do
        result = tool.call(asset_identifier: 'Nonexistent Device', status: 'in_maintenance')

        expect(result).to be_failure
        expect(result.error).to include('No asset matches')
      end
    end

    context 'invalid input' do
      it 'fails without raising on an out-of-range status' do
        result = tool.call(asset_identifier: asset.asset_number, status: 'retired')

        expect(result).to be_failure
        expect(result.error).to include("'active' or 'in_maintenance'")
      end

      it 'fails without raising when the asset is already in the requested status' do
        result = tool.call(asset_identifier: asset.asset_number, status: 'active')

        expect(result).to be_failure
        expect(result.error).to include('already active')
      end

      it 'fails without raising on an unparseable performed_at date' do
        asset.update!(status: :in_maintenance)

        result = tool.call(asset_identifier: asset.asset_number, status: 'active', performed_at: 'not-a-date')

        expect(result).to be_failure
        expect(result.error).to include('Invalid performed_at date format')
      end
    end

    context 'preview (confirmed omitted or false)' do
      it 'does not persist any change to the asset' do
        expect do
          tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance')
        end.not_to(change { asset.reload.status })
      end

      it 'returns a preview summary with the status transition' do
        result = tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance')

        expect(result).to be_success
        expect(result.data[:preview]).to be(true)
        expect(result.data[:summary][:status]).to eq('active → in_maintenance')
      end

      it 'includes last_maintenance_at in the preview only when status is active' do
        asset.update!(status: :in_maintenance)

        result = tool.call(asset_identifier: asset.asset_number, status: 'active')

        expect(result.data[:summary][:last_maintenance_at]).to eq(Date.current)
      end

      it 'omits last_maintenance_at from the preview when starting maintenance' do
        result = tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance')

        expect(result.data[:summary]).not_to have_key(:last_maintenance_at)
      end
    end

    context 'confirmed: true' do
      it 'persists the status change via It::UpdateAsset' do
        tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance', confirmed: true)

        expect(asset.reload.status).to eq('in_maintenance')
      end

      it 'sets last_maintenance_at when marking active, defaulting to today' do
        asset.update!(status: :in_maintenance)

        tool.call(asset_identifier: asset.asset_number, status: 'active', confirmed: true)

        expect(asset.reload.last_maintenance_at).to eq(Date.current)
      end

      it 'respects an explicit performed_at date' do
        asset.update!(status: :in_maintenance)
        past_date = 3.days.ago.to_date

        tool.call(asset_identifier: asset.asset_number, status: 'active',
                  performed_at: past_date.to_s, confirmed: true)

        expect(asset.reload.last_maintenance_at).to eq(past_date)
      end

      it 'appends a date-stamped note without overwriting existing notes' do
        asset.update!(notes: 'Previous note')

        tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance',
                  notes: 'Replacing thermal paste', confirmed: true)

        expect(asset.reload.notes).to eq(
          "Previous note\n[#{Date.current.iso8601}] Replacing thermal paste"
        )
      end

      it 'recalculates risk_score via It::CalculateAssetRisk as a side effect of UpdateAsset' do
        expect do
          tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance', confirmed: true)
        end.to change { asset.reload.ai_metadata['risk_assessment'] }.from(nil)
      end

      it 'returns a resource_link pointing to the asset inventory page' do
        result = tool.call(asset_identifier: asset.asset_number, status: 'in_maintenance', confirmed: true)

        expect(result.data[:resource_link]).to eq(
          title: "#{asset.name} (#{asset.asset_number})",
          path: "/inventory/#{asset.id}",
          icon: 'wrench'
        )
      end

      it 'resolves the same asset by name even if phrased differently than on preview' do
        asset
        result = tool.call(asset_identifier: 'macbook pro 16', status: 'in_maintenance', confirmed: true)

        expect(result).to be_success
        expect(asset.reload.status).to eq('in_maintenance')
      end
    end
  end
end
