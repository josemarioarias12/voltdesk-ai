# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PatternDetectorJob do
  describe '#perform' do
    let!(:active_workspace)   { create(:workspace, active: true) }
    let!(:inactive_workspace) { create(:workspace, active: false) }

    before do
      allow(Ai::PatternDetector).to receive(:call).and_return(ServiceResult.success)
    end

    it 'calls PatternDetector for each active workspace' do
      described_class.new.perform
      expect(Ai::PatternDetector).to have_received(:call).with(workspace: active_workspace).once
    end

    it 'skips inactive workspaces' do
      described_class.new.perform
      expect(Ai::PatternDetector).not_to have_received(:call).with(workspace: inactive_workspace)
    end

    it 'continues if one workspace raises' do
      allow(Ai::PatternDetector).to receive(:call).and_raise(StandardError, 'fail')
      expect { described_class.new.perform }.not_to raise_error
    end
  end
end
