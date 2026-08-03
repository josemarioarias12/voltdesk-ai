# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::GovernanceNotifier do
  subject(:notify) { described_class.notify(suggestion_ids) }

  before do
    allow(TelegramNotifier).to receive(:send_prediction)
    allow(Ai::SendGovernanceEmailJob).to receive(:perform_later)
  end

  context 'when there are suggestion ids' do
    let(:suggestion_ids) { [1, 2, 3] }

    it 'sends a Telegram notification' do
      notify
      expect(TelegramNotifier).to have_received(:send_prediction).with(
        hash_including(message: '3 model governance suggestions pending review.', level: :warning)
      )
    end

    it 'enqueues the email job with all suggestion ids' do
      notify
      expect(Ai::SendGovernanceEmailJob).to have_received(:perform_later).with([1, 2, 3])
    end
  end

  context 'when there is exactly one suggestion id' do
    let(:suggestion_ids) { [1] }

    it 'uses singular wording in the Telegram message' do
      notify
      expect(TelegramNotifier).to have_received(:send_prediction).with(
        hash_including(message: '1 model governance suggestion pending review.')
      )
    end
  end

  context 'when suggestion_ids is empty' do
    let(:suggestion_ids) { [] }

    it 'does not send any notification' do
      notify
      expect(TelegramNotifier).not_to have_received(:send_prediction)
      expect(Ai::SendGovernanceEmailJob).not_to have_received(:perform_later)
    end
  end

  context 'when suggestion_ids contains nil values' do
    let(:suggestion_ids) { [1, nil, 2] }

    it 'compacts them before notifying' do
      notify
      expect(Ai::SendGovernanceEmailJob).to have_received(:perform_later).with([1, 2])
    end
  end
end
