# frozen_string_literal: true

module Settings
  class UpdateProfile
    def self.call(**args) = new(**args).call

    def initialize(user:, params:)
      @user = user
      @params = params
    end

    def call
      @user.avatar.purge if remove_avatar?
      @user.avatar.attach(@params[:avatar]) if @params[:avatar].present?
      @user.update!(@params.except(:avatar, :remove_avatar))
      ServiceResult.success(@user)
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.failure(e.message)
    end

    private

    def remove_avatar?
      ActiveModel::Type::Boolean.new.cast(@params[:remove_avatar])
    end
  end
end
