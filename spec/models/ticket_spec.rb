# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ticket, type: :model do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:creator)    { create(:user, workspace: workspace) }

  before { allow(ActionCable.server).to receive(:broadcast) }

  describe 'associations' do
    it { is_expected.to belong_to(:workspace) }
    it { is_expected.to belong_to(:department) }
    it { is_expected.to belong_to(:created_by).class_name('User') }
    it { is_expected.to belong_to(:assigned_to).class_name('User').optional }
    it { is_expected.to belong_to(:sla_policy).optional }
    it { is_expected.to belong_to(:space).optional }
    it { is_expected.to have_many(:comments).class_name('TicketComment').dependent(:destroy) }
    it { is_expected.to have_many(:activities).class_name('TicketActivity').dependent(:destroy) }
    it { is_expected.to have_one(:ticket_embedding).dependent(:destroy) }
  end

  describe 'enums' do
    it {
      expect(subject).to define_enum_for(:status)
        .with_values(open: 0, in_progress: 1, pending: 2, resolved: 3, closed: 4,
                     pending_classification: 5)
        .with_prefix(:status)
    }

    it {
      expect(subject).to define_enum_for(:priority)
        .with_values(low: 0, medium: 1, high: 2, critical: 3)
        .with_prefix(:priority)
    }

    it {
      expect(subject).to define_enum_for(:category)
        .with_values(general: 0, it: 1, hr: 2, facilities: 3, finance: 4, operations: 5, support: 6)
        .with_prefix(:category)
    }

    it {
      expect(subject).to define_enum_for(:source)
        .with_values(web: 0, voice: 1, qr_demo: 2, email: 3)
        .with_prefix(:source)
    }

    it {
      expect(subject).to define_enum_for(:sla_risk_level)
        .with_values(none: 0, watch: 1, at_risk: 2, critical: 3)
        .with_prefix(:sla_risk)
    }
  end

  describe 'validations' do
    subject { build(:ticket, workspace: workspace, department: department, created_by: creator) }

    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_length_of(:title).is_at_least(3).is_at_most(255) }
    it { is_expected.to validate_presence_of(:ticket_number) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_presence_of(:priority) }
    it { is_expected.to validate_presence_of(:category) }
    it { is_expected.to validate_presence_of(:source) }

    it { is_expected.to allow_value(0).for(:urgency_score) }
    it { is_expected.to allow_value(100).for(:urgency_score) }
    it { is_expected.not_to allow_value(-1).for(:urgency_score) }
    it { is_expected.not_to allow_value(101).for(:urgency_score) }

    describe 'ticket_number uniqueness' do
      it 'is invalid when duplicated within the same workspace' do
        create(:ticket, workspace: workspace, department: department, created_by: creator,
                         ticket_number: 'TK-DUPLICATE')
        duplicate = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                    ticket_number: 'TK-DUPLICATE')

        expect(duplicate).not_to be_valid
        expect(duplicate.errors[:ticket_number]).to be_present
      end

      it 'is valid when the same number exists in a different workspace' do
        other_workspace = create(:workspace)
        other_department = create(:department, workspace: other_workspace)
        other_creator = create(:user, workspace: other_workspace)

        create(:ticket, workspace: other_workspace, department: other_department, created_by: other_creator,
                         ticket_number: 'TK-SHARED')
        duplicate = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                    ticket_number: 'TK-SHARED')

        expect(duplicate).to be_valid
      end
    end
  end

  describe 'scopes' do
    describe '.open_tickets' do
      it 'includes open, in_progress and pending tickets only' do
        open_t     = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :open)
        progress_t = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :in_progress)
        pending_t  = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :pending)
        resolved_t = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :resolved)

        result = described_class.where(workspace: workspace).open_tickets

        expect(result).to include(open_t, progress_t, pending_t)
        expect(result).not_to include(resolved_t)
      end
    end

    describe '.sla_at_risk and .sla_breached' do
      it 'classifies tickets by due_at relative to now' do
        freeze_time do
          at_risk  = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                      status: :open, due_at: 10.minutes.from_now)
          breached = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                      status: :open, due_at: 10.minutes.ago)
          safe     = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                      status: :open, due_at: 2.hours.from_now)

          scoped = described_class.where(workspace: workspace)

          expect(scoped.sla_at_risk).to include(at_risk)
          expect(scoped.sla_at_risk).not_to include(breached, safe)
          expect(scoped.sla_breached).to include(breached)
          expect(scoped.sla_breached).not_to include(at_risk, safe)
        end
      end
    end

    describe '.for_department' do
      it 'returns only tickets for the given department' do
        other_department = create(:department, workspace: workspace)
        matching = create(:ticket, workspace: workspace, department: department, created_by: creator)
        other    = create(:ticket, workspace: workspace, department: other_department, created_by: creator)

        result = described_class.where(workspace: workspace).for_department(department.id)

        expect(result).to include(matching)
        expect(result).not_to include(other)
      end
    end

    describe '.assigned_to_agent' do
      it 'returns only tickets assigned to the given user' do
        agent  = create(:user, :agent, workspace: workspace, department: department)
        theirs = create(:ticket, workspace: workspace, department: department, created_by: creator, assigned_to: agent)
        others = create(:ticket, workspace: workspace, department: department, created_by: creator)

        result = described_class.where(workspace: workspace).assigned_to_agent(agent.id)

        expect(result).to include(theirs)
        expect(result).not_to include(others)
      end
    end

    describe '.recent' do
      it 'orders tickets by created_at descending' do
        older = create(:ticket, workspace: workspace, department: department, created_by: creator, created_at: 2.days.ago)
        newer = create(:ticket, workspace: workspace, department: department, created_by: creator, created_at: 1.hour.ago)

        result = described_class.where(workspace: workspace).recent

        expect(result.first).to eq(newer)
        expect(result.last).to eq(older)
      end
    end

    describe '.filtered_by' do
      it 'filters by status, priority, department and title text' do
        target = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                  status: :open, priority: :high, title: 'VPN connectivity issue')
        create(:ticket, workspace: workspace, department: department, created_by: creator,
               status: :resolved, priority: :low, title: 'Printer jam')

        result = described_class.where(workspace: workspace).filtered_by(
          status: 'open', priority: 'high', department_id: department.id, q: 'VPN'
        )

        expect(result).to contain_exactly(target)
      end

      it 'returns all tickets when no filters are given' do
        create(:ticket, workspace: workspace, department: department, created_by: creator)
        create(:ticket, workspace: workspace, department: department, created_by: creator)

        expect(described_class.where(workspace: workspace).filtered_by({}).count).to eq(2)
      end
    end
  end

  describe '#can_transition_to?' do
    valid_transitions = {
      'open' => %w[in_progress closed],
      'in_progress' => %w[pending resolved],
      'pending' => %w[in_progress resolved],
      'resolved' => %w[closed open],
      'closed' => %w[open],
      'pending_classification' => %w[open in_progress]
    }

    all_statuses = valid_transitions.keys

    valid_transitions.each do |from_status, targets|
      targets.each do |to_status|
        it "allows #{from_status} -> #{to_status}" do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, status: from_status)
          expect(ticket.can_transition_to?(to_status)).to be true
        end
      end

      (all_statuses - targets - [from_status]).each do |invalid_target|
        it "forbids #{from_status} -> #{invalid_target}" do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, status: from_status)
          expect(ticket.can_transition_to?(invalid_target)).to be false
        end
      end
    end

    describe 'admin override' do
      %w[super_admin workspace_admin].each do |admin_role|
        it "allows #{admin_role} to force any non-terminal status directly to resolved" do
          admin = build(:user, workspace: workspace, role: admin_role)

          # rubocop:disable Performance/CollectionLiteralInLoop
          %w[open pending pending_classification].each do |from_status|
            ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, status: from_status)
            expect(ticket.can_transition_to?('resolved', user: admin)).to be true
          end
          # rubocop:enable Performance/CollectionLiteralInLoop
        end
      end

      it 'does not grant the override to a non-admin role' do
        agent = build(:user, workspace: workspace, role: :agent)
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, status: 'open')

        expect(ticket.can_transition_to?('resolved', user: agent)).to be false
      end

      it 'does not apply to statuses other than resolved' do
        admin = build(:user, workspace: workspace, role: :workspace_admin)
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, status: 'open')

        expect(ticket.can_transition_to?('closed', user: admin)).to be true
        expect(ticket.can_transition_to?('pending', user: admin)).to be false
      end
    end
  end

  describe 'SLA helpers' do
    describe '#sla_breached?' do
      it 'returns true when due_at is in the past and ticket is open' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: 1.hour.ago)
        expect(ticket.sla_breached?).to be true
      end

      it 'returns false when due_at is in the future' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: 1.hour.from_now)
        expect(ticket.sla_breached?).to be false
      end

      it 'returns false when the ticket is already resolved' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :resolved, due_at: 1.hour.ago)
        expect(ticket.sla_breached?).to be false
      end

      it 'returns false when due_at is nil' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: nil)
        expect(ticket.sla_breached?).to be false
      end
    end

    describe '#sla_at_risk?' do
      it 'returns true when due_at falls within the risk window' do
        freeze_time do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                   status: :open, due_at: 10.minutes.from_now)
          expect(ticket.sla_at_risk?).to be true
        end
      end

      it 'returns false when due_at is beyond the risk window' do
        freeze_time do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                   status: :open, due_at: 2.hours.from_now)
          expect(ticket.sla_at_risk?).to be false
        end
      end

      it 'returns false when already breached' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: 10.minutes.ago)
        expect(ticket.sla_at_risk?).to be false
      end

      it 'accepts a custom risk window' do
        freeze_time do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                   status: :open, due_at: 50.minutes.from_now)
          expect(ticket.sla_at_risk?(within: 1.hour)).to be true
          expect(ticket.sla_at_risk?(within: 10.minutes)).to be false
        end
      end
    end

    describe '#sla_remaining' do
      it 'returns nil when due_at is blank' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator, due_at: nil)
        expect(ticket.sla_remaining).to be_nil
      end

      it 'returns the remaining duration when due_at is present' do
        freeze_time do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                   due_at: 30.minutes.from_now)
          expect(ticket.sla_remaining).to eq(30.minutes)
        end
      end
    end

    describe '#sla_status' do
      it 'returns :met for a resolved ticket' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :resolved, due_at: 1.hour.ago)
        expect(ticket.sla_status).to eq(:met)
      end

      it 'returns :met for a closed ticket' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :closed, due_at: 1.hour.ago)
        expect(ticket.sla_status).to eq(:met)
      end

      it 'returns :breached when overdue and still open' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: 1.hour.ago)
        expect(ticket.sla_status).to eq(:breached)
      end

      it 'returns :at_risk when close to due_at' do
        freeze_time do
          ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                   status: :open, due_at: 10.minutes.from_now)
          expect(ticket.sla_status).to eq(:at_risk)
        end
      end

      it 'returns :on_track otherwise' do
        ticket = build(:ticket, workspace: workspace, department: department, created_by: creator,
                                 status: :open, due_at: 5.hours.from_now)
        expect(ticket.sla_status).to eq(:on_track)
      end
    end
  end

  describe 'callbacks' do
    describe '#set_due_at (before_create)' do
      it 'uses the explicit sla_policy when one is assigned' do
        policy = create(:sla_policy, workspace: workspace, priority: :high, resolution_hours: 6)
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                  priority: :high, sla_policy: policy, due_at: nil)

        expect(ticket.due_at).to be_within(1.second).of(ticket.created_at + 6.hours)
      end

      it "falls back to the workspace's policy matching the ticket priority" do
        create(:sla_policy, workspace: workspace, priority: :critical, first_response_hours: 1, resolution_hours: 2)
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                  priority: :critical, sla_policy: nil, due_at: nil)

        expect(ticket.due_at).to be_within(1.second).of(ticket.created_at + 2.hours)
      end

      it 'leaves due_at nil when no matching policy exists' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                  priority: :medium, sla_policy: nil, due_at: nil)

        expect(ticket.due_at).to be_nil
      end

      it 'does not override an explicitly provided due_at' do
        explicit_due_at = 3.days.from_now
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator,
                                  due_at: explicit_due_at)

        expect(ticket.due_at).to be_within(1.second).of(explicit_due_at)
      end
    end

    describe '#set_resolved_at (before_save)' do
      it 'sets resolved_at when created directly with status resolved' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :resolved)
        expect(ticket.resolved_at).to be_present
      end

      it 'sets resolved_at when transitioning to resolved via update' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :in_progress)
        expect { ticket.update!(status: :resolved) }.to change { ticket.resolved_at }.from(nil)
      end

      it 'does not touch resolved_at on unrelated updates' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :open)
        expect { ticket.update!(title: 'Renamed') }.not_to change(ticket, :resolved_at)
      end
    end

    describe 'after_create_commit' do
      it 'enqueues Workflows::EvaluateRulesJob with ticket_created' do
        expect do
          create(:ticket, workspace: workspace, department: department, created_by: creator)
        end.to have_enqueued_job(Workflows::EvaluateRulesJob).with(kind_of(Integer), 'ticket_created')
      end

      it 'broadcasts a ticket_added event on the operational twin channel' do
        create(:ticket, workspace: workspace, department: department, created_by: creator)

        expect(ActionCable.server).to have_received(:broadcast).with(
          "operational_twin_#{workspace.id}", hash_including(event: 'ticket_added')
        )
      end
    end

    describe 'after_update_commit' do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, created_by: creator, status: :open) }

      it 'enqueues Workflows::EvaluateRulesJob when status changes' do
        ticket
        expect do
          ticket.update!(status: :in_progress)
        end.to have_enqueued_job(Workflows::EvaluateRulesJob).with(ticket.id, 'ticket_updated')
      end

      it 'does not enqueue Workflows::EvaluateRulesJob for untracked field changes' do
        ticket
        expect do
          ticket.update!(description: 'Updated description')
        end.not_to have_enqueued_job(Workflows::EvaluateRulesJob)
      end

      it 'enqueues Tickets::SendAssignmentEmailJob when assigned_to_id changes to a present value' do
        agent = create(:user, :agent, workspace: workspace, department: department)
        ticket
        expect do
          ticket.update!(assigned_to: agent)
        end.to have_enqueued_job(Tickets::SendAssignmentEmailJob).with(ticket.id)
      end

      it 'does not enqueue Tickets::SendAssignmentEmailJob when assigned_to is cleared' do
        agent = create(:user, :agent, workspace: workspace, department: department)
        ticket.update!(assigned_to: agent)
        expect do
          ticket.update!(assigned_to: nil)
        end.not_to have_enqueued_job(Tickets::SendAssignmentEmailJob)
      end

      it 'enqueues Tickets::SendResolutionEmailJob when status changes to resolved' do
        ticket.update!(status: :in_progress)
        expect do
          ticket.update!(status: :resolved)
        end.to have_enqueued_job(Tickets::SendResolutionEmailJob).with(ticket.id)
      end

      it 'does not enqueue Tickets::SendResolutionEmailJob for other status transitions' do
        expect do
          ticket.update!(status: :in_progress)
        end.not_to have_enqueued_job(Tickets::SendResolutionEmailJob)
      end

      it 'broadcasts a ticket_resolved event only when status becomes resolved' do
        ticket.update!(status: :in_progress)
        ticket.update!(status: :resolved)

        expect(ActionCable.server).to have_received(:broadcast).with(
          "operational_twin_#{workspace.id}", hash_including(event: 'ticket_resolved')
        ).once
      end
    end

    describe 'seed-safe behavior' do
      it 'does not enqueue SendAssignmentEmailJob when assigned_to is set directly on create' do
        agent = create(:user, :agent, workspace: workspace, department: department)

        expect do
          create(:ticket, workspace: workspace, department: department, created_by: creator,
                          assigned_to: agent, status: :resolved)
        end.not_to have_enqueued_job(Tickets::SendAssignmentEmailJob)
      end

      it 'does not enqueue SendResolutionEmailJob when status resolved is set directly on create' do
        agent = create(:user, :agent, workspace: workspace, department: department)

        expect do
          create(:ticket, workspace: workspace, department: department, created_by: creator,
                          assigned_to: agent, status: :resolved)
        end.not_to have_enqueued_job(Tickets::SendResolutionEmailJob)
      end

      it 'does not enqueue SendAssignmentEmailJob when using update_columns' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :in_progress)

        expect do
          ticket.update_columns(resolved_at: Time.current, updated_at: Time.current)
        end.not_to have_enqueued_job(Tickets::SendAssignmentEmailJob)
      end

      it 'does not enqueue SendResolutionEmailJob when using update_columns' do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: creator, status: :in_progress)

        expect do
          ticket.update_columns(resolved_at: Time.current, updated_at: Time.current)
        end.not_to have_enqueued_job(Tickets::SendResolutionEmailJob)
      end
    end
  end
end
