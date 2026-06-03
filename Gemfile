# frozen_string_literal: true

source 'https://rubygems.org'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem 'rails', '~> 8.1.3'
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem 'propshaft'
# Use postgresql as the database for Active Record
gem 'pg', '~> 1.1'
# Use the Puma web server [https://github.com/puma/puma]
gem 'puma', '>= 5.0'
# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
gem 'importmap-rails'
# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem 'turbo-rails'
# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem 'stimulus-rails'
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem 'jbuilder'

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[windows jruby]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem 'solid_cable'
gem 'solid_cache'
gem 'solid_queue'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem 'kamal', require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem 'thruster', require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem 'image_processing', '~> 1.2'

group :development, :test do
  gem 'brakeman', require: false
  gem 'bundler-audit', require: false
  gem 'debug', platforms: %i[mri windows], require: 'debug/prelude'
  gem 'dotenv-rails'
  gem 'rubocop-rails-omakase', require: false
end

group :development do
  gem 'rubocop-performance', '~> 1.26'
  gem 'rubocop-rails'
  gem 'rubocop-rspec', '~> 3.9'
end

group :test do
  gem 'database_cleaner-active_record'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'rspec-rails', '~> 8.0'
  gem 'shoulda-matchers'
  gem 'simplecov', require: false
  gem 'webmock'
end

gem 'inertia_rails', '~> 3.21'
gem 'pundit', '~> 2.5'
gem 'vite_rails', '~> 3.11'

# Auth
gem 'devise'
gem 'omniauth-google-oauth2'
gem 'omniauth-rails_csrf_protection'

gem "sidekiq", "~> 8.1"
gem "ruby-openai", "~> 7.0"
gem "neighbor"

gem "pundit-matchers", "~> 4.0", group: :test

# Multi-provider AI
gem "ruby-anthropic", "~> 0.4"
gem "gemini-ai", "~> 4.2"
