# frozen_string_literal: true

module Hr
  class CheckLeaveCoverage
    def self.call(**args) = new(**args).call

    def initialize(leave_request:)
      @leave_request = leave_request
    end

    def call
      ServiceResult.success(overlapping_conflicts)
    end

    private

    def overlapping_conflicts
      return LeaveRequest.none unless @leave_request.department_id

      LeaveRequest
        .where(workspace_id: @leave_request.workspace_id, department_id: @leave_request.department_id)
        .where(status: %i[approved pending_second_approval])
        .where.not(id: @leave_request.id)
        .where.not(user_id: @leave_request.user_id)
        .where('start_date <= ? AND end_date >= ?', @leave_request.end_date, @leave_request.start_date)
        .includes(:user)
        .order(:start_date)
    end
  end
end
