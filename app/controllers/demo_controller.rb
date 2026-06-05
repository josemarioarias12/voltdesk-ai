# frozen_string_literal: true

class DemoController < ApplicationController
  skip_before_action :authenticate_user!, only: %i[join create_ticket]

  def join
    result = DemoModes::ValidateToken.call(token: params[:token])

    return render inertia: 'Demo/Expired', props: { reason: result.error.to_s } unless result.success?

    data      = result.data
    workspace = data[:workspace]

    sign_out(current_user) if user_signed_in?

    guest = workspace.users.create!(
      email:      "guest-#{SecureRandom.hex(8)}@demo.pulsedesk.internal",
      password:   SecureRandom.hex(16),
      role:       :guest,
      first_name: 'Guest',
      last_name:  "Demo-#{SecureRandom.hex(4)}",
      active:     true
    )

    sign_in(guest)
    session[:demo_token] = params[:token]

    render inertia: 'Demo/CreateTicket', props: {
      workspace_name: workspace.name,
      expires_in:     data[:expires_in],
      guest_count:    data[:guest_count],
      departments:    workspace.departments.map { |dep| { id: dep.id, name: dep.name } }
    }
  end

  def create_ticket
    authorize session[:demo_token], policy_class: GuestPolicy, query: :create_ticket?

    result = Tickets::CreateTicket.call(
      workspace: current_workspace,
      user:      current_user,
      params:    ticket_params.merge(source: 'qr_demo')
    )

    if result.success?
      render inertia: 'Demo/TicketCreated', props: { ticket_number: result.data.ticket_number }
    else
      redirect_back_or_to demo_join_path(session[:demo_token]), alert: result.error
    end
  end

  def presenter
    authorize current_workspace, :manage_demo?, policy_class: WorkspacePolicy

    render inertia: 'Demo/Presenter', props: { token: params[:token], workspace_name: current_workspace.name }
  end

  private

  def ticket_params
    params.expect(ticket: %i[title description department_id priority])
  end
end
