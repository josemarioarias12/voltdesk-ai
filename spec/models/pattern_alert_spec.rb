# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PatternAlert, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:workspace) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:alert_type) }
    it { is_expected.to validate_presence_of(:severity) }
  end

  describe 'enums' do
    it {
      expect(subject).to define_enum_for(:alert_type)
        .with_values(ticket_cluster: 0, sla_spike: 1, department_surge: 2)
        .with_prefix(:alert_type)
    }

    it {
      expect(subject).to define_enum_for(:severity)
        .with_values(low: 0, medium: 1, high: 2, critical: 3)
        .with_prefix(:severity)
    }
  end

  describe 'scopes' do
    let(:workspace) { create(:workspace) }

    it '.active returns unresolved alerts' do
      active   = create(:pattern_alert, workspace: workspace, resolved_at: nil)
      resolved = create(:pattern_alert, workspace: workspace, resolved_at: 1.hour.ago)

      expect(described_class.active).to include(active)
      expect(described_class.active).not_to include(resolved)
    end

    it '.resolved returns resolved alerts' do
      active   = create(:pattern_alert, workspace: workspace, resolved_at: nil)
      resolved = create(:pattern_alert, workspace: workspace, resolved_at: 1.hour.ago)

      expect(described_class.resolved).to include(resolved)
      expect(described_class.resolved).not_to include(active)
    end
  end

  describe '#resolve!' do
    it 'sets resolved_at to current time' do
      alert = create(:pattern_alert, resolved_at: nil)
      expect { alert.resolve! }.to change { alert.resolved_at }.from(nil)
    end
  end

  describe '#resolved?' do
    it 'returns true when resolved_at is present' do
      alert = build(:pattern_alert, resolved_at: Time.current)
      expect(alert.resolved?).to be true
    end

    it 'returns false when resolved_at is nil' do
      alert = build(:pattern_alert, resolved_at: nil)
      expect(alert.resolved?).to be false
    end
  end
end
