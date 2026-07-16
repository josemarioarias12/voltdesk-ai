# frozen_string_literal: true

Rails.logger.debug '  Creating pattern alerts...'

ALERT_TYPE_MAP = {
  'volume_spike'       => :ticket_cluster,
  'sla_breach_cluster' => :sla_spike,
  'sentiment_drop'     => :department_surge,
  'recurring_issue'    => :ticket_cluster,
  'ai_confidence_drop' => :department_surge,
  'compliance_risk'    => :department_surge
}.freeze

PATTERN_ALERTS = [
  { pattern_type: 'volume_spike', severity: 'critical',
    description: '6 critical tickets in last 2 hours — all related to core banking outage cluster.' },
  { pattern_type: 'sla_breach_cluster', severity: 'high',
    description: '3 SLA breaches detected in IT & Digital Banking department this week.' },
  { pattern_type: 'sentiment_drop', severity: 'high',
    description: 'Customer Service sentiment dropped 30 points over 3 weeks. Ticket volume up 250%.' },
  { pattern_type: 'recurring_issue', severity: 'high',
    description: 'ATM offline pattern recurring across 3 branches — likely cash-dispenser firmware issue.' },
  { pattern_type: 'ai_confidence_drop', severity: 'medium',
    description: 'AI survey sentiment analysis confidence below 0.70 threshold on 30% of tickets this week.' },
  { pattern_type: 'compliance_risk', severity: 'high',
    description: '3 data_access_denied events for same resource in 24 hours — potential unauthorized access.' }
].freeze

Workspace.find_each do |ws|
  tickets = Ticket.where(workspace: ws).limit(6).pluck(:id)

  PATTERN_ALERTS.each do |data|
    PatternAlert.create!(
      workspace:   ws,
      alert_type:  ALERT_TYPE_MAP[data[:pattern_type]] || :ticket_cluster,
      severity:    data[:severity].to_sym,
      title:       data[:description].truncate(80),
      description: data[:description],
      metadata:    { 'ticket_ids' => tickets, 'pattern_type' => data[:pattern_type] }
    )
  end

  Rails.logger.debug { "  PatternAlerts for #{ws.name}: #{PatternAlert.where(workspace: ws).count}" }
end

Rails.logger.debug { "  PatternAlerts total: #{PatternAlert.count}" }