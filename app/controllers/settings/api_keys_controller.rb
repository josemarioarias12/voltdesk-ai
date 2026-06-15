# frozen_string_literal: true

module Settings
  class ApiKeysController < ApplicationController
    before_action :authenticate_user!

    def index
      authorize current_workspace, :manage_api_keys?
      api_keys = current_workspace.api_keys.includes(:user).order(created_at: :desc)
      render inertia: 'Settings/ApiKeys/Index', props: {
        api_keys: api_keys.map { |key| serialize_key(key) }
      }
    end

    def create
      authorize current_workspace, :manage_api_keys?
      token, digest = ApiKey.generate_token
      result = Settings::CreateApiKey.call(
        workspace: current_workspace,
        user:      current_user,
        params:    api_key_params,
        digest:    digest
      )

      if result.success?
        render inertia: 'Settings/ApiKeys/Index', props: {
          api_keys:  current_workspace.api_keys.includes(:user).order(created_at: :desc)
                                      .map { |key| serialize_key(key) },
          new_token: token
        }
      else
        redirect_to settings_api_keys_path, alert: result.error
      end
    end

    def destroy
      authorize current_workspace, :manage_api_keys?
      api_key = current_workspace.api_keys.find(params.expect(:id))
      api_key.revoke!
      redirect_to settings_api_keys_path, notice: 'API key revoked.'
    end

    private

    def api_key_params
      params.expect(api_key: [:name, { scopes: [] }])
    end

    def serialize_key(key)
      {
        id:           key.id,
        name:         key.name,
        scopes:       key.scopes,
        last_used_at: key.last_used_at&.iso8601,
        created_at:   key.created_at.iso8601,
        active:       key.active,
        created_by:   key.user&.full_name,
        masked_key:   "sk_live_#{'•' * 20}#{key.key_digest.last(4)}"
      }
    end
  end
end
