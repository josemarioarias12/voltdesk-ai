# frozen_string_literal: true

module Ai
  class ImageAnalyzer
    include AiAuditable

    IMAGE_TYPES   = %w[image/jpeg image/png image/gif image/webp].freeze
    MAX_SIZE      = 5 * 1024 * 1024
    RETRY_DELAYS  = [0.3, 0.6, 1.0].freeze

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

      data = download_with_retry(blob)
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

    def download_with_retry(blob, attempt: 0)
      blob.download
    rescue ActiveStorage::FileNotFoundError
      delay = RETRY_DELAYS[attempt]
      raise if delay.nil?

      sleep(delay)
      download_with_retry(blob, attempt: attempt + 1)
    end
  end
end
