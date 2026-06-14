class AddSlaPredictionToTickets < ActiveRecord::Migration[8.1]
  def change
    add_column :tickets, :sla_breach_probability, :decimal, precision: 5, scale: 4
    add_column :tickets, :sla_predicted_at, :datetime
    add_index :tickets, :sla_breach_probability,
              where: "sla_breach_probability > 0.70",
              name: "index_tickets_on_high_breach_probability",
              if_not_exists: true
  end
end