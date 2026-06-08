# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ApplicationPolicy do
  subject { described_class.new(user, record) }

  let(:workspace) { create(:workspace) }
  let(:record)    { instance_double(Ticket) }

  context 'when user is nil' do
    it 'raises NotAuthorizedError' do
      expect { described_class.new(nil, record) }.to raise_error(Pundit::NotAuthorizedError)
    end
  end

  context 'with a logged-in user' do
    let(:user) { create(:user, workspace: workspace) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_show }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_update }
    it { is_expected.not_to be_destroy }
  end

  describe 'Scope' do
    let(:user)  { create(:user, workspace: workspace) }
    let(:scope) { Ticket.all }

    it 'filters by workspace_id' do
      resolved = described_class::Scope.new(user, scope).resolve
      expect(resolved.to_sql).to include(workspace.id.to_s)
    end
  end
end
