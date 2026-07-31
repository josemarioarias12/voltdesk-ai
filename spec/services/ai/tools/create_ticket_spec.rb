# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::CreateTicket do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:employee)   { create(:user, workspace: workspace, department: department, role: :employee) }

  describe '.visible_to?' do
    it 'is visible to every role, including guest, matching TicketPolicy#create?' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee guest].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: employee, workspace: workspace, locale: 'en') }

    context 'preview (confirmed omitted or false)' do
      it 'does not persist a ticket' do
        expect do
          tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN since this morning')
        end.not_to change(Ticket, :count)
      end

      it 'returns a preview summary with the resolved department' do
        result = tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN since this morning')

        expect(result).to be_success
        expect(result.data[:preview]).to be(true)
        expect(result.data[:summary]).to include(
          title: 'VPN not connecting',
          category: 'general',
          priority: 'medium',
          department: department.name
        )
      end

      it 'defaults category and priority when omitted' do
        result = tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN since this morning')

        expect(result.data[:params]).to include(category: 'general', priority: 'medium')
      end

      it 'uses the given category and priority when provided' do
        result = tool.call(title: 'Server down', description: 'Production server unreachable',
                           category: 'it', priority: 'critical')

        expect(result.data[:summary]).to include(category: 'it', priority: 'critical')
      end

      it 'ignores an explicit department_id when the user already has one' do
        other_department = create(:department, workspace: workspace)

        result = tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN',
                           department_id: other_department.id)

        expect(result.data[:summary][:department]).to eq(department.name)
      end

      it 'requires department_id when the user has none of their own' do
        admin_without_department = create(:user, workspace: workspace, department: nil, role: :workspace_admin)
        tool_without_department = described_class.new(user: admin_without_department, workspace: workspace,
                                                      locale: 'en')

        result = tool_without_department.call(title: 'VPN not connecting', description: 'Cannot reach the VPN')

        expect(result).to be_failure
        expect(result.error).to include('department_id is required')
      end

      it 'uses the given department_id when the user has none of their own' do
        admin_without_department = create(:user, workspace: workspace, department: nil, role: :workspace_admin)
        tool_without_department = described_class.new(user: admin_without_department, workspace: workspace,
                                                      locale: 'en')

        result = tool_without_department.call(title: 'VPN not connecting', description: 'Cannot reach the VPN',
                                              department_id: department.id)

        expect(result.data[:summary][:department]).to eq(department.name)
      end

      it 'fails validation without raising when the title is too short' do
        result = tool.call(title: 'ab', description: 'Too short a title')

        expect(result).to be_failure
        expect(result.error).to include('Title is too short')
      end
    end

    context 'confirmed: true' do
      it 'persists a real ticket via Tickets::CreateTicket' do
        expect do
          tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN', confirmed: true)
        end.to change(Ticket, :count).by(1)
      end

      it 'creates the ticket with source web and the resolved department' do
        result = tool.call(title: 'VPN not connecting', description: 'Cannot reach the VPN', confirmed: true)

        expect(result).to be_success
        expect(result.data.source).to eq('web')
        expect(result.data.department).to eq(department)
        expect(result.data.created_by).to eq(employee)
      end
    end
  end
end
