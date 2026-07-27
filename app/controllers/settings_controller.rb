# frozen_string_literal: true

class SettingsController < ApplicationController
  before_action :authenticate_user!

  def index
    authorize :settings, :index?

    render inertia: 'Settings/Index', props: {
      workspace: workspace_ai_props,
      provider_models: Ai::ModelRouter::PROVIDER_MODELS,
      cost_table: build_cost_table,
      automation: workspace_automation_props,
      ticket_categories: Ticket.categories.keys
    }
  end

  def update_ai
    authorize :settings, :update_ai?

    result = Settings::UpdateAiConfig.call(
      workspace: current_workspace,
      params: ai_params
    )

    if result.success?
      redirect_to settings_path, notice: t('settings.ai_saved')
    else
      redirect_to settings_path, alert: result.error
    end
  end

  def update_automation
    authorize :settings, :update_automation?

    result = Settings::UpdateAutomationConfig.call(
      workspace: current_workspace,
      params: automation_params
    )

    if result.success?
      redirect_to settings_path, notice: t('settings.automation_saved')
    else
      redirect_to settings_path, alert: result.error
    end
  end

  private

  def workspace_ai_props
    w = current_workspace
    {
      ai_provider: w.ai_provider,
      ai_model: w.ai_model,
      ai_fallback_provider: w.ai_fallback_provider,
      ai_selection_mode: w.ai_selection_mode,
      ai_assistant_provider: w.ai_assistant_provider,
      ai_assistant_model: w.ai_assistant_model
    }
  end

  def workspace_automation_props
    s = current_workspace.settings
    {
      agent_urgency_threshold: s.fetch('agent_urgency_threshold', 60).to_f,
      agent_similarity_threshold: s.fetch('agent_similarity_threshold', 0.75).to_f,
      human_in_the_loop: s.fetch('human_in_the_loop', false),
      automatable_categories: s.fetch('automatable_categories', %w[it hr facilities])
    }
  end

  def build_cost_table
    Ai::ModelRouter::PROVIDER_MODELS.flat_map do |provider, models|
      models.map do |model|
        cost = Ai::ModelRouter.cost_per_1k(provider, model)
        {
          provider: provider,
          model: model,
          cost_per_1k_calls: (cost * 800).round(4)
        }
      end
    end
  end

  def ai_params
    params.expect(
      workspace: %i[ai_provider
                    ai_model
                    ai_fallback_provider
                    ai_selection_mode
                    ai_assistant_provider
                    ai_assistant_model]
    )
  end

  # rubocop:disable Rails/StrongParametersExpect
  def automation_params
    params.require(:workspace).permit(
      :agent_urgency_threshold,
      :agent_similarity_threshold,
      :human_in_the_loop,
      automatable_categories: []
    )
  end
  # rubocop:enable Rails/StrongParametersExpect
end
