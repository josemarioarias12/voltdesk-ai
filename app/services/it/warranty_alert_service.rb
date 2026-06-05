# frozen_string_literal: true

module It
  class WarrantyAlertService
    ALERT_THRESHOLDS = [30, 15, 7].freeze

    def self.call(**args) = new(**args).call

    def initialize(workspace:)
      @workspace = workspace
    end

    def call
      alerts_sent = 0

      ALERT_THRESHOLDS.each do |days|
        find_assets_for_threshold(days).each do |asset|
          next if alert_already_sent?(asset, days)

          send_alert(asset, days)
          mark_alert_sent(asset, days)
          alerts_sent += 1
        end
      end

      ServiceResult.success({ alerts_sent: alerts_sent })
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def find_assets_for_threshold(days)
      upper = days.days.from_now.to_date
      lower = (days - 1).days.from_now.to_date

      @workspace.assets.status_active.where(warranty_expires_at: lower..upper)
    end

    def alert_already_sent?(asset, days)
      asset.warranty_alerts_sent["#{days}_days"] == true
    end

    def mark_alert_sent(asset, days)
      updated = asset.warranty_alerts_sent.merge("#{days}_days" => true)
      asset.update!(warranty_alerts_sent: updated)
    end

    def send_alert(asset, days)
      @workspace.users.where(role: :it_manager).find_each do |manager|
        Notification.create!(
          workspace: @workspace,
          user: manager,
          title: "Warranty expiring in #{days} days",
          body: build_body(asset),
          notification_type: :system_alert,
          resource_type: 'Asset',
          resource_id: asset.id
        )
      end
    end

    def build_body(asset)
      expiry = asset.warranty_expires_at.strftime('%b %d, %Y')
      "Asset #{asset.asset_number} — #{asset.name} warranty expires on #{expiry}."
    end
  end
end
