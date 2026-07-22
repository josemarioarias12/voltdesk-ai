class ChangeWebauthnIdNullConstraintOnUsers < ActiveRecord::Migration[8.1]
  def up
    remaining = execute("SELECT COUNT(*) FROM users WHERE webauthn_id IS NULL").first["count"].to_i

    if remaining.positive?
      raise ActiveRecord::IrreversibleMigration,
            "#{remaining} users still have a NULL webauthn_id — run the backfill before this migration"
    end

    change_column_null :users, :webauthn_id, false
  end

  def down
    change_column_null :users, :webauthn_id, true
  end
end