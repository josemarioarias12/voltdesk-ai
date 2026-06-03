# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :current_workspace

    def connect
      self.current_user      = find_verified_user
      self.current_workspace = current_user.workspace
    end

    private

    def find_verified_user
      if (user_id = cookies.encrypted[:user_id] || env['warden']&.user&.id)
        User.find_by(id: user_id) || reject_unauthorized_connection
      else
        reject_unauthorized_connection
      end
    end
  end
end
