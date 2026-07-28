# frozen_string_literal: true

module Settings
  class ProfileController < ApplicationController
    def show
      authorize current_user, :update?
      render inertia: 'Settings/Profile/Show', props: { user: serialize_user(current_user) }
    end

    def update
      authorize current_user, :update?
      result = Settings::UpdateProfile.call(user: current_user, params: profile_params)
      return redirect_to settings_profile_path, notice: 'Profile updated successfully.' if result.success?

      redirect_to settings_profile_path, alert: result.error
    end

    private

    def profile_params
      params.permit(:first_name, :last_name, :avatar, :remove_avatar)
    end
  end
end
