# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DashboardPolicy do
  subject { described_class.new(user, :dashboard) }

  let(:workspace) { create(:workspace) }

  %i[employee agent hr_manager it_manager workspace_admin].each do |role|
    context "when #{role}" do
      let(:user) { create(:user, workspace: workspace, role: role) }

      it { is_expected.to be_show }
    end
  end
end
