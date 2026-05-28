# frozen_string_literal: true

require 'webmock/rspec'

module AiStubs
  CLASSIFY_RESPONSE = {
    id: 'chatcmpl-test123',
    object: 'chat.completion',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: {
            category: 'IT Support',
            priority: 'high',
            urgency_score: 78,
            reasoning: {
              category_signals: ['impresora', 'no imprime'],
              priority_signals: ['cierre de mes', 'urgente'],
              similar_ticket: 'TK-00043',
              confidence: 0.92
            },
            tags: %w[hardware printing],
            suggested_agent: nil
          }.to_json
        },
        finish_reason: 'stop'
      }
    ],
    usage: { prompt_tokens: 245, completion_tokens: 98, total_tokens: 343 }
  }.freeze

  def stub_openai_classify
    stub_request(:post, 'https://api.openai.com/v1/chat/completions')
      .to_return(
        status: 200,
        body: CLASSIFY_RESPONSE.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_openai_failure
    stub_request(:post, 'https://api.openai.com/v1/chat/completions')
      .to_return(status: 500, body: { error: { message: 'Internal server error' } }.to_json)
  end
end

RSpec.configure do |config|
  config.include AiStubs
end
