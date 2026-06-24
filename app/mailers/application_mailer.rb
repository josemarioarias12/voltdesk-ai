# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'PulseDesk AI <onboarding@resend.dev>'
  layout 'mailer'
end
