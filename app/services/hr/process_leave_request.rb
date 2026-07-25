# frozen_string_literal: true

module Hr
  class ProcessLeaveRequest
    include AiAuditable

    def self.call(**args) = new(**args).call

    def initialize(workspace:, user:, action: :create, options: {})
      @workspace     = workspace
      @user          = user
      @action        = action
      @params        = options.fetch(:params, {})
      @leave_request = options[:leave_request]
      @actor         = options[:actor]
    end

    def call
      case @action
      when :create then create_request
      when :approve        then approve_request
      when :final_approve  then final_approve_request
      when :reject         then reject_request
      end
    end

    private

    def create_request
      lr = @workspace.leave_requests.build(@params.merge(user: @user))
      return ServiceResult.failure(lr.errors.full_messages.join(', ')) unless lr.save

      Hr::NotifyLeaveRequest.call(leave_request: lr, event: :submitted)
      ServiceResult.success(lr)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    def approve_request
      return ServiceResult.failure('Leave request not found') unless @leave_request
      return ServiceResult.failure('Already processed') unless @leave_request.pending?

      if requires_second_approval?
        @leave_request.update!(status: :pending_second_approval, approved_by: @actor)
        Hr::NotifyLeaveRequest.call(leave_request: @leave_request, event: :pending_second_approval)
      else
        @leave_request.update!(status: :approved, approved_by: @actor)
        Hr::NotifyLeaveRequest.call(leave_request: @leave_request, event: :approved)
      end

      ServiceResult.success(@leave_request)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    def final_approve_request
      return ServiceResult.failure('Leave request not found') unless @leave_request
      return ServiceResult.failure('Already processed') unless @leave_request.pending_second_approval?

      @leave_request.update!(status: :approved, approved_by: @actor)
      Hr::NotifyLeaveRequest.call(leave_request: @leave_request, event: :approved)
      ServiceResult.success(@leave_request)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    def reject_request
      return ServiceResult.failure('Leave request not found') unless @leave_request
      unless @leave_request.pending? || @leave_request.pending_second_approval?
        return ServiceResult.failure('Already processed')
      end
      return ServiceResult.failure('Rejection reason is required') if @params[:rejection_reason].blank?

      @leave_request.update!(
        status: :rejected,
        approved_by: @actor,
        rejection_reason: @params[:rejection_reason]
      )
      Hr::NotifyLeaveRequest.call(leave_request: @leave_request, event: :rejected)
      ServiceResult.success(@leave_request)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    def requires_second_approval?
      policy = LeavePolicy.resolve(
        workspace: @workspace,
        department_id: @leave_request.department_id,
        leave_type: @leave_request.leave_type
      )
      return false unless policy&.requires_second_approval?

      @leave_request.business_days >= policy.second_approval_threshold_days
    end
  end
end
