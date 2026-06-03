require 'rails_helper'

RSpec.describe Hr::GenerateOnboardingPlan do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }

  let(:ai_content) do
    JSON.generate({
      sections: [
        {
          category: 'setup',
          tasks: [
            { title: 'Configure laptop', order_index: 1, due_days: 2 },
            { title: 'Set up VPN',       order_index: 2, due_days: 3 }
          ]
        },
        {
          category: 'team',
          tasks: [
            { title: 'Meet your manager', order_index: 3, due_days: 1 },
            { title: 'Team lunch',        order_index: 4, due_days: 5 }
          ]
        },
        {
          category: 'systems',
          tasks: [
            { title: 'Learn ticketing system', order_index: 5, due_days: 7 },
            { title: 'Read the runbook',       order_index: 6, due_days: 7 }
          ]
        },
        {
          category: 'contributions',
          tasks: [
            { title: 'First solo ticket', order_index: 7, due_days: 14 },
            { title: 'Lead one standup',  order_index: 8, due_days: 21 }
          ]
        }
      ]
    })
  end

  let(:ai_response) do
    {
      content: ai_content,
      usage:   { 'prompt_tokens' => 200, 'completion_tokens' => 300, 'total_tokens' => 500 }
    }
  end

  let(:adapter) { instance_double(Ai::Providers::OpenaiAdapter) }

  before do
    allow(Ai::ModelRouter).to receive(:for).and_return(
      instance_double(Ai::ModelRouter, resolve: [adapter, 'gpt-4o', 'openai'])
    )
    allow(adapter).to receive(:chat).and_return(ai_response)
    allow(AiAuditLog).to receive(:create!)
  end

  it 'creates an onboarding plan with tasks' do
    result = described_class.call(user: user)

    expect(result).to be_success
    expect(result.data).to be_a(OnboardingPlan)
    expect(result.data.onboarding_tasks.count).to eq(8)
  end

  it 'sets the correct categories on tasks' do
    described_class.call(user: user)

    categories = user.onboarding_plan.onboarding_tasks.pluck(:category).uniq.sort
    expect(categories).to include('setup', 'team', 'systems', 'contributions')
  end

  it 'returns failure when already completed' do
    create(:onboarding_plan, workspace: workspace, user: user, status: :completed)

    result = described_class.call(user: user)

    expect(result).to be_failure
    expect(result.error).to eq('Plan already completed')
  end

  it 'returns failure when AI response is invalid JSON' do
    allow(adapter).to receive(:chat).and_return({ content: 'not json', usage: {} })

    result = described_class.call(user: user)

    expect(result).to be_failure
    expect(result.error).to include('AI generation failed')
  end
end
