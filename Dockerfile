FROM ruby:3.4.4-slim

# Install system dependencies
RUN apt-get update -qq && apt-get install -y \
    build-essential \
    git \
    libpq-dev \
    libyaml-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /rails

ENV BUNDLE_WITHOUT="development:test"
ENV RAILS_ENV="production"

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Install npm packages
COPY package.json package-lock.json* ./
RUN npm install

# Copy app
COPY . .

# Precompile assets
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]
