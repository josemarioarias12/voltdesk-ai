# frozen_string_literal: true

class LeaveRequest < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :user
  belongs_to :approved_by, class_name: 'User', optional: true

  enum :leave_type, {
    vacation: 0,
    sick_leave: 1,
    personal: 2,
    maternity: 3,
    paternity: 4
  }

  enum :status, {
    pending: 0,
    approved: 1,
    rejected: 2
  }

  validates :leave_type, presence: true
  validates :start_date, presence: true
  validates :end_date,   presence: true
  validates :rejection_reason, presence: true, if: :rejected?

  validate :end_date_after_start_date
  validate :no_overlapping_approved_requests, on: :create

  scope :pending_approval, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }

  def business_days
    return 0 if start_date.nil? || end_date.nil?

    (start_date..end_date).count(&:on_weekday?)
  end

  private

  def end_date_after_start_date
    return unless start_date && end_date

    errors.add(:end_date, 'must be after start date') if end_date < start_date
  end

  def no_overlapping_approved_requests
    return unless start_date && end_date

    overlap = LeaveRequest
              .where(user: user, status: :approved)
              .exists?(['start_date <= ? AND end_date >= ?', end_date, start_date])

    errors.add(:base, 'overlaps with an existing approved request') if overlap
  end
end
