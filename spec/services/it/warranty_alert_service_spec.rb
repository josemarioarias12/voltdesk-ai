# frozen_string_literal: true

require 'rails_helper'

RSpec.describe It::WarrantyAlertService do
  let!(:workspace)  { create(:workspace) }
  let!(:it_manager) { create(:user, workspace: workspace, role: :it_manager) }

  describe '.call' do
    context 'when an asset warranty expires in 30 days' do
      let!(:asset) do
        create(:asset,
               workspace:           workspace,
               status:              :active,
               warranty_expires_at: 30.days.from_now.to_date)
      end

      it 'creates a notification for the IT manager' do
        expect { described_class.call(workspace: workspace) }
          .to change(Notification, :count).by(1)
      end

      it 'marks the 30_days alert as sent' do
        described_class.call(workspace: workspace)
        expect(asset.reload.warranty_alerts_sent['30_days']).to be true
      end

      it 'does not send the alert twice' do
        described_class.call(workspace: workspace)
        expect { described_class.call(workspace: workspace) }
          .not_to change(Notification, :count)
      end

      it 'returns success with alerts_sent count' do
        result = described_class.call(workspace: workspace)
        expect(result).to be_success
        expect(result.data[:alerts_sent]).to eq(1)
      end
    end

    context 'when no assets are expiring' do
      it 'returns success with zero alerts' do
        result = described_class.call(workspace: workspace)
        expect(result).to be_success
        expect(result.data[:alerts_sent]).to eq(0)
      end
    end

    context 'when asset is not active' do
      let!(:asset) do
        create(:asset,
               workspace:           workspace,
               status:              :retired,
               warranty_expires_at: 30.days.from_now.to_date)
      end

      it 'does not send alerts for retired assets' do
        expect { described_class.call(workspace: workspace) }
          .not_to change(Notification, :count)
      end
    end
  end
end
