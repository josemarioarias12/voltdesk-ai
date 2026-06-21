# frozen_string_literal: true

class SettingsPolicy < ApplicationPolicy
  def index?      = admin_or_above?
  def update_ai?  = admin_or_above?
  def update_automation? = admin_or_above?
end
