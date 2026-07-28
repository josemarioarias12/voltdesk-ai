# frozen_string_literal: true

module JsonErrorHandling
  extend ActiveSupport::Concern

  private

  def handle_not_found
    render json: { error: 'not_found' }, status: :not_found
  end

  def handle_unauthorized
    render json: { error: 'unauthorized' }, status: :forbidden
  end
end
