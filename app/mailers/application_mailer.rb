# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'VoltDesk AI <noreply@voltdesk.app>'
  layout 'mailer'
end
