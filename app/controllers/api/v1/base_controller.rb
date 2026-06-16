# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      include ApiKeyAuthenticatable
      include MaskableSerializer

      skip_before_action :verify_authenticity_token
      skip_before_action :authenticate_user!, raise: false

      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: 'Record not found', code: 'not_found', status: 404 }, status: :not_found
      end

      rescue_from Pundit::NotAuthorizedError do
        render json: { error: 'Forbidden', code: 'forbidden', status: 403 }, status: :forbidden
      end

      rescue_from ActionController::ParameterMissing do |err|
        render json: { error: err.message, code: 'missing_parameter', status: 422 },
               status: :unprocessable_content
      end

      private

      def render_success(data, status: :ok)
        log_api_request(Rack::Utils::SYMBOL_TO_STATUS_CODE[status])
        render json: { data: data, status: Rack::Utils::SYMBOL_TO_STATUS_CODE[status] }, status: status
      end

      def render_error(message, code:, status:)
        log_api_request(Rack::Utils::SYMBOL_TO_STATUS_CODE[status])
        render json: { error: message, code: code, status: Rack::Utils::SYMBOL_TO_STATUS_CODE[status] },
               status: status
      end
    end
  end
end
