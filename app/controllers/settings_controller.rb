# frozen_string_literal: true

class SettingsController < ApplicationController
  before_action :authenticate_user!

  def index
    authorize :settings, :index?

    render inertia: 'Settings/Index', props: {
      workspace: workspace_ai_props,
      provider_models: Ai::ModelRouter::PROVIDER_MODELS,
      cost_table: build_cost_table
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

  private

  def workspace_ai_props
    w = current_workspace
    {
      ai_provider: w.ai_provider,
      ai_model: w.ai_model,
      ai_fallback_provider: w.ai_fallback_provider,
      ai_selection_mode: w.ai_selection_mode
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
                    ai_selection_mode]
    )
  end
end
