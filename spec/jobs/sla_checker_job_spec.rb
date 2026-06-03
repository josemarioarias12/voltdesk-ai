# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SlaCheckerJob, type: :job do
  let!(:workspace) { create(:workspace, active: true) }
  let(:department) { create(:department, workspace: workspace) }

  describe '#perform' do
    let!(:breached_ticket) do
      create(:ticket, workspace: workspace, department: department,
                      status: :open, priority: :medium, due_at: 3.hours.ago)
    end

    let!(:on_track_ticket) do
      create(:ticket, workspace: workspace, department: department,
                      status: :open, due_at: 48.hours.from_now)
    end

    it 'escalates the breached ticket' do
      described_class.perform_now
      expect(breached_ticket.reload.priority).to eq('critical')
    end

    it 'does not touch the on-track ticket' do
      described_class.perform_now
      expect(on_track_ticket.reload.priority).not_to eq('critical')
    end

    it 'does not raise errors' do
      expect { described_class.perform_now }.not_to raise_error
    end
  end

  it 'uses the sla_monitoring queue' do
    expect(described_class.queue_name).to eq('sla_monitoring')
  end
end
