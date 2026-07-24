# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketPolicy, type: :policy do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:other_dept) { create(:department, workspace: workspace) }

  def make_user(role, dept = department)
    create(:user, workspace: workspace, department: dept, role: role, active: true)
  end

  def make_ticket(dept = department, **attrs)
    create(:ticket, workspace: workspace, department: dept, **attrs)
  end

  describe 'guest' do
    subject      { described_class.new(guest, ticket) }

    let(:guest)  { make_user(:guest) }
    let(:ticket) { make_ticket }

    it { is_expected.to permit_only_actions(%i[create]) }
  end

  describe 'employee — own open ticket' do
    subject        { described_class.new(employee, ticket) }

    let(:employee) { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: employee, status: :open) }

    it { is_expected.to permit_only_actions(%i[index show create update bulk_update]) }
  end

  describe 'employee — own resolved ticket' do
    subject        { described_class.new(employee, ticket) }

    let(:employee) { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: employee, status: :resolved) }

    it { is_expected.to forbid_action(:update) }
    it { is_expected.to permit_action(:show) }
  end

  describe 'employee — own closed ticket' do
    subject        { described_class.new(employee, ticket) }

    let(:employee) { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: employee, status: :closed) }

    it { is_expected.to forbid_action(:update) }
  end

  describe "employee — other's ticket" do
    subject        { described_class.new(employee, ticket) }

    let(:employee) { make_user(:employee) }
    let(:other)    { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: other) }

    it { is_expected.to forbid_actions(%i[show update]) }
  end

  describe 'agent — assigned ticket' do
    subject      { described_class.new(agent, ticket) }

    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(assigned_to: agent) }

    it { is_expected.to permit_only_actions(%i[index create show update resolve_ticket change_priority view_internal_comments add_internal_comment bulk_update]) }
  end

  describe 'agent — same department, not assigned' do
    subject { described_class.new(agent, ticket) }

    let(:agent)      { make_user(:agent) }
    let(:other_user) { make_user(:employee) }
    let(:ticket)     { make_ticket(created_by: other_user) }

    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:bulk_update) }
    it { is_expected.to forbid_actions(%i[update resolve_ticket assign]) }
  end

  describe 'agent — other department ticket' do
    subject      { described_class.new(agent, ticket) }

    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(other_dept) }

    it { is_expected.to forbid_actions(%i[show update]) }
  end

  describe 'department_manager — own department ticket' do
    subject       { described_class.new(manager, ticket) }

    let(:manager) { make_user(:department_manager) }
    let(:ticket)  { make_ticket }

    it { is_expected.to permit_actions(%i[show update assign bulk_update resolve_ticket]) }
  end

  describe 'department_manager — other department ticket' do
    subject       { described_class.new(manager, ticket) }

    let(:manager) { make_user(:department_manager) }
    let(:ticket)  { make_ticket(other_dept) }

    it { is_expected.to forbid_actions(%i[show update assign]) }
    it { is_expected.to permit_action(:bulk_update) }
  end

  describe 'admin/manager tier — all six roles, cross-department' do
    %i[super_admin workspace_admin hr_manager it_manager facilities_manager operations_manager].each do |role|
      context "as #{role}" do
        subject { described_class.new(user, ticket) }

        let(:user)   { make_user(role) }
        let(:ticket) { make_ticket(other_dept) }

        it { is_expected.to permit_actions(%i[index show create update assign bulk_update resolve_ticket view_internal_comments add_internal_comment]) }
      end
    end
  end

  describe 'internal comments visibility' do
    it 'department_manager can view and add internal comments' do
      manager = make_user(:department_manager)
      ticket  = make_ticket
      policy  = described_class.new(manager, ticket)

      expect(policy.view_internal_comments?).to be true
      expect(policy.add_internal_comment?).to be true
    end

    it 'admin/manager tier can view and add internal comments' do
      admin  = make_user(:workspace_admin)
      ticket = make_ticket

      policy = described_class.new(admin, ticket)

      expect(policy.view_internal_comments?).to be true
      expect(policy.add_internal_comment?).to be true
    end

    it 'employee cannot view or add internal comments' do
      employee = make_user(:employee)
      ticket   = make_ticket(created_by: employee)
      policy   = described_class.new(employee, ticket)

      expect(policy.view_internal_comments?).to be false
      expect(policy.add_internal_comment?).to be false
    end

    it 'guest cannot view or add internal comments' do
      guest  = make_user(:guest)
      ticket = make_ticket
      policy = described_class.new(guest, ticket)

      expect(policy.view_internal_comments?).to be false
      expect(policy.add_internal_comment?).to be false
    end
  end

  describe 'workspace_admin' do
    subject      { described_class.new(admin, ticket) }

    let(:admin)  { make_user(:workspace_admin) }
    let(:ticket) { make_ticket }

    it { is_expected.to permit_actions(%i[index show create update assign bulk_update resolve_ticket]) }
  end

  describe 'Scope' do
    let(:employee)     { make_user(:employee) }
    let(:own_ticket)   { make_ticket(created_by: employee) }
    let(:other_ticket) { make_ticket(created_by: make_user(:employee)) }

    it 'employee only sees own tickets' do
      own_ticket
      other_ticket
      scope = described_class::Scope.new(employee, Ticket.all).resolve
      expect(scope).to include(own_ticket)
      expect(scope).not_to include(other_ticket)
    end

    it 'workspace_admin sees all tickets' do
      own_ticket
      other_ticket
      admin = make_user(:workspace_admin)
      scope = described_class::Scope.new(admin, Ticket.all).resolve
      expect(scope).to include(own_ticket, other_ticket)
    end

    it 'department_manager only sees own department tickets' do
      manager           = make_user(:department_manager)
      own_dept_ticket   = make_ticket(department)
      other_dept_ticket = make_ticket(other_dept)
      scope = described_class::Scope.new(manager, Ticket.all).resolve
      expect(scope).to include(own_dept_ticket)
      expect(scope).not_to include(other_dept_ticket)
    end

    it 'guest sees no tickets' do
      own_ticket
      other_ticket
      guest = make_user(:guest)
      scope = described_class::Scope.new(guest, Ticket.all).resolve
      expect(scope).to be_empty
    end
  end
end
