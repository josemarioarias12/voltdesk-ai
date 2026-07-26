# frozen_string_literal: true

Rails.logger.debug '  Cleaning existing data...'

[
  SpaceReservation, Space, AgentAction, WorkflowExecution, WorkflowRule,
  PatternAlert, ClassificationCorrection, ApiRequest, ApiKey, Webhook,
  TicketSatisfactionSurvey, ComplianceLog, DataRetentionPolicy,
  TicketEmbedding, TicketActivity, TicketComment, AiAuditLog, Notification,
  LeaveRequest, LeavePolicy, OnboardingTask, OnboardingPlan,
  ClimateSurveyResponse, ClimateSurvey,
  Asset, Ticket, User, Department, SlaPolicy, Workspace
].each do |model|
  count = model.delete_all
  Rails.logger.debug { "  Deleted #{count} #{model.name} records" }
end

Rails.logger.debug '  Cleanup complete.'
