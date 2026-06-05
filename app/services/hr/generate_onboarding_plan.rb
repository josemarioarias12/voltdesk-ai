# frozen_string_literal: true

module Hr
  class GenerateOnboardingPlan
    include AiAuditable

    TASKS_PER_ROLE = 8

    def self.call(**args) = new(**args).call

    def initialize(user:)
      @user      = user
      @workspace = user.workspace
    end

    def call
      plan = find_or_initialize_plan
      return ServiceResult.failure('Plan already completed') if plan.persisted? && plan.completed?

      result = generate_with_ai
      return result if result.failure?

      persist_plan(plan, result.data)
      ServiceResult.success(plan)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def find_or_initialize_plan
      @user.onboarding_plan || @user.build_onboarding_plan(
        workspace: @workspace,
        status: :in_progress,
        target_completion_date: 30.days.from_now.to_date
      )
    end

    def generate_with_ai
      prompt     = build_prompt
      started_at = Time.current
      response   = call_ai(prompt)
      duration   = ((Time.current - started_at) * 1000).round

      log_ai_call(
        operation: 'onboarding_plan',
        model: @model_used,
        provider: @provider_used,
        prompt: prompt,
        response: response[:content],
        tokens: response[:usage],
        duration_ms: duration,
        confidence: nil,
        status: 'success'
      )

      ServiceResult.success(parse_tasks(response[:content]))
    rescue StandardError => e
      log_ai_call(
        operation: 'onboarding_plan',
        model: @model_used || 'gpt-4o',
        provider: @provider_used || 'openai',
        prompt: build_prompt,
        response: e.message,
        tokens: { 'prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0 },
        duration_ms: 0,
        confidence: nil,
        status: 'error'
      )
      ServiceResult.failure("AI generation failed: #{e.message}")
    end

    def call_ai(prompt)
      adapter, model, provider = resolve_adapter
      @model_used    = model
      @provider_used = provider
      adapter.chat(
        prompt: prompt,
        system: system_prompt,
        model: model
      )
    end

    def resolve_adapter
      router = Ai::ModelRouter.for(workspace: @workspace, operation: :onboarding_plan)
      router.resolve
    rescue StandardError => e
      Rails.logger.warn("[GenerateOnboardingPlan] Router failed: #{e.message} — forcing OpenAI fallback")
      [Ai::Providers::OpenaiAdapter.new, 'gpt-4o', 'openai']
    end

    def system_prompt
      <<~PROMPT
        You are an HR specialist creating personalized onboarding plans.
        Always respond with valid JSON only. No markdown, no explanation.
        Return exactly this structure:
        {
          "sections": [
            {
              "category": "setup",
              "tasks": [
                { "title": "Task title", "order_index": 1, "due_days": 3 }
              ]
            }
          ]
        }
        Categories must be: setup, team, systems, contributions.
        Each section must have 2-4 tasks. Total tasks: at least #{TASKS_PER_ROLE}.
      PROMPT
    end

    def build_prompt
      <<~PROMPT
        Create an onboarding plan for a new employee with the following profile:
        - Role: #{@user.role.humanize}
        - Department: #{@user.department&.name || 'General'}
        - Company: #{@workspace.name}

        Generate specific, actionable tasks organized in 4 sections:
        1. setup — tools, access, environment setup
        2. team — meetings, introductions, culture
        3. systems — learning internal systems and processes
        4. contributions — first real work contributions

        Tasks must be specific to the #{@user.role.humanize} role, not generic.
      PROMPT
    end

    def parse_tasks(content)
      data = JSON.parse(content)
      data['sections'].flat_map do |section|
        section['tasks'].map do |task|
          {
            title: task['title'],
            category: section['category'],
            order_index: task['order_index'],
            due_date: task['due_days'] ? task['due_days'].days.from_now.to_date : nil,
            completed: false
          }
        end
      end
    rescue JSON::ParserError => e
      raise "Invalid AI response format: #{e.message}"
    end

    def persist_plan(plan, tasks)
      ActiveRecord::Base.transaction do
        plan.save!
        plan.onboarding_tasks.destroy_all
        tasks.each { |task| plan.onboarding_tasks.create!(task) }
        plan.update!(ai_metadata: {
                       generated_at: Time.current.iso8601,
                       model: @model_used,
                       task_count: tasks.count
                     })
      end
      Hr::NotifyOnboardingReady.call(plan: plan)
    end
  end
end
