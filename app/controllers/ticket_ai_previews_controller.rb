# frozen_string_literal: true

class TicketAiPreviewsController < ApplicationController
  def show
    authorize :ticket, :create?

    title       = params[:title].to_s.strip
    description = params[:description].to_s.strip

    if title.blank? && description.length < 10
      return render json: { error: 'insufficient_input' }, status: :unprocessable_content
    end

    result = Tickets::AiPreview.call(title: title, description: description)
    render json: result.data
  end
end
