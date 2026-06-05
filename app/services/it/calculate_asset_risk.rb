# frozen_string_literal: true

module It
  class CalculateAssetRisk
    WEIGHTS = {
      incident_score: 40,
      maintenance_score: 30,
      warranty_score: 20,
      age_score: 10
    }.freeze

    MONITOR_MSG = 'Monitor asset closely and schedule preventive maintenance.'
    private_constant :MONITOR_MSG

    def self.call(**args) = new(**args).call

    def initialize(asset:, user: nil)
      @asset     = asset
      @workspace = asset.workspace
      @user      = user
    end

    def call
      factors  = build_factors
      score    = calculate_score(factors)
      metadata = build_metadata(factors, score)

      @asset.update!(
        risk_score: score,
        ai_metadata: @asset.ai_metadata.merge('risk_assessment' => metadata)
      )

      ServiceResult.success({ score: score, metadata: metadata })
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def build_factors
      {
        incident: incident_factor,
        maintenance: maintenance_factor,
        warranty: warranty_factor,
        age: age_factor
      }
    end

    def incident_factor
      recent_count  = @asset.asset_incidents.last_90_days.count
      workspace_avg = workspace_incident_avg
      ratio         = compute_ratio(recent_count, workspace_avg)
      normalized    = [ratio * 50, 100].min.round

      {
        value: recent_count,
        normalized: normalized,
        workspace_avg: workspace_avg.round(1),
        impact: impact_label(normalized),
        label: "Incidents in last 90 days: #{recent_count} (#{ratio.round(1)}x workspace avg)"
      }
    end

    def compute_ratio(count, avg)
      return count.positive? ? 2.0 : 0.0 if avg.zero?

      count.to_f / avg
    end

    def maintenance_factor
      days       = @asset.days_since_last_maintenance
      normalized = maintenance_normalized(days)

      {
        value: days,
        normalized: normalized,
        impact: impact_label(normalized),
        label: days ? "Days since last maintenance: #{days}" : 'No maintenance record'
      }
    end

    def maintenance_normalized(days)
      return 80 if days.nil?
      return 100 if days > 365
      return 75  if days > 180
      return 50  if days > 90
      return 25  if days > 30

      0
    end

    def warranty_factor
      days_left  = @asset.days_until_warranty_expires
      normalized = warranty_normalized(days_left)

      {
        value: days_left,
        normalized: normalized,
        impact: impact_label(normalized),
        label: days_left ? "Warranty expires in: #{days_left} days" : 'No warranty data'
      }
    end

    def warranty_normalized(days_left)
      return 0   if days_left.nil?
      return 100 if days_left.negative?
      return 90  if days_left <= 7
      return 70  if days_left <= 15
      return 50  if days_left <= 30
      return 25  if days_left <= 90

      0
    end

    def age_factor
      return { value: nil, normalized: 0, impact: 'low', label: 'No purchase date' } unless @asset.purchase_date

      months     = ((Date.current - @asset.purchase_date) / 30).to_i
      normalized = age_normalized(months)

      {
        value: months,
        normalized: normalized,
        impact: impact_label(normalized),
        label: "Device age: #{months} months"
      }
    end

    def age_normalized(months)
      return 100 if months > 60
      return 75  if months > 48
      return 50  if months > 36
      return 25  if months > 24

      0
    end

    def calculate_score(factors)
      parts = [
        factors[:incident][:normalized]    * WEIGHTS[:incident_score],
        factors[:maintenance][:normalized] * WEIGHTS[:maintenance_score],
        factors[:warranty][:normalized]    * WEIGHTS[:warranty_score],
        factors[:age][:normalized]         * WEIGHTS[:age_score]
      ]

      (parts.sum / 100.0).round.clamp(0, 100)
    end

    def build_metadata(factors, score)
      {
        score: score,
        calculated_at: Time.current.iso8601,
        risk_level: risk_level_label(score),
        factors: serialize_factors(factors),
        recommendation: recommendation(score, factors)
      }
    end

    def serialize_factors(factors)
      {
        incidents: factors[:incident],
        maintenance: factors[:maintenance],
        warranty: factors[:warranty],
        age: factors[:age]
      }
    end

    def recommendation(score, factors)
      return 'Asset is in good condition. Continue regular maintenance schedule.' if score < 40

      issues = build_issues(factors)
      issues.any? ? "Action required: #{issues.join(' and ').capitalize}." : MONITOR_MSG
    end

    def build_issues(factors)
      [].tap do |issues|
        issues << 'schedule immediate maintenance'    if factors[:maintenance][:normalized] >= 75
        issues << 'renew warranty before expiration'  if factors[:warranty][:normalized]    >= 50
        issues << 'review recurring incident pattern' if factors[:incident][:normalized]    >= 75
      end
    end

    def workspace_incident_avg
      total_assets = @workspace.assets.count
      return 0.0 if total_assets.zero?

      AssetIncident.where(workspace: @workspace).last_90_days.count.to_f / total_assets
    end

    def impact_label(normalized)
      return 'high'   if normalized >= 75
      return 'medium' if normalized >= 40

      'low'
    end

    def risk_level_label(score)
      return 'high'   if score >= 70
      return 'medium' if score >= 40

      'low'
    end
  end
end
