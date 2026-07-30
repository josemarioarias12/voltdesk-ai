# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::UsersController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:department)      { create(:department, workspace:) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:super_admin)     { create(:user, workspace: workspace, role: :super_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin/users' do
    it 'returns 200 for workspace_admin' do
      sign_in workspace_admin
      get admin_users_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns users, departments, and assignable_roles props' do
      sign_in workspace_admin
      get admin_users_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('users', 'departments', 'assignable_roles')
    end

    it 'excludes super_admin from assignable_roles for a workspace_admin' do
      sign_in workspace_admin
      get admin_users_path, headers: inertia_headers
      roles = response.parsed_body['props']['assignable_roles']
      expect(roles).not_to include('super_admin')
    end

    it 'includes super_admin in assignable_roles for a super_admin' do
      sign_in super_admin
      get admin_users_path, headers: inertia_headers
      roles = response.parsed_body['props']['assignable_roles']
      expect(roles).to include('super_admin')
    end

    it 'redirects an employee (below admin)' do
      sign_in employee
      get admin_users_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'POST /admin/users' do
    let(:valid_params) do
      { user: { first_name: 'Carlos', last_name: 'Mendez', email: 'carlos@example.com',
                role: 'employee', department_id: department.id } }
    end

    it 'creates a user scoped to the current workspace' do
      sign_in workspace_admin

      expect { post admin_users_path, params: valid_params, headers: inertia_headers }
        .to change(User, :count).by(1)

      expect(User.last.workspace_id).to eq(workspace.id)
    end

    it 'returns the temporary password in props' do
      sign_in workspace_admin
      post admin_users_path, params: valid_params, headers: inertia_headers

      expect(response.parsed_body['props']['new_user_password']).to be_a(String)
    end

    it 'rejects assigning super_admin from a workspace_admin' do
      sign_in workspace_admin

      expect do
        post admin_users_path, params: valid_params.deep_merge(user: { role: 'super_admin' }), headers: inertia_headers
      end.not_to change(User, :count)
    end

    it 'redirects an employee (below admin) without creating a user' do
      sign_in employee

      expect { post admin_users_path, params: valid_params, headers: inertia_headers }
        .not_to change(User, :count)

      expect(response).to have_http_status(:redirect)
    end
  end
end
