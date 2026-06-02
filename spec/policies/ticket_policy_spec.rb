# frozen_string_literal: true

require "rails_helper"

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

  describe "guest" do
    let(:guest)  { make_user(:guest) }
    let(:ticket) { make_ticket }
    subject      { described_class.new(guest, ticket) }

    it { is_expected.to forbid_actions(:index, :show, :update, :destroy, :close) }
    it { is_expected.to permit_action(:create) }
  end

  describe "employee — own ticket" do
    let(:employee) { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: employee) }
    subject        { described_class.new(employee, ticket) }

    it { is_expected.to permit_actions(:show, :create) }
    it { is_expected.to forbid_action(:update) }
  end

  describe "employee — other's ticket" do
    let(:employee) { make_user(:employee) }
    let(:other)    { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: other) }
    subject        { described_class.new(employee, ticket) }

    it { is_expected.to forbid_action(:show) }
  end

  describe "agent — assigned ticket" do
    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(assigned_to: agent) }
    subject      { described_class.new(agent, ticket) }

    it { is_expected.to permit_actions(:show, :update, :view_internal_comments) }
  end

  describe "agent — other department ticket" do
    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(other_dept) }
    subject      { described_class.new(agent, ticket) }

    it { is_expected.to forbid_actions(:show, :update) }
  end

  describe "workspace_admin" do
    let(:admin)  { make_user(:workspace_admin) }
    let(:ticket) { make_ticket }
    subject      { described_class.new(admin, ticket) }

    it { is_expected.to permit_actions(:index, :show, :create, :update, :close, :destroy) }
  end

  describe "Scope" do
    let(:employee)     { make_user(:employee) }
    let(:own_ticket)   { make_ticket(created_by: employee) }
    let(:other_ticket) { make_ticket(created_by: make_user(:employee)) }

    it "employee only sees own tickets" do
      own_ticket; other_ticket
      scope = described_class::Scope.new(employee, Ticket.all).resolve
      expect(scope).to include(own_ticket)
      expect(scope).not_to include(other_ticket)
    end

    it "workspace_admin sees all tickets" do
      own_ticket; other_ticket
      admin = make_user(:workspace_admin)
      scope = described_class::Scope.new(admin, Ticket.all).resolve
      expect(scope).to include(own_ticket, other_ticket)
    end
  end
end
