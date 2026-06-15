# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Compliance::GenerateReport do
  subject(:service) do
    described_class.new(
      workspace:    workspace,
      period_start: 3.months.ago.to_date,
      period_end:   Time.zone.today
    )
  end

  let(:workspace) { create(:workspace) }
  let(:admin)     { create(:user, workspace: workspace, role: :workspace_admin) }

  before do
    DataRetentionPolicy.seed_defaults_for(workspace)
  end

  describe '#call' do
    it 'returns success' do
      result = service.call
      expect(result).to be_success
    end

    it 'includes workspace name in evidence' do
      result = service.call
      expect(result.data[:evidence][:workspace]).to eq(workspace.name)
    end

    it 'includes data retention config' do
      result = service.call
      expect(result.data[:evidence][:data_retention_config]).not_to be_empty
    end

    it 'includes encryption status' do
      result = service.call
      enc = result.data[:evidence][:encryption_status]
      expect(enc[:at_rest]).to include('PostgreSQL')
      expect(enc[:in_transit]).to include('TLS')
    end

    it 'includes ai audit summary' do
      result = service.call
      expect(result.data[:evidence][:ai_audit_summary]).to have_key(:total_operations)
    end

    it 'calculates a compliance score between 0 and 100' do
      result = service.call
      score = result.data[:evidence][:compliance_score]
      expect(score).to be_between(0, 100)
    end

    it 'generates a PDF binary' do
      result = service.call
      expect(result.data[:pdf]).to be_a(String)
      expect(result.data[:pdf].encoding).to eq(Encoding::ASCII_8BIT)
    end
  end
end
