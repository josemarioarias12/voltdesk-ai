# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reports::GenerateReport do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, department: department) }
  let(:tickets) do
    [
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :open),
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :resolved)
    ]
  end

  describe '.call' do
    context 'csv format' do
      subject(:result) do
        described_class.call(report_type: :tickets, records: tickets, format: :csv, locale: 'en')
      end

      it 'returns success' do
        expect(result).to be_success
      end

      it 'includes english headers and one row per record' do
        parsed = CSV.parse(result.data[:data], headers: true)
        expect(parsed.headers).to include('Ticket Number', 'Title', 'Status')
        expect(parsed.count).to eq(2)
      end

      it 'sets the correct filename and content type' do
        expect(result.data[:filename]).to match(/\Atickets_\d{4}-\d{2}-\d{2}\.csv\z/)
        expect(result.data[:content_type]).to eq('text/csv')
      end
    end

    context 'xlsx format' do
      subject(:result) do
        described_class.call(report_type: :tickets, records: tickets, format: :xlsx, locale: 'en')
      end

      it 'returns success with binary xlsx data' do
        expect(result).to be_success
        expect(result.data[:content_type]).to eq('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      end

      it 'produces data that looks like a real zip-based xlsx (starts with PK magic bytes)' do
        expect(result.data[:data][0..1]).to eq('PK')
      end
    end

    context 'pdf format' do
      subject(:result) do
        described_class.call(report_type: :tickets, records: tickets, format: :pdf, locale: 'en')
      end

      it 'returns success with binary pdf data starting with the PDF magic bytes' do
        expect(result).to be_success
        expect(result.data[:data][0..3]).to eq('%PDF')
      end
    end

    context 'locale switches headers to Spanish' do
      subject(:result) do
        described_class.call(report_type: :tickets, records: tickets, format: :csv, locale: 'es')
      end

      it 'uses Spanish column headers' do
        parsed = CSV.parse(result.data[:data], headers: true)
        expect(parsed.headers).to include('Número de Ticket', 'Título', 'Estado')
      end
    end

    context 'leave_requests report_type' do
      subject(:result) do
        described_class.call(report_type: :leave_requests, records: leave_requests, format: :csv, locale: 'en')
      end

      let(:leave_requests) do
        [create(:leave_request, workspace: workspace, department: department, user: user)]
      end

      it 'uses the leave_requests headers, not the tickets ones' do
        parsed = CSV.parse(result.data[:data], headers: true)
        expect(parsed.headers).to include('Employee', 'Leave Type', 'Business Days')
      end
    end

    context 'assets report_type' do
      subject(:result) do
        described_class.call(report_type: :assets, records: assets, format: :csv, locale: 'en')
      end

      let(:assets) { [create(:asset, workspace: workspace, department: department)] }

      it 'uses the assets headers' do
        parsed = CSV.parse(result.data[:data], headers: true)
        expect(parsed.headers).to include('Asset Number', 'Risk Score', 'Warranty Expires')
      end
    end

    context 'with an empty record set' do
      subject(:result) do
        described_class.call(report_type: :tickets, records: [], format: :csv, locale: 'en')
      end

      it 'still succeeds with just the header row' do
        expect(result).to be_success
        parsed = CSV.parse(result.data[:data], headers: true)
        expect(parsed.count).to eq(0)
      end
    end
  end
end
