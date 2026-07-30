# frozen_string_literal: true

module Admin
  class UsersController < BaseController
    def index
      authorize User, :index?

      render inertia: 'Admin/Users/Index', props: index_props
    end

    def create
      authorize User, :create?
      result = Users::CreateUser.call(workspace: current_workspace, actor: current_user, params: user_params)

      if result.success?
        render inertia: 'Admin/Users/Index',
               props: index_props.merge(new_user_password: result.data[:temporary_password])
      else
        redirect_to admin_users_path, alert: result.error
      end
    end

    private

    def index_props
      users = policy_scope(User).includes(:department).order(:first_name, :last_name)

      {
        users: users.map { |u| serialize_user(u) },
        departments: current_workspace.departments.ordered.map { |d| serialize_department(d) },
        assignable_roles: UserPolicy.new(current_user, User).assignable_roles
      }
    end

    def user_params
      params.expect(user: %i[first_name last_name email role department_id])
    end

    def serialize_user(user)
      {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department&.name,
        active: user.active
      }
    end

    def serialize_department(department)
      { id: department.id, name: department.name }
    end
  end
end
