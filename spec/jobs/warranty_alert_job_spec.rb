# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WarrantyAlertJob do
  describe '#perform' do
    let!(:workspace) { create(:workspace) }
    let!(:it_manager) { create(:user, workspace: workspace, role: :it_manager) }

    it 'calls WarrantyAlertService for each active workspace' do
      allow(It::WarrantyAlertService).to receive(:call).and_return(ServiceResult.success({ alerts_sent: 0 }))
      described_class.new.perform
      expect(It::WarrantyAlertService).to have_received(:call).with(workspace: workspace)
    end

    it 'does not raise when service returns failure' do
      allow(It::WarrantyAlertService).to receive(:call).and_return(ServiceResult.failure('error'))
      expect { described_class.new.perform }.not_to raise_error
    end
  end
end
