# frozen_string_literal: true

module Admin
  class ComplianceController < ApplicationController
    before_action :set_workspace

    def show
      authorize @workspace, :compliance_report?
      result = Compliance::GenerateReport.new(
        workspace:    @workspace,
        period_start: period_start,
        period_end:   period_end
      ).call
      render inertia: 'Admin/Compliance/Show',
             props: { evidence: result.data[:evidence], period: period_params }
    end

    def download_pdf
      authorize @workspace, :compliance_report?
      result = Compliance::GenerateReport.new(
        workspace:    @workspace,
        period_start: period_start,
        period_end:   period_end
      ).call
      return redirect_back_or_to admin_compliance_path, alert: result.error if result.failure?

      send_data result.data[:pdf],
                filename:    "compliance_report_#{@workspace.slug}_#{Time.zone.today}.pdf",
                type:        'application/pdf',
                disposition: 'attachment'
    end

    def purge_user
      user = @workspace.users.find(params.expect(:user_id))
      authorize user, :purge?
      result = Compliance::PurgeUserData.new(
        user:         user,
        requested_by: current_user,
        workspace:    @workspace
      ).call
      log_compliance_event(event_type: :gdpr_request, resource: user,
                           metadata: { action: 'purge', result: result.success? })
      if result.success?
        redirect_to admin_compliance_path, notice: 'User data purged successfully.'
      else
        redirect_back_or_to admin_compliance_path, alert: result.error
      end
    end

    private

    def set_workspace
      @workspace = current_workspace
    end

    def period_start
      period_params[:start_date]&.to_date || 3.months.ago.to_date
    end

    def period_end
      period_params[:end_date]&.to_date || Time.zone.today
    end

    def period_params
      params.permit(:start_date, :end_date)
    end
  end
end
