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

  # ── guest ──────────────────────────────────────────────────────────────────
  describe "guest" do
    let(:guest)  { make_user(:guest) }
    let(:ticket) { make_ticket }

    it "cannot index"  { expect(described_class).not_to authorize(guest, ticket, :index?) }
    it "cannot show"   { expect(described_class).not_to authorize(guest, ticket, :show?) }
    it "can create"    { expect(described_class).to     authorize(guest, ticket, :create?) }
    it "cannot update" { expect(described_class).not_to authorize(guest, ticket, :update?) }
  end

  # ── employee — own ticket ──────────────────────────────────────────────────
  describe "employee — own ticket" do
    let(:employee) { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: employee) }

    it "can show"      { expect(described_class).to     authorize(employee, ticket, :show?) }
    it "can create"    { expect(described_class).to     authorize(employee, ticket, :create?) }
    it "cannot update" { expect(described_class).not_to authorize(employee, ticket, :update?) }
  end

  # ── employee — other's ticket ──────────────────────────────────────────────
  describe "employee — other's ticket" do
    let(:employee) { make_user(:employee) }
    let(:other)    { make_user(:employee) }
    let(:ticket)   { make_ticket(created_by: other) }

    it "cannot show" { expect(described_class).not_to authorize(employee, ticket, :show?) }
  end

  # ── agent — assigned ticket ────────────────────────────────────────────────
  describe "agent — assigned ticket" do
    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(assigned_to: agent) }

    it "can show"                    { expect(described_class).to authorize(agent, ticket, :show?) }
    it "can update"                  { expect(described_class).to authorize(agent, ticket, :update?) }
    it "can view internal comments"  { expect(described_class).to authorize(agent, ticket, :view_internal_comments?) }
  end

  # ── agent — other department ───────────────────────────────────────────────
  describe "agent — other department ticket" do
    let(:agent)  { make_user(:agent) }
    let(:ticket) { make_ticket(other_dept) }

    it "cannot show"   { expect(described_class).not_to authorize(agent, ticket, :show?) }
    it "cannot update" { expect(described_class).not_to authorize(agent, ticket, :update?) }
  end

  # ── workspace_admin ────────────────────────────────────────────────────────
  describe "workspace_admin" do
    let(:admin)  { make_user(:workspace_admin) }
    let(:ticket) { make_ticket }

    it "can index"   { expect(described_class).to authorize(admin, ticket, :index?) }
    it "can show"    { expect(described_class).to authorize(admin, ticket, :show?) }
    it "can create"  { expect(described_class).to authorize(admin, ticket, :create?) }
    it "can update"  { expect(described_class).to authorize(admin, ticket, :update?) }
    it "can close"   { expect(described_class).to authorize(admin, ticket, :close?) }
    it "can destroy" { expect(described_class).to authorize(admin, ticket, :destroy?) }
  end

  # ── Scope ──────────────────────────────────────────────────────────────────
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
