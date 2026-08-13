# frozen_string_literal: true

module Admin
  class LearningController < Admin::BaseController
    def index
      corrections = ClassificationCorrection.for_workspace(current_workspace)
      last_30_days = corrections.where(created_at: 30.days.ago..)

      render inertia: 'Admin/Learning/Index', props: {
        total_corrections:       corrections.count,
        corrections_last_30_days: last_30_days.count,
        top_patterns:            build_top_patterns(corrections),
        learning_suggestion:     current_workspace.settings['learning_suggestion'],
        threshold:               50,
        correction_rate_trend:   build_trend(corrections)
      }
    end

    def apply
      result = Settings::ApplyLearningSuggestion.call(workspace: current_workspace)

      if result.success?
        redirect_to admin_learning_index_path, notice: 'Suggestion applied successfully.'
      else
        redirect_to admin_learning_index_path, alert: result.error
      end
    end

    def dismiss
      current_workspace.settings.delete('learning_suggestion')
      current_workspace.save!

      redirect_to admin_learning_index_path, notice: 'Suggestion dismissed.'
    end

    private

    def build_top_patterns(corrections)
      corrections
        .group(:original_category, :corrected_category)
        .order(count_all: :desc)
        .limit(3)
        .count
        .map do |(from, to), count|
          { from: from, to: to, count: count }
        end
    end

    def build_trend(corrections)
      Array.new(4) do |week_offset|
        week_start = (3 - week_offset).weeks.ago.beginning_of_week
        week_end   = week_start.end_of_week
        {
          week: week_start.strftime('%b %d'),
          count: corrections.where(created_at: week_start..week_end).count
        }
      end
    end
  end
end
