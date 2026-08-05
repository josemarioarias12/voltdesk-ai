# frozen_string_literal: true

module Ai
  class UrlReachabilityChecker
    TIMEOUT = 5

    def self.reachable?(url)
      new(url).reachable?
    end

    def initialize(url)
      @uri = URI(url)
    end

    def reachable?
      response = request(Net::HTTP::Head)
      response = request(Net::HTTP::Get) if response.is_a?(Net::HTTPMethodNotAllowed)
      response.is_a?(Net::HTTPSuccess)
    rescue StandardError => e
      Rails.logger.warn("[Ai::UrlReachabilityChecker] #{@uri}: #{e.message}")
      false
    end

    private

    def request(http_method_class)
      Net::HTTP.start(
        @uri.host, @uri.port, use_ssl: @uri.scheme == 'https', open_timeout: TIMEOUT, read_timeout: TIMEOUT
      ) { |http| http.request(http_method_class.new(@uri)) }
    end
  end
end
