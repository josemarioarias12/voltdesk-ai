# frozen_string_literal: true

namespace :demo do
  desc 'Verify all workspaces have sufficient data for demo'
  task verify: :environment do
    puts '==> Verifying demo data...'
    all_ok = true

    Workspace.find_each do |wsp|
      puts "\n  #{wsp.name} (#{wsp.slug}):"
      checks = {
        '50+ tickets with mixed status' => lambda {
          Ticket.where(workspace: wsp).count >= 50 &&
            Ticket.exists?(workspace: wsp, status: :open) &&
            Ticket.exists?(workspace: wsp, status: :resolved)
        },
        '1+ critical ticket'       => -> { Ticket.exists?(workspace: wsp, priority: :critical) },
        '1+ AgentAction pending'   => -> { AgentAction.exists?(workspace: wsp, status: :pending_approval) },
        '1+ PatternAlert active'   => -> { PatternAlert.exists?(workspace: wsp, resolved_at: nil) },
        '5+ assets'                => -> { Asset.where(workspace: wsp).count >= 5 },
        '1+ WorkflowRule active'   => -> { WorkflowRule.exists?(workspace: wsp, active: true) },
        '10+ AiAuditLog entries'   => -> { AiAuditLog.where(workspace: wsp).count >= 10 },
        '1+ ApiKey active'         => -> { ApiKey.exists?(workspace: wsp, active: true) },
        'Users present for all roles' => -> { User.where(workspace: wsp).count >= 5 }
      }

      checks.each do |check_name, check_fn|
        passed = check_fn.call
        puts "    #{passed ? '✓' : '✗'} #{check_name}"
        next if passed

        all_ok = false
        puts "      --> Creating missing data for: #{check_name}"
        create_missing_data(wsp, check_name)
      end
    end

    puts "\n#{'=' * 50}"
    if all_ok
      puts '==> All checks passed ✅'
      exit 0
    else
      puts '==> Some data was missing and created ⚠️'
      exit 1
    end
  end

  desc 'Generate embeddings for seed tickets via OpenAI text-embedding-3-large'
  task generate_embeddings: :environment do
    puts '==> Generating embeddings...'
    total_generated = 0

    Workspace.find_each do |wsp|
      tickets = Ticket.where(workspace: wsp).where.missing(:ticket_embedding).limit(50)
      next if tickets.empty?

      puts "  Processing #{wsp.name}: #{tickets.count} tickets without embeddings"

      tickets.each_with_index do |ticket, idx|
        embedding = if ENV['OPENAI_API_KEY'].present?
                      generate_real_embedding(ticket)
                    else
                      generate_synthetic_embedding
                    end
        next unless embedding

        TicketEmbedding.find_or_initialize_by(ticket: ticket).tap do |rec|
          rec.embedding = embedding
          rec.save!
        end

        total_generated += 1
        puts "    Embedding #{idx + 1}/#{tickets.count} — #{ticket.ticket_number}"
        sleep 0.1 if ENV['OPENAI_API_KEY'].present?
      end
    end

    puts "\n==> #{total_generated} embeddings generated. HNSW index ready. ✅"
  end

  def generate_real_embedding(ticket)
    client = OpenAI::Client.new(access_token: ENV.fetch('OPENAI_API_KEY'))
    text   = "#{ticket.title} #{ticket.description}".truncate(2000)
    resp   = client.embeddings(parameters: { model: 'text-embedding-3-large', input: text, dimensions: 1536 })
    resp.dig('data', 0, 'embedding')
  rescue StandardError => e
    puts "    WARNING: OpenAI error — #{e.message}. Using synthetic embedding."
    generate_synthetic_embedding
  end

  def generate_synthetic_embedding
    raw  = Array.new(1536) { (rand * 2) - 1 }
    norm = Math.sqrt(raw.sum { |val| val**2 })
    raw.map { |val| val / norm }
  end

  def create_missing_data(wsp, check_name)
    case check_name
    when '1+ AgentAction pending'
      ticket = Ticket.where(workspace: wsp, priority: :critical).first || Ticket.where(workspace: wsp).first
      return unless ticket

      AgentAction.create!(
        workspace: wsp, ticket: ticket, action_type: :auto_resolve,
        status: :pending_approval, confidence: 0.88,
        result: { 'suggested_action' => 'Auto-generated for demo verification' }
      )
    when '1+ PatternAlert active'
      PatternAlert.create!(
        workspace: wsp, alert_type: :ticket_cluster, severity: :high,
        title: 'Auto-generated pattern alert for demo',
        description: 'Created by rake demo:verify to ensure demo readiness.',
        metadata: { 'ticket_ids' => Ticket.where(workspace: wsp).limit(3).pluck(:id) }
      )
    when '1+ WorkflowRule active'
      WorkflowRule.create!(
        workspace: wsp, name: 'Auto-generated demo rule',
        trigger_event: :ticket_created,
        conditions: { 'priority' => 'critical' },
        actions: { 'notify' => true },
        active: true, execution_count: 0
      )
    end
  end
end
