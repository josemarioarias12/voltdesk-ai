# frozen_string_literal: true

# In test environment, disable Inertia version checking so request specs
# don't receive 409 Conflict responses. This is safe because tests don't
# serve real Vite assets.
if Rails.env.test?
  InertiaRails.configure do |config|
    config.version = nil
  end
end

# Temporary debug — remove after confirming
if Rails.env.test?
  Rails.logger.info("[InertiaTest] env=#{Rails.env} version=#{InertiaRails.configuration.version.inspect}")
end
