# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::AnalyzeSurveyThemes do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:survey)     { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

  let(:ai_themes) do
    [
      { theme: 'Work-life balance', sentiment: 'negative', mentions: 4, example_quote: 'Overtime has become common.' },
      { theme: 'Team communication', sentiment: 'positive', mentions: 3, example_quote: 'Managers are approachable.' }
    ]
  end

  let(:ai_response) do
    { content: JSON.generate({ themes: ai_themes }), usage: { 'prompt_tokens' => 150, 'completion_tokens' => 200 } }
  end

  let(:adapter) { instance_double(Ai::Providers::OpenaiAdapter) }

  before do
    allow(Ai::ModelRouter).to receive(:for).and_return(
      instance_double(Ai::ModelRouter, resolve: [adapter, 'gpt-4o', 'openai'])
    )
    allow(adapter).to receive(:chat).and_return(ai_response)
  end

  describe '.call' do
    context 'when there are enough responses with feedback' do
      before do
        3.times do
          create(:climate_survey_response, climate_survey: survey, user: create(:user, workspace: workspace),
                                            feedback: 'Some feedback text here.')
        end
      end

      it 'stores the detected themes on the survey' do
        result = described_class.call(survey: survey)

        expect(result).to be_success
        expect(survey.reload.ai_themes.size).to eq(2)
        expect(survey.ai_themes.first['theme']).to eq('Work-life balance')
      end

      it 'creates an AiAuditLog entry' do
        expect { described_class.call(survey: survey) }.to change(AiAuditLog, :count).by(1)
      end

      it 'populates sentiment_score on responses with feedback' do
        described_class.call(survey: survey)

        scores = survey.climate_survey_responses.pluck(:sentiment_score)
        expect(scores).to all(be_present)
      end

      it 'returns failure when the AI response is invalid JSON' do
        allow(adapter).to receive(:chat).and_return({ content: 'not json', usage: {} })

        result = described_class.call(survey: survey)

        expect(result).to be_failure
        expect(result.error).to include('Invalid AI response format')
      end
    end

    context 'when there are too few responses with feedback' do
      before do
        create(:climate_survey_response, climate_survey: survey, user: create(:user, workspace: workspace),
                                          feedback: 'Only one response.')
      end

      it 'skips analysis without calling the AI adapter' do
        result = described_class.call(survey: survey)

        expect(result).to be_success
        expect(survey.reload.ai_themes).to eq([])
        expect(adapter).not_to have_received(:chat)
      end
    end
  end
end
