# frozen_string_literal: true

require 'simplecov'
SimpleCov.start 'rails' do
  add_filter '/spec/'
  add_filter '/config/'
  add_filter '/db/'
  add_filter '/vendor/'
  add_filter '/bin/'
  add_group 'Services',    'app/services'
  add_group 'Controllers', 'app/controllers'
  add_group 'Models',      'app/models'
  add_group 'Jobs',        'app/jobs'
  add_group 'Policies',    'app/policies'
end

require 'spec_helper'
require 'webmock/rspec'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort('The Rails environment is running in production mode!') if Rails.env.production?
require 'rspec/rails'
require 'pundit/matchers'

Rails.root.glob('spec/support/**/*.rb').each { |f| require f }

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

# Force Inertia version to nil in test to avoid 409 conflicts in request specs
InertiaRails.configuration.version = nil

RSpec.configure do |config|
  config.before { ActiveJob::Base.queue_adapter = :test }
  config.after  { Current.reset }
  config.fixture_paths = [Rails.root.join('spec/fixtures')]
  config.use_transactional_fixtures = false
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  config.include FactoryBot::Syntax::Methods
  config.include Pundit::Matchers
  config.include ActiveSupport::Testing::TimeHelpers

  Shoulda::Matchers.configure do |shoulda_config|
    shoulda_config.integrate do |with|
      with.test_framework :rspec
      with.library :rails
    end
  end
end
