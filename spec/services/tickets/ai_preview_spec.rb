# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::AiPreview do
  describe '.call' do
    it 'returns category, priority, urgency_score and est_sla_hours' do
      result = described_class.call(title: 'VPN not connecting', description: 'Cannot access network from home')
      expect(result).to be_success
      expect(result.data[:category]).to eq('IT')
      expect(result.data).to include(:priority, :urgency_score, :est_sla_hours, :suggested_title)
    end

    it 'defaults to medium priority when no signals match' do
      result = described_class.call(title: 'Just checking something', description: '')
      expect(result.data[:priority]).to eq('medium')
    end
  end

  describe '.suggest_title' do
    it 'returns empty string when description is blank' do
      title = described_class.suggest_title(description: '')
      expect(title).to eq('')
    end

    it 'strips filler phrases and capitalizes the first letter' do
      title = described_class.suggest_title(
        description: 'está fallando la impresora no sirve por favor venir al piso 1'
      )
      expect(title).not_to include('por favor')
      expect(title[0]).to eq(title[0].upcase)
    end

    it 'takes only the first meaningful clause when description has multiple sentences' do
      title = described_class.suggest_title(
        description: 'The printer is not working. It has been broken since yesterday.'
      )
      expect(title).not_to include('broken since yesterday')
    end

    it 'truncates titles longer than 60 characters' do
      long_description = 'a' * 100
      title = described_class.suggest_title(description: long_description)
      expect(title.length).to be <= 63
      expect(title).to end_with('...')
    end
  end
end
