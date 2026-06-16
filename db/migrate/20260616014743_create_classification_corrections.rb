class CreateClassificationCorrections < ActiveRecord::Migration[8.1]
  def change
    create_table :classification_corrections do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :ticket,    null: false, foreign_key: true
      t.bigint     :agent_id,  null: false
      t.string     :original_category,  null: false
      t.string     :corrected_category, null: false
      t.text       :correction_note
      t.datetime   :created_at, null: false
    end

    add_foreign_key :classification_corrections, :users, column: :agent_id
    add_index :classification_corrections, %i[workspace_id created_at]
    add_index :classification_corrections, :ticket_id, if_not_exists: true
    add_index :classification_corrections, :agent_id
  end
end