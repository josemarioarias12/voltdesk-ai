# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelGovernanceSyncJob do
  subject(:perform) { described_class.perform_now(check_types) }

  let(:check_types) { %w[pricing deprecation] }

  before do
    allow(Ai::CheckModelPricing).to receive(:call).and_return(
      ServiceResult.success(checked: 9, flagged: 1, suggestion_ids: [101])
    )
    allow(Ai::CheckModelDeprecation).to receive(:call).and_return(
      ServiceResult.success(checked: 9, flagged: 1, suggestion_ids: [102])
    )
    allow(Ai::GovernanceNotifier).to receive(:notify)
  end

  it 'runs both checkers when no type is specified' do
    perform

    expect(Ai::CheckModelPricing).to have_received(:call)
    expect(Ai::CheckModelDeprecation).to have_received(:call)
  end

  it 'notifies with the combined suggestion ids from both checkers' do
    perform

    expect(Ai::GovernanceNotifier).to have_received(:notify).with([101, 102])
  end

  context 'when only one check type is requested' do
    let(:check_types) { ['pricing'] }

    it 'runs only that checker' do
      perform

      expect(Ai::CheckModelPricing).to have_received(:call)
      expect(Ai::CheckModelDeprecation).not_to have_received(:call)
    end

    it 'notifies with only that checker suggestion ids' do
      perform

      expect(Ai::GovernanceNotifier).to have_received(:notify).with([101])
    end
  end

  context 'when a checker fails' do
    before do
      allow(Ai::CheckModelPricing).to receive(:call).and_return(ServiceResult.failure('timeout'))
    end

    it 'still notifies with suggestions from the checker that succeeded' do
      perform

      expect(Ai::GovernanceNotifier).to have_received(:notify).with([102])
    end
  end
end
