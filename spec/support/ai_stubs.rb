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
            category: 'it',
            priority: 'critical',
            urgency_score: 87,
            reasoning: {
              category_signals: ['printer', 'not working', 'paper jam'],
              priority_signals: ['month close', '2 hours', 'accounting'],
              confidence: 0.94,
              similar_ticket: 'TK-00189'
            },
            tags: %w[hardware printer accounting],
            suggested_agent: 'it_manager'
          }.to_json
        },
        finish_reason: 'stop'
      }
    ],
    usage: { prompt_tokens: 280, completion_tokens: 120, total_tokens: 400 }
  }.freeze

  EMBEDDING_RESPONSE = {
    object: 'list',
    data: [{ object: 'embedding', embedding: Array.new(1536, 0.1), index: 0 }],
    usage: { prompt_tokens: 42, total_tokens: 42 }
  }.freeze

  RAG_RESPONSE = {
    id: 'chatcmpl-rag123',
    object: 'chat.completion',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hi, we identified this as a hardware issue. Please restart the print spooler. Based on TK-00043 this resolves in 15 minutes.'
        },
        finish_reason: 'stop'
      }
    ],
    usage: { prompt_tokens: 480, completion_tokens: 95, total_tokens: 575 }
  }.freeze

  def stub_openai_classify(response = CLASSIFY_RESPONSE)
    stub_request(:post, 'https://api.openai.com/v1/chat/completions')
      .to_return(
        status: 200,
        body: response.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_openai_embeddings(response = EMBEDDING_RESPONSE)
    stub_request(:post, 'https://api.openai.com/v1/embeddings')
      .to_return(
        status: 200,
        body: response.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_openai_rag(response = RAG_RESPONSE)
    stub_request(:post, 'https://api.openai.com/v1/chat/completions')
      .to_return(
        status: 200,
        body: response.to_json,
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
