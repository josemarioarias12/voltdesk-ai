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

PATTERN_ALERTS_DATA = {
  'techcorp' => [
    { pattern_type: 'volume_spike', severity: 'critical',
      description: '6 critical IT tickets in last 2 hours — all related to DB outage cluster.' },
    { pattern_type: 'sla_breach_cluster', severity: 'high',
      description: '3 SLA breaches detected in IT Infrastructure department this week.' }
  ],
  'healthco' => [
    { pattern_type: 'sentiment_drop', severity: 'high',
      description: 'Nursing department sentiment dropped 30 points over 3 weeks. Ticket volume up 250%.' }
  ],
  'retailplus' => [
    { pattern_type: 'volume_spike',    severity: 'critical',
      description: '45 POS terminal tickets in last 2 hours vs daily average of 8. Z-score 3.8.' },
    { pattern_type: 'recurring_issue', severity: 'high',
      description: 'POS terminal offline pattern recurring across 8 stores — likely firmware issue.' }
  ],
  'startupai' => [
    { pattern_type: 'ai_confidence_drop', severity: 'medium',
      description: 'AI classification confidence below 0.70 threshold on 30% of tickets this week.' }
  ],
  'consultingpro' => [
    { pattern_type: 'compliance_risk', severity: 'high',
      description: '3 data_access_denied events for same resource in 24 hours — potential unauthorized access.' }
  ]
}.freeze

Workspace.find_each do |ws|
  alerts_data = PATTERN_ALERTS_DATA[ws.slug]
  next unless alerts_data

  tickets = Ticket.where(workspace: ws).limit(6).pluck(:id)

  alerts_data.each do |data|
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
