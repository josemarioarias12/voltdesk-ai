# frozen_string_literal: true

class ClimateSurveyPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(workspace: user.workspace)
    end
  end

  def index?
    user.role_hr_manager? || admin_or_above?
  end

  def create?
    user.role_hr_manager? || admin_or_above?
  end

  def show?
    user.role_hr_manager? || admin_or_above?
  end

  def activate?
    create?
  end

  def close?
    create?
  end

  def respond?
    return false unless record.active?
    return false if record.climate_survey_responses.exists?(user: user)

    record.eligible_users.exists?(id: user.id)
  end
end
