# frozen_string_literal: true

FactoryBot.define do
  factory :climate_survey_response do
    association :climate_survey, :active
    association :user

    rating { 4 }
    recommend_score { 4 }
    feedback { 'Generally positive experience working here.' }
  end
end
