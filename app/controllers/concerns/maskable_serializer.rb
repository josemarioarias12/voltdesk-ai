# frozen_string_literal: true

module MaskableSerializer
  extend ActiveSupport::Concern

  def mask(record, fields_hash, user)
    role = user.role.to_sym
    model = record.class.name

    fields_hash.each_with_object({}) do |(field, value), result|
      if DataMaskingPolicy.visible?(field: field, model: model, role: role)
        result[field] = value
      else
        result[field] = DataMaskingPolicy::REDACTED_VALUE
        log_access_denied(record, field, user)
      end
    end
  end

  private

  def log_access_denied(record, field, user)
    ComplianceLog.create!(
      workspace: record.workspace,
      actor: user,
      event_type: :data_access_denied,
      resource_type: record.class.name,
      resource_id: record.id,
      metadata: {
        field: field.to_s,
        model: record.class.name,
        accessor_role: user.role
      }
    )
    broadcast_access_denied(record.workspace, field, user)
  rescue StandardError => e
    Rails.logger.error("[MaskableSerializer] log_access_denied failed: #{e.message}")
  end

  def broadcast_access_denied(workspace, field, user)
    ActionCable.server.broadcast(
      "workspace_admin:#{workspace.id}",
      {
        event: 'data_access_denied',
        field: field.to_s,
        accessor_role: user.role,
        timestamp: Time.current.iso8601
      }
    )
  rescue StandardError => e
    Rails.logger.error("[MaskableSerializer] broadcast failed: #{e.message}")
  end
end
