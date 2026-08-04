# frozen_string_literal: true

module Admin
  class GovernanceController < BaseController
    def index
      authorize Ai::ModelGovernanceSuggestion
      suggestions = policy_scope(Ai::ModelGovernanceSuggestion).recent.filtered_by(filter_params)

      render inertia: 'Admin/Governance', props: {
        suggestions: suggestions.map { |s| serialize(s) },
        filters: filter_params.to_h
      }
    end

    def approve
      suggestion = Ai::ModelGovernanceSuggestion.find(params.expect(:id))
      authorize suggestion, :approve?
      suggestion.approve!(user: current_user)

      message = if suggestion.status_applied?
                  'Suggestion approved and price applied immediately.'
                else
                  'Suggestion approved.'
                end
      redirect_to admin_governance_path, notice: message
    end

    def reject
      suggestion = Ai::ModelGovernanceSuggestion.find(params.expect(:id))
      authorize suggestion, :reject?
      suggestion.reject!(user: current_user)
      redirect_to admin_governance_path, notice: 'Suggestion rejected.'
    end

    def mark_applied
      suggestion = Ai::ModelGovernanceSuggestion.find(params.expect(:id))
      authorize suggestion, :mark_applied?
      suggestion.mark_applied!
      redirect_to admin_governance_path, notice: 'Suggestion marked as applied.'
    end

    def sync_now
      authorize Ai::ModelGovernanceSuggestion, :sync_now?
      Ai::ModelGovernanceSyncJob.perform_later(Array(params[:check_type].presence || %w[pricing deprecation]))
      redirect_to admin_governance_path, notice: 'Governance check queued. Refresh in a moment.'
    end

    private

    def filter_params
      params.permit(:suggestion_type, :status)
    end

    def serialize(suggestion)
      {
        id: suggestion.id,
        suggestion_type: suggestion.suggestion_type,
        status: suggestion.status,
        provider: suggestion.provider,
        model: suggestion.model,
        result: suggestion.result,
        reviewed_by: suggestion.reviewed_by&.full_name,
        reviewed_at: suggestion.reviewed_at&.iso8601,
        applied_at: suggestion.applied_at&.iso8601,
        created_at: suggestion.created_at.iso8601
      }
    end
  end
end
