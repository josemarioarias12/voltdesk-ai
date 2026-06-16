# frozen_string_literal: true

# Content Security Policy — PulseDesk AI
# Nonce-based policy: no unsafe-inline for scripts, no unsafe-eval.
# Development: report-only mode to allow Vite HMR.
# Production: enforced.
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self

    if Rails.env.development?
      policy.script_src :self, :unsafe_eval, "http://#{ViteRuby.config.host_with_port}"
    else
      policy.script_src :self
    end

    policy.style_src :self, :unsafe_inline

    if Rails.env.development?
      policy.connect_src :self, 'wss:', 'ws:', "http://#{ViteRuby.config.host_with_port}"
    else
      policy.connect_src :self, 'wss:', 'ws:'
    end

    policy.img_src  :self, :data, :blob
    policy.font_src :self, :data
    policy.frame_ancestors :none
    policy.form_action :self
    policy.object_src :none
  end

  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src]
  config.content_security_policy_report_only = Rails.env.development?
end
