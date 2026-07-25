# frozen_string_literal: true

class AddDepartmentAndCoveragePlanToLeaveRequests < ActiveRecord::Migration[8.1]
  def change
    change_table :leave_requests, bulk: true do |t|
      t.references :department, foreign_key: true
      t.text :coverage_plan
    end
  end
end