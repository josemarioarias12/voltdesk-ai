class AddSensitiveFieldsToLeaveRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :leave_requests, :medical_notes, :text
    add_column :leave_requests, :doctor_certificate_url, :string
  end
end
