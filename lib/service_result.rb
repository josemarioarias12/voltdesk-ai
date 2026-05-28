# frozen_string_literal: true

class ServiceResult
  attr_reader :data, :error

  def self.success(data = nil)
    new(success: true, data: data)
  end

  def self.failure(error)
    new(success: false, error: error)
  end

  def initialize(success:, data: nil, error: nil)
    @success = success
    @data    = data
    @error   = error
  end

  def success? = @success
  def failure? = !@success
end
