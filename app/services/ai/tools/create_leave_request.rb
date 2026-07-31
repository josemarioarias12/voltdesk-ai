# frozen_string_literal: true

module Ai
  module Tools
    class CreateLeaveRequest < Base
      def self.tool_name = 'create_leave_request'

      def self.description
        'Creates a new leave request for the current user, following a two-step confirm-before-execute flow. ' \
          'The first call (confirmed omitted or false) validates the request WITHOUT saving it and returns a ' \
          'preview summary, including any applicable minimum notice period or concurrent-request limit from ' \
          'the workspace leave policy. Only call this tool again with confirmed: true — reusing the EXACT ' \
          'same parameters returned in the preview — after the user has explicitly confirmed.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            leave_type: {
              type: 'string',
              enum: LeaveRequest.leave_types.keys,
              description: 'Type of leave being requested.'
            },
            start_date: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format.'
            },
            end_date: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format.'
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true only on the second call, after explicit user confirmation. ' \
                           'Defaults to false.'
            }
          },
          required: %w[leave_type start_date end_date]
        }
      end

      def self.visible_to?(user)
        LeaveRequestPolicy.new(user, :leave_request).create?
      end

      def call(leave_type:, start_date:, end_date:, confirmed: false)
        leave_request_params = { leave_type: leave_type, start_date: start_date, end_date: end_date }

        return execute(leave_request_params) if confirmed

        preview(leave_request_params)
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def preview(leave_request_params)
        lr = @workspace.leave_requests.new(leave_request_params.merge(user: @user))
        return ServiceResult.failure(lr.errors.full_messages.join(', ')) unless lr.valid?

        policy = lr.applicable_leave_policy

        ServiceResult.success(
          preview: true,
          summary: {
            leave_type: lr.leave_type,
            start_date: lr.start_date,
            end_date: lr.end_date,
            business_days: lr.business_days,
            min_notice_days: policy&.min_notice_days,
            max_concurrent: policy&.max_concurrent
          },
          params: leave_request_params
        )
      end

      def execute(leave_request_params)
        Hr::ProcessLeaveRequest.call(
          workspace: @workspace, user: @user, action: :create, options: { params: leave_request_params }
        )
      end
    end
  end
end
