# frozen_string_literal: true

module Admin
  class GovernanceController < BaseController
    def index
      authorize Ai::ModelGovernanceSuggestion
      suggestions = policy_scope(Ai::ModelGovernanceSuggestion).recent

      suggestions = suggestions.where(suggestion_type: params[:suggestion_type]) if params[:suggestion_type].present?
      suggestions = suggestions.where(status: params[:status]) if params[:status].present?

      render inertia: 'Admin/Governance', props: {
        suggestions: suggestions.map { |s| serialize(s) },
        filters: { suggestion_type: params[:suggestion_type], status: params[:status] }
      }
    end

    def approve
      suggestion = Ai::ModelGovernanceSuggestion.find(params.expect(:id))
      authorize suggestion, :approve?
      suggestion.approve!(user: current_user)
      redirect_to admin_governance_path, notice: 'Suggestion approved.'
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
