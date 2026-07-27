# frozen_string_literal: true

module Ai
  module Tools
    class LeaveRequestsOverview < Base
      def self.tool_name = 'leave_requests_overview'

      def self.description
        'Returns leave request counts and status breakdown for the leave requests the ' \
          'current user has access to — the exact same scope as their own HR/Leave ' \
          'Requests page. For most roles (employee, agent, and non-HR managers like IT/' \
          'Facilities/Operations) this means only their own requests. For a department ' \
          'manager it means their whole department. For hr_manager, workspace_admin, and ' \
          'super_admin it means the entire workspace. Use this for phrasing like "my leave ' \
          'requests", "pending approvals", or "who is out this month" — the scope always ' \
          'matches what that specific user can see, not a fixed role tier.'
      end

      # Guests have no HR access at all — every other role has at least
      # visibility into their own leave requests.
      def self.visible_to?(user)
        !user.role_guest?
      end

      def call(**_params)
        requests = LeaveRequestPolicy::Scope.new(@user, LeaveRequest.where(workspace: @workspace)).resolve

        ServiceResult.success(
          total: requests.count,
          by_status: requests.group(:status).count,
          by_leave_type: requests.group(:leave_type).count,
          pending_count: requests.pending_approval.count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
