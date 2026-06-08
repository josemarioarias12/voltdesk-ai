# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketCommentPolicy do
  subject { described_class.new(user, comment) }

  let(:workspace) { create(:workspace) }
  let(:ticket)    { create(:ticket, workspace: workspace) }

  context 'when agent' do
    let(:user)    { create(:user, workspace: workspace, role: :agent) }
    let(:comment) { create(:ticket_comment, ticket: ticket, user: user, internal: false) }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.to be_create }
    it { is_expected.to be_create_internal }
    it { is_expected.to be_destroy }
  end

  context 'when employee' do
    let(:employee_ticket) { create(:ticket, workspace: workspace, created_by: user) }
    let(:user)    { create(:user, workspace: workspace, role: :employee) }
    let(:comment) { create(:ticket_comment, ticket: employee_ticket, user: user, internal: false) }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.to be_create }
    it { is_expected.not_to be_create_internal }
  end

  context 'when employee on internal comment' do
    let(:user)   { create(:user, workspace: workspace, role: :employee) }
    let(:agent)  { create(:user, workspace: workspace, role: :agent) }
    let(:comment) { create(:ticket_comment, ticket: ticket, user: agent, internal: true) }

    it { is_expected.not_to be_show }
  end

  context 'when guest' do
    let(:user)    { create(:user, workspace: workspace, role: :guest) }
    let(:comment) { create(:ticket_comment, ticket: ticket, user: user, internal: false) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_create_internal }
    it { is_expected.not_to be_destroy }
  end

  context 'destroy? as admin on any comment' do
    let(:user)    { create(:user, workspace: workspace, role: :workspace_admin) }
    let(:other)   { create(:user, workspace: workspace, role: :employee) }
    let(:comment) { create(:ticket_comment, ticket: ticket, user: other, internal: false) }

    it { is_expected.to be_destroy }
  end
end
