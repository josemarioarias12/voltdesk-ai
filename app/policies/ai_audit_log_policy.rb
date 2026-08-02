# frozen_string_literal: true

class AiAuditLogPolicy < ApplicationPolicy
  def view_trace?
    admin_or_above? && same_workspace?(record.workspace_id)
  end
end
