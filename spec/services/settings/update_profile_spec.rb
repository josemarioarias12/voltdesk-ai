# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::UpdateProfile do
  let(:user) { create(:user, first_name: 'Jose', last_name: 'Arias') }

  it 'updates name fields and returns success' do
    result = described_class.call(
      user: user,
      params: { first_name: 'Mario', last_name: 'Arias', avatar: nil }
    )

    expect(result).to be_success
    expect(user.reload.first_name).to eq('Mario')
  end

  it 'attaches an avatar when provided' do
    result = described_class.call(
      user: user,
      params: { first_name: user.first_name, last_name: user.last_name, avatar: build_avatar_upload }
    )

    expect(result).to be_success
    expect(user.reload.avatar).to be_attached
  end

  it 'returns failure when validation fails' do
    result = described_class.call(
      user: user,
      params: { first_name: '', last_name: user.last_name, avatar: nil }
    )

    expect(result).to be_failure
    expect(result.error).to be_present
  end

  def build_avatar_upload
    tempfile = Tempfile.new(['avatar', '.png'], binmode: true)
    tempfile.write(Base64.decode64(
                     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
                   ))
    tempfile.rewind
    ActionDispatch::Http::UploadedFile.new(tempfile: tempfile, filename: 'avatar.png', type: 'image/png')
  end
end
