# frozen_string_literal: true

module Hr
  class SubmitClimateSurveyResponse
    def self.call(**args) = new(**args).call

    def initialize(survey:, user:, params:)
      @survey = survey
      @user   = user
      @params = params
    end

    def call
      return ServiceResult.failure('Survey is not currently accepting responses') unless @survey.active?
      return ServiceResult.failure('You are not eligible to respond to this survey') unless eligible?

      response = @survey.climate_survey_responses.build(@params.merge(user: @user))
      return ServiceResult.failure(response.errors.full_messages.join(', ')) unless response.save

      ServiceResult.success(response)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def eligible?
      @survey.eligible_users.exists?(id: @user.id)
    end
  end
end
