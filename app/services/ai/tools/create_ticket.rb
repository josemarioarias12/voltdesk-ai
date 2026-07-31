# frozen_string_literal: true

module Ai
  module Tools
    class CreateTicket < Base
      def self.tool_name = 'create_ticket'

      def self.description
        'Creates a new support ticket in the workspace, following a two-step confirm-before-execute flow. ' \
          'The first call (confirmed omitted or false) validates the ticket WITHOUT saving it and returns a ' \
          'preview summary for the user to confirm in their own words. Only call this tool again with ' \
          'confirmed: true — reusing the EXACT same parameters returned in the preview — after the user has ' \
          'explicitly confirmed. Never set confirmed: true on the first call, and never regenerate the ' \
          'parameters from memory on the second call. IMPORTANT: if the result contains preview: true, ' \
          'nothing was saved — do not tell the user it was created.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short ticket title, between 3 and 255 characters.'
            },
            description: {
              type: 'string',
              description: 'Full description of the issue or request.'
            },
            category: {
              type: 'string',
              enum: Ticket.categories.keys,
              description: 'Ticket category. Do NOT ask the user for this — omit it unless ' \
                           'they mention it unprompted. It defaults to "general" and is refined ' \
                           'automatically by the real AI classification pipeline after creation.'
            },
            priority: {
              type: 'string',
              enum: Ticket.priorities.keys,
              description: 'Ticket priority. Do NOT ask the user for this — omit it unless ' \
                           'they mention it unprompted. It defaults to "medium" and is refined ' \
                           'automatically by the real AI classification pipeline after creation.'
            },
            department_id: {
              type: 'integer',
              description: 'Required ONLY if the current user has no department of their own. ' \
                           'Otherwise omit it entirely — it is resolved automatically from the user.'
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true only on the second call, after explicit user confirmation. ' \
                           'Defaults to false.'
            }
          },
          required: %w[title description]
        }
      end

      def self.visible_to?(user)
        TicketPolicy.new(user, :ticket).create?
      end

      def call(title:, description:, category: nil, priority: nil, department_id: nil, confirmed: false)
        department_result = resolve_department_id(department_id)
        return department_result if department_result.is_a?(ServiceResult)

        ticket_params = build_params(title, description, category, priority, department_result)

        return execute(ticket_params) if confirmed

        preview(ticket_params)
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def resolve_department_id(department_id)
        return @user.department_id if @user.department_id.present?
        return department_id if department_id.present?

        ServiceResult.failure(
          'This user has no department of their own — department_id is required to create a ticket for them.'
        )
      end

      def build_params(title, description, category, priority, department_id)
        {
          title: title,
          description: description,
          category: category.presence || 'general',
          priority: priority.presence || 'medium',
          department_id: department_id,
          source: 'web'
        }
      end

      def preview(ticket_params)
        ticket = @workspace.tickets.new(
          ticket_params.merge(created_by: @user, ticket_number: 'PREVIEW')
        )
        return ServiceResult.failure(ticket.errors.full_messages.join(', ')) unless ticket.valid?

        ServiceResult.success(
          preview: true,
          summary: {
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            department: ticket.department.name
          },
          params: ticket_params
        )
      end

      def execute(ticket_params)
        result = Tickets::CreateTicket.call(workspace: @workspace, user: @user, params: ticket_params)
        return result if result.failure?

        ServiceResult.success(
          message: "Ticket #{result.data.ticket_number} created successfully.",
          ticket: result.data,
          resource_link: {
            title: "Ticket #{result.data.ticket_number}",
            path: "/tickets/#{result.data.id}",
            icon: 'ticket'
          }
        )
      end
    end
  end
end
