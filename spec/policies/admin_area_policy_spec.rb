# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AdminAreaPolicy do
  subject { described_class.new(user, :admin_area) }

  let(:workspace) { create(:workspace) }

  %i[super_admin workspace_admin].each do |role|
    context "when #{role}" do
      let(:user) { create(:user, workspace: workspace, role: role) }

      it { is_expected.to be_access }
    end
  end

  %i[hr_manager it_manager facilities_manager operations_manager department_manager agent employee guest].each do |role|
    context "when #{role}" do
      let(:user) { create(:user, workspace: workspace, role: role) }

      it { is_expected.not_to be_access }
    end
  end
end
