# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::SendGovernanceEmailJob do
  subject(:perform) { described_class.perform_now(suggestion_ids) }

  let(:suggestion) { create(:ai_model_governance_suggestion) }
  let(:suggestion_ids) { [suggestion.id] }
  let!(:admin) { create(:user, role: :workspace_admin, active: true) }

  before do
    allow(Resend).to receive(:api_key).and_return('re_test_fake_key')
    stub_request(:post, 'https://api.resend.com/emails')
      .to_return(status: 200, body: { id: 'fake-email-id' }.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  it 'sends a real POST request to the Resend emails endpoint' do
    perform

    expect(WebMock).to have_requested(:post, 'https://api.resend.com/emails').once
  end

  it 'sends the admin recipient, subject, and non-empty html/text bodies' do
    perform

    expect(WebMock).to(have_requested(:post, 'https://api.resend.com/emails').with do |req|
      body = JSON.parse(req.body)
      body['to'] == [admin.email] &&
        body['subject'].include?('governance') &&
        body['html'].present? &&
        body['text'].present?
    end)
  end

  context 'when there are no suggestion ids to send' do
    let(:suggestion_ids) { [] }

    it 'does not call Resend at all' do
      perform

      expect(WebMock).not_to have_requested(:post, 'https://api.resend.com/emails')
    end
  end

  context 'when Resend returns an error' do
    before do
      stub_request(:post, 'https://api.resend.com/emails').to_return(status: 422, body: '{"message":"invalid"}')
    end

    it 're-raises so Sidekiq can retry' do
      expect { perform }.to raise_error(StandardError)
    end
  end
end
