# frozen_string_literal: true

module Ai
  module Tools
    class CrossModuleInsight < Base
      # Only roles that see ALL tickets (TicketPolicy::ADMIN_MANAGER_ROLES) AND
      # ALL assets (AssetPolicy#index?) across the whole workspace, not scoped to a
      # single department, may cross them together — otherwise the tool would silently
      # combine a full ticket picture with a partial asset picture (or vice versa).
      ALLOWED_ROLES = %i[super_admin workspace_admin it_manager operations_manager].freeze
      HIGH_RISK_THRESHOLD = 70

      def self.tool_name = 'cross_module_insight'

      def self.description
        'Cross-references open tickets and high-risk assets (risk_score > 70) per department ' \
          'to find which department needs the most operational attention right now. The score ' \
          'per department is the sum of urgency_score across its open tickets plus risk_score ' \
          'across its high-risk assets — both already 0-100 scales from the real AI models, so a ' \
          'few critical tickets outweigh many low-priority ones. Use this for phrasing like ' \
          '"Which department needs help?", "which department is struggling", or "give me an ' \
          'operational health summary". Assets with no department assigned are not attributed ' \
          'to any department and are excluded from the comparison.'
      end

      def self.visible_to?(user)
        user.role.to_sym.in?(ALLOWED_ROLES)
      end

      def call(**_params)
        rows = @workspace.departments.map { |dept| department_row(dept) }
        sorted = rows.sort_by { |row| -row[:score] }

        ServiceResult.success(
          departments: sorted,
          department_needing_most_help: sorted.first
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def department_row(department)
        open_tickets = Ticket.where(workspace: @workspace, department_id: department.id).open_tickets
        high_risk_assets = Asset.where(workspace: @workspace, department_id: department.id)
                                .where('risk_score > ?', HIGH_RISK_THRESHOLD)

        {
          department: department.name,
          department_id: department.id,
          open_tickets: open_tickets.count,
          high_risk_assets: high_risk_assets.count,
          score: open_tickets.sum(:urgency_score) + high_risk_assets.sum(:risk_score)
        }
      end
    end
  end
end
