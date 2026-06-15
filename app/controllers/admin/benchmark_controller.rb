# frozen_string_literal: true

module Admin
  class BenchmarkController < Admin::BaseController
    def index
      authorize :benchmark, :index?
      result = Analytics::WorkspaceBenchmark.new(workspace: current_workspace).call

      render inertia: 'Admin/Benchmark/Index', props: {
        benchmark: result.success? ? result.data : nil,
        error:     result.success? ? nil : result.error
      }
    end
  end
end
