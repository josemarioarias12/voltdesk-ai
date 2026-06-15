# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::SentimentTrending do
  let(:workspace)  { create(:workspace) }
  let(:dept_it)    { create(:department, workspace: workspace, name: 'IT') }
  let(:dept_hr)    { create(:department, workspace: workspace, name: 'HR') }
  let(:user)       { create(:user, workspace: workspace, department: dept_it) }

  def create_survey(dept:, sentiment:, days_ago: 5)
    ticket = create(:ticket,
                    workspace:   workspace,
                    department:  dept,
                    created_by:  user,
                    status:      :resolved,
                    resolved_at: days_ago.days.ago)
    create(:ticket_satisfaction_survey,
           workspace:    workspace,
           ticket:       ticket,
           department:   dept,
           submitted_by: user,
           sentiment_score: sentiment,
           rating:       3,
           created_at:   days_ago.days.ago)
  end

  describe '#call' do
    context 'with sentiment and ticket data' do
      subject(:result) { described_class.new(workspace: workspace, period: '30d').call }

      before do
        # IT dept: declining sentiment
        create_survey(dept: dept_it, sentiment: 0.8,  days_ago: 28)
        create_survey(dept: dept_it, sentiment: 0.5,  days_ago: 21)
        create_survey(dept: dept_it, sentiment: 0.2,  days_ago: 14)
        create_survey(dept: dept_it, sentiment: -0.1, days_ago: 7)

        # HR dept: stable positive
        create_survey(dept: dept_hr, sentiment: 0.7, days_ago: 28)
        create_survey(dept: dept_hr, sentiment: 0.6, days_ago: 14)
        create_survey(dept: dept_hr, sentiment: 0.7, days_ago: 7)

        # Extra tickets for volume (no surveys)
        5.times do
          create(:ticket,
                 workspace:  workspace,
                 department: dept_it,
                 created_by: user,
                 status:     :open,
                 created_at: 7.days.ago)
        end
      end

      it 'returns success' do
        expect(result).to be_success
      end

      it 'includes required keys' do
        expect(result.data.keys).to contain_exactly(
          :trends, :alerts, :period_days, :interval, :departments
        )
      end

      it 'returns trends for departments with data' do
        dept_names = result.data[:trends].pluck(:department_name)
        expect(dept_names).to include('IT')
      end

      it 'each trend has series data' do
        result.data[:trends].each do |trend|
          expect(trend[:series]).to be_an(Array)
          expect(trend[:series]).not_to be_empty
        end
      end

      it 'each series point has required fields' do
        point = result.data[:trends].first[:series].first
        expect(point.keys).to contain_exactly(
          :period, :avg_sentiment, :survey_count, :ticket_volume
        )
      end

      it 'detects sentiment drop alert for IT' do
        alerts = result.data[:alerts]
        it_alerts = alerts.find { |al| al[:department_name] == 'IT' }
        expect(it_alerts).to be_present
        alert_types = it_alerts[:alerts].pluck(:type)
        expect(alert_types).to include('sentiment_drop')
      end

      it 'computes summary with sentiment delta' do
        it_trend = result.data[:trends].find { |trend| trend[:department_name] == 'IT' }
        expect(it_trend[:summary][:sentiment_delta]).to be < 0
      end

      it 'scopes data to the workspace' do
        other_workspace = create(:workspace)
        other_dept      = create(:department, workspace: other_workspace)
        other_user      = create(:user, workspace: other_workspace)
        other_ticket    = create(:ticket, workspace: other_workspace,
                                 department: other_dept, created_by: other_user,
                                 status: :resolved, resolved_at: 1.day.ago)
        create(:ticket_satisfaction_survey,
               workspace: other_workspace, ticket: other_ticket,
               department: other_dept, submitted_by: other_user,
               sentiment_score: 0.9, rating: 5)

        result = described_class.new(workspace: workspace, period: '30d').call
        dept_ids = result.data[:trends].pluck(:department_id)
        expect(dept_ids).not_to include(other_dept.id)
      end
    end

    context 'with no survey data' do
      it 'returns success with empty trends' do
        result = described_class.new(workspace: workspace, period: '30d').call
        expect(result).to be_success
        expect(result.data[:trends]).to be_empty
        expect(result.data[:alerts]).to be_empty
      end
    end

    context 'with department filter' do
      before do
        create_survey(dept: dept_it, sentiment: 0.7, days_ago: 5)
        create_survey(dept: dept_hr, sentiment: 0.4, days_ago: 5)
      end

      it 'filters to requested department only' do
        result = described_class.new(
          workspace:     workspace,
          period:        '30d',
          department_id: dept_it.id
        ).call
        dept_names = result.data[:trends].pluck(:department_name)
        expect(dept_names).to eq(['IT'])
      end
    end
  end
end
