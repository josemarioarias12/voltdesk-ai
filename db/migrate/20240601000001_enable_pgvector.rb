# frozen_string_literal: true

class EnablePgvector < ActiveRecord::Migration[8.0]
  def up
    enable_extension "vector"
  end

  def down
    disable_extension "vector"
  end
end
