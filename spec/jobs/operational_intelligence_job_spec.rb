# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OperationalIntelligenceJob do
  let(:workspace) { create(:workspace) }

  let(:success_result) do
    ServiceResult.success({
                            predictions: [
                              { type: 'volume_spike', confidence: 0.87, message: 'Incremento esperado', recommendation: 'Aumentar agentes', urgency: 'warning' },
                              { type: 'sla_risk', confidence: 0.60, message: 'SLA en riesgo bajo', recommendation: 'Monitorear', urgency: 'info' }
                            ],
      weekly_roi: { hours_saved: 12.0, cost_saved: 840 },
      summary: 'Semana normal.'
                          })
  end

  before do
    allow(Ai::OperationalIntelligenceService).to receive(:call).and_return(success_result)
    allow(TelegramNotifier).to receive(:send_prediction)
  end

  describe '#perform' do
    it 'calls OperationalIntelligenceService' do
      expect(Ai::OperationalIntelligenceService).to receive(:call).with(workspace: workspace, period: 7.days)
      described_class.new.perform(workspace.id)
    end

    it 'sends Telegram notification for predictions with confidence > 0.75' do
      expect(TelegramNotifier).to receive(:send_prediction).once
      described_class.new.perform(workspace.id)
    end

    it 'does not send Telegram notification for predictions with confidence <= 0.75' do
      low_result = ServiceResult.success({
                                           predictions: [{ type: 'sla_risk', confidence: 0.50, message: 'test', recommendation: 'test', urgency: 'info' }],
        weekly_roi: { hours_saved: 0, cost_saved: 0 },
        summary: 'test'
                                         })
      allow(Ai::OperationalIntelligenceService).to receive(:call).and_return(low_result)
      expect(TelegramNotifier).not_to receive(:send_prediction)
      described_class.new.perform(workspace.id)
    end

    it 'does nothing when workspace is not found' do
      expect(Ai::OperationalIntelligenceService).not_to receive(:call)
      described_class.new.perform(0)
    end
  end
end
