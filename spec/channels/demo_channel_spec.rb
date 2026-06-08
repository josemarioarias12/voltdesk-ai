# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DemoChannel, type: :channel do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :guest) }
  let(:token)     { 'abc123validtoken' }

  before do
    stub_connection current_user: user
    allow(REDIS).to receive(:exists?).with("demo_token:#{token}").and_return(true)
  end

  it 'confirms subscription with a valid token' do
    subscribe token: token
    expect(subscription).to be_confirmed
  end

  it 'rejects with an invalid token' do
    allow(REDIS).to receive(:exists?).with('demo_token:bad').and_return(false)
    subscribe token: 'bad'
    expect(subscription).to be_rejected
  end

  it 'rejects with no token' do
    allow(REDIS).to receive(:exists?).with('demo_token:').and_return(false)
    subscribe token: nil
    expect(subscription).to be_rejected
  end

  it 'unsubscribes cleanly' do
    subscribe token: token
    expect { unsubscribe }.not_to raise_error
  end
end
