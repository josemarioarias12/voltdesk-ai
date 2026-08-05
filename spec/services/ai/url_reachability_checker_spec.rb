# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::UrlReachabilityChecker do
  subject(:reachable) { described_class.reachable?(url) }

  let(:url) { 'https://example.com/models/gpt-4o' }

  it 'returns true when HEAD responds with 2xx' do
    stub_request(:head, url).to_return(status: 200)
    expect(reachable).to be true
  end

  it 'returns false when HEAD responds with 404' do
    stub_request(:head, url).to_return(status: 404)
    expect(reachable).to be false
  end

  it 'falls back to GET when HEAD is not allowed' do
    stub_request(:head, url).to_return(status: 405)
    stub_request(:get, url).to_return(status: 200)
    expect(reachable).to be true
  end

  it 'returns false when the request times out' do
    stub_request(:head, url).to_timeout
    expect(reachable).to be false
  end

  it 'returns false on connection errors' do
    stub_request(:head, url).to_raise(SocketError)
    expect(reachable).to be false
  end
end
