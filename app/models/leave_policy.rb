# frozen_string_literal: true

class LeavePolicy < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :department, optional: true

  enum :leave_type, {
    vacation: 0,
    sick_leave: 1,
    personal: 2,
    maternity: 3,
    paternity: 4,
    other: 5
  }, prefix: true

  validates :max_concurrent, numericality: { greater_than: 0 }, allow_nil: true
  validates :min_notice_days, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :second_approval_threshold_days,
            numericality: { greater_than: 0 },
            presence: true,
            if: :requires_second_approval?

  validate :department_belongs_to_workspace

  scope :active, -> { where(active: true) }

  def self.resolve(workspace:, department_id:, leave_type:)
    type_value = leave_types[leave_type.to_s]

    active.where(workspace: workspace).where(department_id: department_id, leave_type: type_value).first ||
      active.where(workspace: workspace).where(department_id: department_id, leave_type: nil).first ||
      active.where(workspace: workspace).where(department_id: nil, leave_type: type_value).first ||
      active.where(workspace: workspace).where(department_id: nil, leave_type: nil).first
  end

  private

  def department_belongs_to_workspace
    return unless department && workspace

    errors.add(:department, 'must belong to the same workspace') if department.workspace_id != workspace_id
  end
end
