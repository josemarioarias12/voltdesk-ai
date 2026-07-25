# frozen_string_literal: true

module Hr
  class LeavePolicyPreviewsController < ApplicationController
    def show
      authorize :leave_request, :create?

      result = Hr::PreviewLeavePolicy.call(
        workspace: current_workspace,
        user: current_user,
        leave_type: params[:leave_type],
        start_date: params[:start_date],
        end_date: params[:end_date]
      )

      if result.success?
        render json: result.data
      else
        render json: { error: result.error }, status: :unprocessable_content
      end
    end
  end
end
