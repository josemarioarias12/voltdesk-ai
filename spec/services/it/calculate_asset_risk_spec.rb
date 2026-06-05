# frozen_string_literal: true

require 'rails_helper'

RSpec.describe It::CalculateAssetRisk do
  let(:workspace) { create(:workspace) }

  # High-risk asset: old device, no maintenance in 400 days, warranty expiring in 5 days, 4 incidents
  let(:asset) do
    create(:asset,
           workspace:            workspace,
           purchase_date:        50.months.ago.to_date,
           last_maintenance_at:  400.days.ago.to_date,
           warranty_expires_at:  5.days.from_now.to_date)
  end

  describe '.call' do
    context 'with a high-risk asset' do
      before { create_list(:asset_incident, 4, asset: asset, workspace: workspace) }

      it 'calculates a risk score above 70' do
        result = described_class.call(asset: asset)
        expect(result).to be_success
        expect(result.data[:score]).to be > 70
      end

      it 'updates the asset risk_score' do
        described_class.call(asset: asset)
        expect(asset.reload.risk_score).to be > 70
      end

      it 'stores risk_assessment in ai_metadata' do
        described_class.call(asset: asset)
        expect(asset.reload.ai_metadata).to have_key('risk_assessment')
      end

      it 'includes all four factors in metadata' do
        described_class.call(asset: asset)
        factors = asset.reload.ai_metadata.dig('risk_assessment', 'factors')
        expect(factors.keys).to match_array(%w[incidents maintenance warranty age])
      end

      it 'includes a recommendation' do
        described_class.call(asset: asset)
        recommendation = asset.reload.ai_metadata.dig('risk_assessment', 'recommendation')
        expect(recommendation).to be_present
      end
    end

    context 'with a low-risk asset' do
      let(:low_risk_asset) do
        create(:asset,
               workspace:           workspace,
               purchase_date:       6.months.ago.to_date,
               last_maintenance_at: 10.days.ago.to_date,
               warranty_expires_at: 2.years.from_now.to_date)
      end

      it 'calculates a risk score below 40' do
        result = described_class.call(asset: low_risk_asset)
        expect(result.data[:score]).to be < 40
      end
    end

    context 'when asset has no purchase date or maintenance' do
      let(:minimal_asset) { create(:asset, workspace: workspace, purchase_date: nil, last_maintenance_at: nil) }

      it 'returns success without raising' do
        result = described_class.call(asset: minimal_asset)
        expect(result).to be_success
      end
    end

    context 'when asset update fails' do
      before { allow(asset).to receive(:update!).and_raise(ActiveRecord::RecordInvalid) }

      it 'returns failure' do
        result = described_class.call(asset: asset)
        expect(result).to be_failure
      end
    end
  end
end
