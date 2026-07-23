# frozen_string_literal: true

class TelegramNotifier
  BASE_URL = 'https://api.telegram.org'

  LEVEL_PREFIXES = {
    critical: '[CRITICAL]',
    warning:  '[WARNING]',
    info:     '[INFO]'
  }.freeze

  def self.send_prediction(message:, level: :info, link: nil, link_label: 'View ticket')
    new.send_prediction(message: message, level: level, link: link, link_label: link_label)
  end

  def send_prediction(message:, level: :info, link: nil, link_label: 'View ticket')
    token   = ENV.fetch('TELEGRAM_BOT_TOKEN', nil)
    chat_id = ENV.fetch('TELEGRAM_CHAT_ID', nil)
    return unless token.present? && chat_id.present?

    prefix = LEVEL_PREFIXES.fetch(level.to_sym, LEVEL_PREFIXES[:info])
    send_message(
      token: token,
      chat_id: chat_id,
      text: "#{prefix} #{message}",
      reply_markup: build_reply_markup(link: link, link_label: link_label)
    )
  rescue StandardError => e
    Rails.logger.warn("[TelegramNotifier] #{e.message}")
  end

  private

  def build_reply_markup(link:, link_label:)
    return nil if link.blank?

    { inline_keyboard: [[{ text: link_label, url: link }]] }
  end

  def send_message(token:, chat_id:, text:, reply_markup: nil)
    uri = URI("#{BASE_URL}/bot#{token}/sendMessage")
    req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
    body = { chat_id: chat_id, text: text }
    body[:reply_markup] = reply_markup if reply_markup
    req.body = body.to_json
    Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 5) do |http|
      http.request(req)
    end
  end
end
