# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  FROM_ADDRESS = 'VoltDesk AI <noreply@voltdesk.app>'

  default from: FROM_ADDRESS
  layout 'mailer'
end
