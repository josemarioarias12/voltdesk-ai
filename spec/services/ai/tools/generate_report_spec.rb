# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::GenerateReport do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:employee)   { create(:user, workspace: workspace, department: department, role: :employee) }

  describe '.visible_to?' do
    it 'is visible to every role except guest' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end

    it 'is not visible to guest' do
      expect(described_class.visible_to?(build(:user, role: :guest))).to be(false)
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: employee, workspace: workspace, locale: 'en') }

    it 'rejects an unsupported report_type' do
      result = tool.call(report_type: 'invoices', format: 'csv')
      expect(result).to be_failure
      expect(result.error).to include('Unsupported report_type')
    end

    it 'rejects an unsupported format' do
      result = tool.call(report_type: 'tickets', format: 'docx')
      expect(result).to be_failure
      expect(result.error).to include('Unsupported format')
    end

    it 'rejects an invalid status_filter for the given report_type' do
      result = tool.call(report_type: 'tickets', format: 'csv', status_filter: 'not_a_real_status')
      expect(result).to be_failure
      expect(result.error).to include('Invalid status')
    end

    context 'tickets, scoped via TicketPolicy::Scope' do
      it 'only includes tickets the employee has access to' do
        create(:ticket, workspace: workspace, department: department, created_by: employee, status: :open)
        other = create(:user, workspace: workspace, department: department)
        create(:ticket, workspace: workspace, department: department, created_by: other, status: :open)

        result = tool.call(report_type: 'tickets', format: 'csv')

        expect(result).to be_success
        expect(result.data[:total_records]).to eq(1)
      end

      it 'applies the status_filter on top of the scope' do
        create(:ticket, workspace: workspace, department: department, created_by: employee, status: :open)
        create(:ticket, workspace: workspace, department: department, created_by: employee, status: :resolved)

        result = tool.call(report_type: 'tickets', format: 'csv', status_filter: 'open')

        expect(result.data[:total_records]).to eq(1)
      end

      it 'returns an attachment payload with filename, content_type, and binary data' do
        create(:ticket, workspace: workspace, department: department, created_by: employee, status: :open)

        result = tool.call(report_type: 'tickets', format: 'csv')

        expect(result.data[:attachment][:filename]).to match(/\.csv\z/)
        expect(result.data[:attachment][:content_type]).to eq('text/csv')
        expect(result.data[:attachment][:data]).to be_a(String)
      end
    end

    context 'leave_requests, scoped via LeaveRequestPolicy::Scope' do
      it 'only includes leave requests the employee has access to' do
        create(:leave_request, workspace: workspace, department: department, user: employee)
        other = create(:user, workspace: workspace, department: department)
        create(:leave_request, workspace: workspace, department: department, user: other)

        result = tool.call(report_type: 'leave_requests', format: 'csv')

        expect(result.data[:total_records]).to eq(1)
      end
    end

    context 'assets, restricted like AssetsOverview' do
      it 'refuses an employee, who has no asset visibility at all' do
        result = tool.call(report_type: 'assets', format: 'csv')

        expect(result).to be_failure
        expect(result.error).to include('not available to your role')
      end

      it 'allows it_manager, matching AssetsOverview.visible_to?' do
        it_manager = create(:user, workspace: workspace, department: department, role: :it_manager)
        create(:asset, workspace: workspace, department: department)

        result = described_class.new(user: it_manager, workspace: workspace, locale: 'en')
                                .call(report_type: 'assets', format: 'csv')

        expect(result).to be_success
        expect(result.data[:total_records]).to eq(1)
      end
    end
  end
end
