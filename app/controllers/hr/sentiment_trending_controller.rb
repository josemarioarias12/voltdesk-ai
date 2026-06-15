# frozen_string_literal: true

module Hr
  class SentimentTrendingController < ApplicationController
    before_action :authenticate_user!

    def index
      authorize :sentiment_trending, :index?
      result = Analytics::SentimentTrending.new(
        workspace:     current_workspace,
        period:        params.fetch(:period, '30d'),
        department_id: params[:department_id]
      ).call

      render inertia: 'HR/SentimentTrending/Index', props: {
        data:    result.success? ? result.data : nil,
        error:   result.success? ? nil : result.error,
        period:  params.fetch(:period, '30d')
      }
    end
  end
end
