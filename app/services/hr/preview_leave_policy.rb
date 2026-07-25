# frozen_string_literal: true

module Hr
  class PreviewLeavePolicy
    def self.call(**args) = new(**args).call

    def initialize(workspace:, user:, leave_type:, start_date:, end_date:)
      @workspace  = workspace
      @user       = user
      @leave_type = leave_type
      @start_date = start_date
      @end_date   = end_date
    end

    def call
      ServiceResult.success(
        business_days: business_days,
        min_notice_days: policy&.min_notice_days,
        max_concurrent: policy&.max_concurrent,
        current_concurrent_count: if policy
                                    LeaveRequest.concurrent_count_for(workspace: @workspace,
                                                                      policy: policy)
                                  end
      )
    rescue ArgumentError
      ServiceResult.failure('Invalid dates')
    end

    private

    def business_days
      return 0 if @start_date.blank? || @end_date.blank?

      start_d = Date.parse(@start_date.to_s)
      end_d   = Date.parse(@end_date.to_s)
      return 0 if end_d < start_d

      (start_d..end_d).count(&:on_weekday?)
    end

    def policy
      return nil if @leave_type.blank?

      @policy ||= LeavePolicy.resolve(
        workspace: @workspace,
        department_id: @user.department_id,
        leave_type: @leave_type
      )
    end
  end
end
