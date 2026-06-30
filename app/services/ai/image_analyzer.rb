# frozen_string_literal: true

module Ai
  class ImageAnalyzer
    include AiAuditable

    IMAGE_TYPES = %w[image/jpeg image/png image/gif image/webp].freeze
    MAX_SIZE    = 5 * 1024 * 1024

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket = ticket
    end

    def call
      attachment = find_image_attachment
      return ServiceResult.failure('no_images') unless attachment

      blob = attachment.blob
      return ServiceResult.failure('image_too_large') if blob.byte_size > MAX_SIZE

      data = fetch_blob_bytes(blob)
      ServiceResult.success(
        base64:       Base64.strict_encode64(data),
        content_type: blob.content_type,
        filename:     blob.filename.to_s
      )
    rescue StandardError => e
      Rails.logger.warn("[ImageAnalyzer] ticket=#{@ticket.id} #{e.class}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def find_image_attachment
      @ticket.attachments
             .joins(:blob)
             .where(active_storage_blobs: { content_type: IMAGE_TYPES })
             .first
    end

    # Fetch via HTTP instead of local disk read — Railway runs web and
    # Sidekiq as separate containers with separate filesystems, so a
    # blob written by the web process is not visible to Sidekiq's disk.
    def fetch_blob_bytes(blob)
      ActiveStorage::Current.url_options ||= default_url_options
      url = blob.url(expires_in: 5.minutes)
      uri = URI(url)

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 5,
                                                       read_timeout: 10) do |http|
        http.get(uri.request_uri)
      end

      raise "HTTP #{response.code} fetching blob" unless response.is_a?(Net::HTTPSuccess)

      response.body
    end

    def default_url_options
      host = ENV.fetch('APP_HOST', 'localhost')
      { host: host, protocol: Rails.env.production? ? 'https' : 'http' }
    end
  end
end
