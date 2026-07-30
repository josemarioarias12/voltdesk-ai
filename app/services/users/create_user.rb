# frozen_string_literal: true

module Users
  class CreateUser
    def self.call(**args) = new(**args).call

    def initialize(workspace:, actor:, params:)
      @workspace = workspace
      @actor     = actor
      @params    = params
    end

    def call
      return ServiceResult.failure('Role is not assignable by this user.') unless role_assignable?

      raw_password = SecureRandom.alphanumeric(16)
      user = @workspace.users.build(
        first_name:            @params[:first_name],
        last_name:             @params[:last_name],
        email:                 @params[:email],
        role:                  @params[:role],
        department_id:         @params[:department_id],
        password:              raw_password,
        password_confirmation: raw_password
      )

      if user.save
        ServiceResult.success(user: user, temporary_password: raw_password)
      else
        ServiceResult.failure(user.errors.full_messages.join(', '))
      end
    rescue StandardError => e
      Rails.logger.error("[Users::CreateUser] #{e.message}")
      ServiceResult.failure('An unexpected error occurred.')
    end

    private

    def role_assignable?
      UserPolicy.new(@actor, User).assignable_roles.include?(@params[:role].to_s)
    end
  end
end
