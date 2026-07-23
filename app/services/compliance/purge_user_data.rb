# frozen_string_literal: true

module Compliance
  class PurgeUserData
    ANONYMIZED_NAME  = '[DELETED]'
    ANONYMIZED_EMAIL = ->(uid) { "deleted_user_#{uid}@purged.invalid" }

    def initialize(user:, requested_by:, workspace:)
      @user         = user
      @requested_by = requested_by
      @workspace    = workspace
    end

    def call
      return ServiceResult.failure('User not found') unless @user
      return ServiceResult.failure('Cannot purge a super_admin') if @user.role_super_admin?

      ActiveRecord::Base.transaction do
        anonymize_user!
        nullify_ticket_assignments!
        anonymize_leave_requests!
        destroy_webauthn_credentials!
        log_purge_event!
      end

      ServiceResult.success({ purged_user_id: @user.id })
    rescue StandardError => e
      Rails.logger.error("[PurgeUserData] Failed: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def anonymize_user!
      @user.update!(
        email:                ANONYMIZED_EMAIL.call(@user.id),
        first_name:           '[DELETED]',
        last_name:            '[DELETED]',
        provider:             nil,
        uid:                  nil,
        reset_password_token: nil
      )
    end

    def nullify_ticket_assignments!
      # assigned_to is optional — nullify directly
      Ticket.where(assigned_to_id: @user.id)
            .update_all(assigned_to_id: nil) # rubocop:disable Rails/SkipsModelValidations

      # created_by is NOT NULL — reassign to ghost user (GDPR + referential integrity)
      ghost = find_or_create_ghost_user
      Ticket.where(created_by_id: @user.id)
            .update_all(created_by_id: ghost.id) # rubocop:disable Rails/SkipsModelValidations
    end

    def find_or_create_ghost_user
      ghost_email = "ghost@#{@workspace.slug}.system"
      User.find_or_create_by!(email: ghost_email) do |usr|
        usr.first_name         = '[SYSTEM]'
        usr.last_name          = 'Ghost'
        usr.workspace          = @workspace
        usr.role               = :agent
        usr.password           = SecureRandom.hex(32)
        usr.password_confirmation = usr.password
      end
    end

    def anonymize_leave_requests!
      # Leave requests preserved for HR audit trail — redact reason text only
      LeaveRequest.where(user: @user).update_all(reason: '[REDACTED]') # rubocop:disable Rails/SkipsModelValidations
    end

    def destroy_webauthn_credentials!
      # A purged user must not retain a working Face ID / passkey tied to their
      # (now anonymized) identity — destroy, don't just orphan.
      @purged_webauthn_count = @user.webauthn_credentials.destroy_all.size
    end

    def log_purge_event!
      ComplianceLog.create!(
        workspace:     @workspace,
        actor:         @requested_by,
        event_type:    :data_purge,
        resource_type: 'User',
        resource_id:   @user.id,
        ip_address:    nil,
        metadata:      {
          purged_at:                  Time.current.iso8601,
          requested_by:               @requested_by.id,
          reason:                     'GDPR Right to Forget',
          webauthn_credentials_purged: @purged_webauthn_count || 0
        }
      )
    end
  end
end
