# frozen_string_literal: true

module Settings
  class UpdateProfile
    def self.call(**args) = new(**args).call

    def initialize(user:, params:)
      @user = user
      @params = params
    end

    def call
      @user.avatar.attach(@params[:avatar]) if @params[:avatar].present?
      @user.update!(@params.except(:avatar))
      ServiceResult.success(@user)
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.failure(e.message)
    end
  end
end
