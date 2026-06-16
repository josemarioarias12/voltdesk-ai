# frozen_string_literal: true

class DataMaskingPolicy
  REDACTED_VALUE = '[REDACTED]'

  SENSITIVE_FIELDS = {
    'User' => {
      salary:       %i[hr_manager workspace_admin],
      bank_account: %i[hr_manager workspace_admin]
    },
    'LeaveRequest' => {
      medical_notes:          %i[hr_manager workspace_admin],
      doctor_certificate_url: %i[hr_manager workspace_admin]
    },
    'Asset' => {
      purchase_price:      %i[it_manager workspace_admin],
      vendor_contract_url: %i[it_manager workspace_admin]
    }
  }.freeze

  def self.visible?(field:, model:, role:)
    return true if role == :super_admin

    allowed_roles = SENSITIVE_FIELDS.dig(model.to_s, field.to_sym)
    return true if allowed_roles.nil?

    allowed_roles.include?(role.to_sym)
  end

  def self.sensitive_fields(model:)
    SENSITIVE_FIELDS.fetch(model.to_s, {}).keys
  end
end
