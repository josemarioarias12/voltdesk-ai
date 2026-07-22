# frozen_string_literal: true

module ComplianceLoggable
  extend ActiveSupport::Concern

  included do
    # No callbacks here — explicit calls only to avoid noise
  end

  def log_compliance_event(event_type:, resource:, metadata: {}, actor: current_user, workspace: current_workspace)
    ComplianceLog.create!(
      workspace:     workspace,
      actor:         actor,
      event_type:    event_type,
      resource_type: resource.class.name,
      resource_id:   resource.id,
      ip_address:    request.remote_ip,
      metadata:      metadata
    )
  rescue StandardError => e
    Rails.logger.error("[ComplianceLoggable] Failed to log event: #{e.message}")
  end

  private

  def current_workspace
    @current_workspace ||= Current.workspace
  end
end
