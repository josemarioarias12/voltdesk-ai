FROM ruby:3.4.4-slim

# Install dependencies
RUN apt-get update -qq && apt-get install -y \
    build-essential \
    git \
    libpq-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /rails

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

# Install npm packages
COPY package.json package-lock.json ./
RUN npm install

# Copy app
COPY . .

# Precompile assets
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]
