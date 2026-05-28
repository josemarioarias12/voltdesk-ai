# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    render inertia: 'Home/Index', props: {
      sprint: 'S1',
      status: 'OK',
      stack: {
        backend: "Rails #{Rails.version}",
        database: 'PostgreSQL 16 + pgvector',
        jobs: 'Sidekiq 7',
        bridge: 'Inertia.js'
      }
    }
  end
end
