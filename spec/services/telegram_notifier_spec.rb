# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TelegramNotifier do
  describe '.send_prediction' do
    context 'when env vars are missing' do
      it 'returns without making HTTP call' do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('TELEGRAM_BOT_TOKEN', nil).and_return(nil)
        expect(Net::HTTP).not_to receive(:start)
        described_class.send_prediction(message: 'test', level: :info)
      end
    end

    context 'when env vars are present' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('TELEGRAM_BOT_TOKEN', nil).and_return('fake_token')
        allow(ENV).to receive(:fetch).with('TELEGRAM_CHAT_ID', nil).and_return('-123456')
      end

      def stub_http_and_capture
        captured_text = []
        mock_http = instance_double(Net::HTTP)
        allow(mock_http).to receive(:request) { |req| captured_text << JSON.parse(req.body)['text'] }
        allow(Net::HTTP).to receive(:start).and_wrap_original do |_orig, *_args, **_kwargs, &block|
          block.call(mock_http)
        end
        captured_text
      end

      it 'prefixes critical level correctly' do
        captured = stub_http_and_capture
        described_class.send_prediction(message: 'SLA breach', level: :critical)
        expect(captured.first).to eq('[CRITICAL] SLA breach')
      end

      it 'prefixes warning level correctly' do
        captured = stub_http_and_capture
        described_class.send_prediction(message: 'Anomaly detected', level: :warning)
        expect(captured.first).to eq('[WARNING] Anomaly detected')
      end

      it 'never raises when HTTP fails' do
        allow(Net::HTTP).to receive(:start).and_raise(StandardError, 'connection refused')
        expect do
          described_class.send_prediction(message: 'test', level: :info)
        end.not_to raise_error
      end
    end
  end
end
