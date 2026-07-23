# frozen_string_literal: true

class AddSlaRiskLevelToTickets < ActiveRecord::Migration[8.1]
  def change
    change_table :tickets, bulk: true do |t|
      t.column :sla_risk_level, :integer, default: 0, null: false
      t.column :sla_risk_level_changed_at, :datetime
      t.index :sla_risk_level, where: 'sla_risk_level >= 2', name: 'index_tickets_on_elevated_sla_risk'
    end
  end
end
