# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ExecutiveReportJob do
  describe '#perform' do
    let!(:active_workspace)   { create(:workspace, active: true) }
    let!(:inactive_workspace) { create(:workspace, active: false) }

    before do
      allow(Ai::ExecutiveReportGenerator).to receive(:call).and_return(ServiceResult.success)
    end

    it 'calls ExecutiveReportGenerator for each active workspace' do
      described_class.new.perform
      expect(Ai::ExecutiveReportGenerator).to have_received(:call).with(workspace: active_workspace).once
    end

    it 'does not call generator for inactive workspaces' do
      described_class.new.perform
      expect(Ai::ExecutiveReportGenerator).not_to have_received(:call).with(workspace: inactive_workspace)
    end

    it 'continues processing if one workspace fails' do
      second_workspace = create(:workspace, active: true)
      allow(Ai::ExecutiveReportGenerator).to receive(:call)
        .with(workspace: active_workspace).and_raise(StandardError, 'boom')
      allow(Ai::ExecutiveReportGenerator).to receive(:call)
        .with(workspace: second_workspace).and_return(ServiceResult.success)

      expect { described_class.new.perform }.not_to raise_error
      expect(Ai::ExecutiveReportGenerator).to have_received(:call).with(workspace: second_workspace)
    end
  end
end
