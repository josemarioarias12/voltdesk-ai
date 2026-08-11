# frozen_string_literal: true

module Ai
  module Tools
    class LogAssetMaintenance < Base
      ALLOWED_STATUSES = %w[active in_maintenance].freeze

      def self.tool_name = 'log_asset_maintenance'

      def self.description
        'Logs a maintenance action on an asset — either starting maintenance or marking it ' \
          'complete — following a two-step confirm-before-execute flow. You must NEVER compose ' \
          'or describe the change yourself from memory — the preview the user sees must always ' \
          'come from an actual call to this tool. Step 1: call this tool with confirmed omitted ' \
          'or false as soon as you have an asset and the intended status; this validates the ' \
          'request WITHOUT saving it and returns a real preview of exactly what will change. ' \
          'Present THAT returned summary to the user, not your own version. Step 2: only after ' \
          'the user explicitly confirms, call this tool again with confirmed: true and the exact ' \
          'same parameters used in the preview. This tool can only move an asset between active ' \
          'and in_maintenance — retiring an asset or marking it lost is not available here and ' \
          'must be done by a human directly in the Assets screen.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            asset_identifier: {
              type: 'string',
              description: 'The asset number (e.g. "AST-00142") or name, as the user referred ' \
                           'to it. Never pass a database id or a list position — always the ' \
                           'number or name.'
            },
            status: {
              type: 'string',
              enum: ALLOWED_STATUSES,
              description: 'Use "in_maintenance" to log that maintenance is starting. Use ' \
                           '"active" to log that maintenance is complete and the asset is back ' \
                           'in service.'
            },
            notes: {
              type: 'string',
              description: 'What maintenance was performed or is planned. Appended to the ' \
                           "asset's existing notes with a date stamp — never overwrites prior notes."
            },
            performed_at: {
              type: 'string',
              description: 'Date the maintenance was completed, in YYYY-MM-DD format. Only ' \
                           'used when status is "active". Defaults to today if omitted.'
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true only on the second call, after explicit user ' \
                           'confirmation. Defaults to false.'
            }
          },
          required: %w[asset_identifier status]
        }
      end

      def self.visible_to?(user)
        AssetPolicy.new(user, Asset.new(workspace: user.workspace)).update?
      end

      def call(asset_identifier:, status:, notes: nil, performed_at: nil, confirmed: false)
        unless ALLOWED_STATUSES.include?(status)
          return ServiceResult.failure("Invalid status. Use 'active' or 'in_maintenance'.")
        end

        asset = resolve_asset(asset_identifier)
        return asset if asset.is_a?(ServiceResult)

        if asset.status == status
          return ServiceResult.failure("#{asset.name} (#{asset.asset_number}) is already #{status.tr('_', ' ')}.")
        end

        update_params = build_update_params(asset, status, notes, performed_at)
        return update_params if update_params.is_a?(ServiceResult)

        return execute(asset, update_params) if confirmed

        preview(asset, update_params)
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def resolve_asset(identifier)
        scope = @workspace.assets
        by_number = scope.where('LOWER(asset_number) = ?', identifier.to_s.downcase).first
        return by_number if by_number

        by_name = scope.where('LOWER(name) = ?', identifier.to_s.downcase).first
        return by_name if by_name

        matches = scope.where('LOWER(name) LIKE ?', "%#{identifier.to_s.downcase}%").to_a
        return matches.first if matches.size == 1

        ServiceResult.failure(no_match_message(identifier, matches))
      end

      def no_match_message(identifier, matches)
        if matches.empty?
          "No asset matches \"#{identifier}\". Ask the user for the asset number " \
            '(e.g. AST-00142) or a more specific name.'
        else
          sample = matches.first(5).map { |a| "#{a.name} (#{a.asset_number})" }.join(', ')
          extra = matches.size > 5 ? " and #{matches.size - 5} more" : ''
          "\"#{identifier}\" matches multiple assets: #{sample}#{extra}. Ask the user which one they mean."
        end
      end

      def build_update_params(asset, status, notes, performed_at)
        params = { status: status }
        params[:notes] = append_note(asset.notes, notes) if notes.present?

        return params unless status == 'active'

        if performed_at.present?
          date = parse_date(performed_at)
          return ServiceResult.failure('Invalid performed_at date format. Use YYYY-MM-DD.') unless date
        else
          date = Date.current
        end

        params[:last_maintenance_at] = date
        params
      end

      def append_note(existing, new_note)
        stamped = "[#{Date.current.iso8601}] #{new_note}"
        existing.present? ? "#{existing}\n#{stamped}" : stamped
      end

      def parse_date(value)
        Date.iso8601(value.to_s)
      rescue ArgumentError
        nil
      end

      def preview(asset, update_params)
        previous_status = asset.status
        asset.assign_attributes(update_params)
        return ServiceResult.failure(asset.errors.full_messages.join(', ')) unless asset.valid?

        ServiceResult.success(
          preview: true,
          summary: {
            asset_name: asset.name,
            asset_number: asset.asset_number,
            status: "#{previous_status} → #{asset.status}",
            last_maintenance_at: update_params[:last_maintenance_at],
            notes: update_params[:notes]
          }.compact,
          params: update_params
        )
      end

      def execute(asset, update_params)
        result = It::UpdateAsset.call(asset: asset, user: @user, params: update_params)
        return result if result.failure?

        ServiceResult.success(
          message: "Maintenance logged for #{result.data.name} (#{result.data.asset_number}).",
          asset: result.data,
          resource_link: {
            title: "#{result.data.name} (#{result.data.asset_number})",
            path: "/inventory/#{result.data.id}",
            icon: 'wrench'
          }
        )
      end
    end
  end
end
