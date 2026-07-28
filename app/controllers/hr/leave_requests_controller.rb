# frozen_string_literal: true

module Hr
  class LeaveRequestsController < ApplicationController
    include MaskableSerializer
    include ComplianceLoggable

    before_action :set_leave_request, only: %i[show approve reject]

    def index
      authorize :leave_request, :index?
      requests = policy_scope(LeaveRequest).includes(:approved_by, user: :department).recent
      render inertia: 'HR/LeaveRequests/Index', props: {
        leave_requests: requests.map { |lr| serialize_leave_request(lr) },
        stats: build_stats(requests)
      }
    end

    def show
      authorize @leave_request
      render inertia: 'HR/LeaveRequests/Show', props: {
        leave_request: serialize_leave_request(@leave_request)
      }
    end

    def new
      authorize :leave_request, :create?
      render inertia: 'HR/LeaveRequests/New', props: {
        leave_types: LeaveRequest.leave_types.keys
      }
    end

    def create
      authorize :leave_request, :create?
      result = Hr::ProcessLeaveRequest.call(
        workspace: current_workspace,
        user: current_user,
        action: :create,
        options: { params: leave_request_params }
      )
      if result.success?
        redirect_to hr_leave_requests_path, notice: t('hr.leave_requests.created')
      else
        redirect_back_or_to(new_hr_leave_request_path, alert: result.error)
      end
    end

    def approve
      if @leave_request.pending_second_approval?
        authorize @leave_request, :final_approve?
        action = :final_approve
      else
        authorize @leave_request, :approve?
        action = :approve
      end

      result = Hr::ProcessLeaveRequest.call(
        workspace: current_workspace,
        user: current_user,
        action: action,
        options: { leave_request: @leave_request, actor: current_user }
      )

      if result.success?
        log_leave_decision(:approved)
        redirect_to hr_leave_requests_path, notice: approval_notice(@leave_request.reload)
      else
        redirect_back_or_to(hr_leave_request_path(@leave_request), alert: result.error)
      end
    end

    def reject
      authorize @leave_request, :reject?
      result = Hr::ProcessLeaveRequest.call(
        workspace: current_workspace,
        user: current_user,
        action: :reject,
        options: {
          leave_request: @leave_request,
          actor: current_user,
          params: { rejection_reason: params[:rejection_reason] }
        }
      )
      if result.success?
        log_leave_decision(:rejected)
        redirect_to hr_leave_requests_path, notice: t('hr.leave_requests.rejected')
      else
        redirect_back_or_to(hr_leave_request_path(@leave_request), alert: result.error)
      end
    end

    private

    def set_leave_request
      @leave_request = policy_scope(LeaveRequest).find(params.expect(:id))
    end

    def leave_request_params
      params.expect(leave_request: %i[leave_type start_date end_date reason coverage_plan
                                      medical_notes doctor_certificate])
    end

    def approval_notice(leave_request)
      if leave_request.pending_second_approval?
        t('hr.leave_requests.pending_second_approval')
      else
        t('hr.leave_requests.approved')
      end
    end

    def log_leave_decision(decision)
      log_compliance_event(
        event_type: :leave_request_decision,
        resource: @leave_request,
        metadata: {
          decision: decision.to_s,
          leave_type: @leave_request.leave_type,
          had_medical_notes: @leave_request.medical_notes.present?
        }
      )
    end

    def build_stats(requests)
      {
        pending_count: requests.pending_approval.count,
        approved_this_month: requests.approved.where(updated_at: Date.current.beginning_of_month..).count,
        on_leave_today: requests.approved.where('start_date <= ? AND end_date >= ?', Time.zone.today,
                                                Time.zone.today).count
      }
    end

    def serialize_leave_request(leave_req)
      leave_policy = policy(leave_req)

      base = {
        id: leave_req.id,
        leave_type: leave_req.leave_type,
        start_date: leave_req.start_date,
        end_date: leave_req.end_date,
        status: leave_req.status,
        reason: leave_req.reason,
        coverage_plan: leave_req.coverage_plan,
        rejection_reason: leave_req.rejection_reason,
        business_days: leave_req.business_days,
        created_at: leave_req.created_at.iso8601,
        user: serialize_lr_user(leave_req.user),
        approved_by: serialize_lr_approver(leave_req.approved_by),
        can_approve: leave_policy.approve?,
        can_reject: leave_policy.reject?,
        can_final_approve: leave_policy.final_approve?
      }

      sensitive = mask(leave_req, {
                         medical_notes: leave_req.medical_notes,
          doctor_certificate_url: certificate_url_for(leave_req)
                       }, current_user)

      base.merge(sensitive)
    end

    def serialize_lr_user(usr)
      {
        id: usr.id,
        full_name: usr.full_name,
        email: usr.email,
        role: usr.role,
        department: usr.department&.name,
        avatar_url: usr.avatar.attached? ? url_for(usr.avatar) : nil
      }
    end

    def serialize_lr_approver(approver)
      return nil unless approver

      { id: approver.id, full_name: approver.full_name }
    end

    def certificate_url_for(leave_req)
      return nil unless leave_req.doctor_certificate.attached?

      url_for(leave_req.doctor_certificate)
    end
  end
end
