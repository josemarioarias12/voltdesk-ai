# frozen_string_literal: true

module Admin
  class BenchmarkController < Admin::BaseController
    def index
      authorize :benchmark, :index?

      benchmark = Rails.cache.fetch("benchmark_#{current_workspace.id}_#{Time.zone.today}", expires_in: 5.minutes) do
        result = Analytics::WorkspaceBenchmark.new(workspace: current_workspace).call
        result.success? ? result.data : nil
      end

      render inertia: 'Admin/Benchmark/Index',
             props: { benchmark: benchmark, error: benchmark.nil? ? 'Failed to load benchmark' : nil }
    end
  end
end
