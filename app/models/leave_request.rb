# frozen_string_literal: true

class LeaveRequest < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :user
  belongs_to :approved_by, class_name: 'User', optional: true
  belongs_to :department, optional: true

  enum :leave_type, {
    vacation: 0,
    sick_leave: 1,
    personal: 2,
    maternity: 3,
    paternity: 4,
    other: 5
  }

  enum :status, {
    pending: 0,
    approved: 1,
    rejected: 2,
    pending_second_approval: 3
  }

  validates :leave_type, presence: true
  validates :start_date, presence: true
  validates :end_date,   presence: true
  validates :rejection_reason, presence: true, if: :rejected?

  before_validation :assign_department_from_user

  validate :end_date_after_start_date
  validate :start_date_not_in_past, on: :create
  validate :no_overlapping_approved_requests, on: :create
  validate :leave_cap_not_exceeded, on: :create
  validate :respects_minimum_notice, on: :create

  scope :pending_approval, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }

  def self.concurrent_count_for(workspace:, policy:)
    scope = where(workspace: workspace, status: %i[pending approved])
    scope = scope.where(department_id: policy.department_id) if policy.department_id
    scope = scope.where(leave_type: policy.leave_type) if policy.leave_type
    scope.count
  end

  def business_days
    return 0 if start_date.nil? || end_date.nil?

    (start_date..end_date).count(&:on_weekday?)
  end

  private

  def assign_department_from_user
    self.department_id ||= user&.department_id
  end

  def end_date_after_start_date
    return unless start_date && end_date

    errors.add(:end_date, 'must be after start date') if end_date < start_date
  end

  def start_date_not_in_past
    return unless start_date

    errors.add(:start_date, "can't be in the past") if start_date < Time.zone.today
  end

  def no_overlapping_approved_requests
    return unless start_date && end_date

    overlap = LeaveRequest
              .where(user: user, status: :approved)
              .exists?(['start_date <= ? AND end_date >= ?', end_date, start_date])

    errors.add(:base, 'overlaps with an existing approved request') if overlap
  end

  def leave_cap_not_exceeded
    return unless applicable_leave_policy&.max_concurrent

    concurrent_count = self.class.concurrent_count_for(workspace: workspace, policy: applicable_leave_policy)
    return if concurrent_count < applicable_leave_policy.max_concurrent

    cap = applicable_leave_policy.max_concurrent
    errors.add(:base, "Department has reached its limit of #{cap} concurrent leave requests")
  end

  def respects_minimum_notice
    return unless applicable_leave_policy&.min_notice_days && start_date

    days_until_start = (start_date - Time.zone.today).to_i
    return if days_until_start >= applicable_leave_policy.min_notice_days

    errors.add(:start_date, "must be requested at least #{applicable_leave_policy.min_notice_days} days in advance")
  end

  def applicable_leave_policy
    return nil unless department_id && leave_type

    @applicable_leave_policy ||= LeavePolicy.resolve(
      workspace: workspace,
      department_id: department_id,
      leave_type: leave_type
    )
  end
end
