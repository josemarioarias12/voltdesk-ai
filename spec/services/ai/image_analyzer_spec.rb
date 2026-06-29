# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ImageAnalyzer do
  let(:workspace) { create(:workspace) }
  let(:ticket)    { create(:ticket, workspace: workspace) }

  describe '.call' do
    context 'when ticket has no image attachments' do
      it 'returns failure' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to eq('no_images')
      end
    end

    context 'when ticket has an image attachment' do
      let(:blob) do
        ActiveStorage::Blob.create_and_upload!(
          io: StringIO.new('fake image data'),
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        )
      end

      before { ticket.attachments.attach(blob) }

      it 'returns success with base64, content_type, filename' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
        expect(result.data[:base64]).to be_present
        expect(result.data[:content_type]).to eq('image/jpeg')
        expect(result.data[:filename]).to eq('test.jpg')
      end
    end

    context 'when image exceeds 5MB' do
      let(:blob) do
        instance_double(ActiveStorage::Blob,
                        content_type: 'image/jpeg',
                        filename: double(to_s: 'large.jpg'),
                        byte_size: 6 * 1024 * 1024)
      end
      let(:attachment) { instance_double(ActiveStorage::Attachment, blob: blob) }

      before do
        allow_any_instance_of(described_class).to receive(:find_image_attachment).and_return(attachment)
      end

      it 'returns failure' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to eq('image_too_large')
      end
    end

    context 'when download raises an error' do
      let(:blob) do
        instance_double(ActiveStorage::Blob,
                        content_type: 'image/jpeg',
                        filename: double(to_s: 'error.jpg'),
                        byte_size: 100)
      end
      let(:attachment) { instance_double(ActiveStorage::Attachment, blob: blob) }

      before do
        allow_any_instance_of(described_class).to receive(:find_image_attachment).and_return(attachment)
        allow(blob).to receive(:download).and_raise(StandardError, 'download failed')
      end

      it 'returns failure without raising' do
        expect { described_class.call(ticket: ticket) }.not_to raise_error
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
      end
    end
  end
end
