# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeaveRequest do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, department: department) }

  describe 'start_date_not_in_past' do
    it 'rejects a start_date in the past' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 1.day.ago.to_date, end_date: 1.week.from_now.to_date)
      expect(request).not_to be_valid
      expect(request.errors[:start_date]).to include("can't be in the past")
    end

    it 'allows a start_date of today' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: Time.zone.today, end_date: 1.week.from_now.to_date)
      expect(request).to be_valid
    end

    it 'allows a future start_date' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 1.week.from_now.to_date, end_date: 2.weeks.from_now.to_date)
      expect(request).to be_valid
    end

    it 'does not re-validate on update, so approving an older request still works' do
      request = create(:leave_request, workspace: workspace, user: user,
                        start_date: 1.week.from_now.to_date, end_date: 2.weeks.from_now.to_date)

      travel_to(3.weeks.from_now) do
        expect(request.update(status: :approved)).to be(true)
      end
    end
  end

  describe 'end_date_after_start_date' do
    it 'is valid when end_date is after start_date' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 1.week.from_now, end_date: 2.weeks.from_now)
      expect(request).to be_valid
    end

    it 'is valid when end_date equals start_date (single-day leave)' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 1.week.from_now, end_date: 1.week.from_now)
      expect(request).to be_valid
    end

    it 'is invalid when end_date is before start_date' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 2.weeks.from_now, end_date: 1.week.from_now)
      expect(request).not_to be_valid
      expect(request.errors[:end_date]).to include('must be after start date')
    end
  end

  describe 'no_overlapping_approved_requests' do
    it 'rejects a new request overlapping an existing approved one for the same user' do
      create(:leave_request, :approved, workspace: workspace, user: user,
                                         start_date: 10.days.from_now, end_date: 20.days.from_now)

      overlapping = build(:leave_request, workspace: workspace, user: user,
                                           start_date: 15.days.from_now, end_date: 25.days.from_now)
      expect(overlapping).not_to be_valid
      expect(overlapping.errors[:base]).to include('overlaps with an existing approved request')
    end

    it 'allows a non-overlapping request for the same user' do
      create(:leave_request, :approved, workspace: workspace, user: user,
                                         start_date: 10.days.from_now, end_date: 20.days.from_now)

      non_overlapping = build(:leave_request, workspace: workspace, user: user,
                                               start_date: 25.days.from_now, end_date: 30.days.from_now)
      expect(non_overlapping).to be_valid
    end

    it 'does not consider pending requests as overlapping' do
      create(:leave_request, workspace: workspace, user: user,
                              start_date: 10.days.from_now, end_date: 20.days.from_now, status: :pending)

      overlapping = build(:leave_request, workspace: workspace, user: user,
                                           start_date: 15.days.from_now, end_date: 25.days.from_now)
      expect(overlapping).to be_valid
    end

    it 'does not consider approved requests from a different user' do
      other_user = create(:user, workspace: workspace, department: department)
      create(:leave_request, :approved, workspace: workspace, user: other_user,
                                         start_date: 10.days.from_now, end_date: 20.days.from_now)

      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: 15.days.from_now, end_date: 25.days.from_now)
      expect(request).to be_valid
    end
  end

  describe '#business_days' do
    it 'counts only weekdays in the range' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: Date.new(2026, 8, 3), end_date: Date.new(2026, 8, 7))
      expect(request.business_days).to eq(5)
    end

    it 'excludes weekends from the count' do
      request = build(:leave_request, workspace: workspace, user: user,
                                       start_date: Date.new(2026, 8, 1), end_date: Date.new(2026, 8, 9))
      expect(request.business_days).to eq(5)
    end

    it 'returns 0 when start_date is missing' do
      request = build(:leave_request, workspace: workspace, user: user, start_date: nil,
                                       end_date: 1.week.from_now.to_date)
      expect(request.business_days).to eq(0)
    end

    it 'returns 0 when end_date is missing' do
      request = build(:leave_request, workspace: workspace, user: user, start_date: 1.week.from_now.to_date,
                                       end_date: nil)
      expect(request.business_days).to eq(0)
    end
  end

  describe 'doctor_certificate_valid' do
    it 'is valid without any certificate attached' do
      request = build(:leave_request, workspace: workspace, user: user)
      expect(request).to be_valid
    end

    it 'accepts an accepted file type' do
      request = build(:leave_request, workspace: workspace, user: user)
      request.doctor_certificate.attach(
        io: Rails.root.join('spec/fixtures/files/certificate.png').open,
        filename: 'certificate.png', content_type: 'image/png'
      )
      expect(request).to be_valid
    end

    it 'rejects an unsupported file type' do
      request = build(:leave_request, workspace: workspace, user: user)
      request.doctor_certificate.attach(
        io: Rails.root.join('spec/fixtures/files/certificate.txt').open,
        filename: 'certificate.txt', content_type: 'text/plain'
      )
      expect(request).not_to be_valid
      expect(request.errors[:doctor_certificate]).to include('must be a PNG, JPG, PDF, or DOC file')
    end

    it 'rejects a file over the size limit' do
      request = build(:leave_request, workspace: workspace, user: user)
      request.doctor_certificate.attach(
        io: Rails.root.join('spec/fixtures/files/certificate.png').open,
        filename: 'certificate.png', content_type: 'image/png'
      )
      allow(request.doctor_certificate).to receive(:byte_size).and_return(11.megabytes)
      expect(request).not_to be_valid
      expect(request.errors[:doctor_certificate]).to include('must be under 10MB')
    end
  end

  describe 'assign_department_from_user' do
    it 'defaults department_id to the user department when not set explicitly' do
      request = build(:leave_request, workspace: workspace, user: user, department: nil)
      request.valid?
      expect(request.department_id).to eq(department.id)
    end

    it 'does not override an explicitly set department_id' do
      other_department = create(:department, workspace: workspace)
      request = build(:leave_request, workspace: workspace, user: user, department: other_department)
      request.valid?
      expect(request.department_id).to eq(other_department.id)
    end

    it 'leaves department_id nil when the user has no department' do
      user_without_dept = create(:user, workspace: workspace, department: nil)
      request = build(:leave_request, workspace: workspace, user: user_without_dept, department: nil)
      request.valid?
      expect(request.department_id).to be_nil
    end
  end

  describe 'leave cap enforcement' do
    context 'when a department-wide cap policy exists' do
      before do
        create(:leave_policy, workspace: workspace, department: department, max_concurrent: 2)
      end

      it 'allows requests under the cap' do
        create(:leave_request, workspace: workspace, user: user, status: :pending)

        new_request = build(:leave_request, workspace: workspace, user: user)
        expect(new_request).to be_valid
      end

      it 'blocks requests at the cap, counting pending + approved together' do
        create(:leave_request, workspace: workspace, user: user, status: :pending)
        create(:leave_request, :approved, workspace: workspace, user: user, start_date: 3.weeks.from_now,
                                           end_date: 4.weeks.from_now)

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.weeks.from_now,
                                             end_date: 6.weeks.from_now)
        expect(new_request).not_to be_valid
        expect(new_request.errors[:base]).to include(include('reached its limit of 2'))
      end

      it 'does not count rejected requests toward the cap' do
        create(:leave_request, :rejected, workspace: workspace, user: user)
        create(:leave_request, workspace: workspace, user: user, status: :pending)

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 3.weeks.from_now,
                                             end_date: 4.weeks.from_now)
        expect(new_request).to be_valid
      end

      it 'does not count requests from a different department' do
        other_department = create(:department, workspace: workspace)
        other_user = create(:user, workspace: workspace, department: other_department)
        create(:leave_request, workspace: workspace, user: other_user, status: :pending)
        create(:leave_request, workspace: workspace, user: other_user, status: :pending,
                                start_date: 3.weeks.from_now, end_date: 4.weeks.from_now)

        new_request = build(:leave_request, workspace: workspace, user: user)
        expect(new_request).to be_valid
      end
    end

    context 'when the applicable policy is leave_type-specific' do
      before do
        create(:leave_policy, :for_vacation, workspace: workspace, max_concurrent: 1)
      end

      it 'blocks vacation requests at the cap but allows other leave types' do
        create(:leave_request, workspace: workspace, user: user, leave_type: :vacation, status: :pending)

        blocked = build(:leave_request, workspace: workspace, user: user, leave_type: :vacation,
                                         start_date: 3.weeks.from_now, end_date: 4.weeks.from_now)
        allowed = build(:leave_request, :sick, workspace: workspace, user: user)

        expect(blocked).not_to be_valid
        expect(allowed).to be_valid
      end
    end

    context 'when no policy applies' do
      it 'has no cap' do
        3.times { create(:leave_request, workspace: workspace, user: user, status: :pending) }

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.weeks.from_now,
                                             end_date: 6.weeks.from_now)
        expect(new_request).to be_valid
      end
    end
  end

  describe 'minimum notice enforcement' do
    context 'when a notice policy exists' do
      before do
        create(:leave_policy, workspace: workspace, department: department, min_notice_days: 14)
      end

      it 'rejects a request starting sooner than the required notice' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.days.from_now,
                                             end_date: 7.days.from_now)
        expect(new_request).not_to be_valid
        expect(new_request.errors[:start_date]).to include(include('at least 14 days'))
      end

      it 'allows a request that meets the required notice' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 20.days.from_now,
                                             end_date: 22.days.from_now)
        expect(new_request).to be_valid
      end
    end

    context 'when no policy applies' do
      it 'allows a request starting tomorrow' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 1.day.from_now,
                                             end_date: 2.days.from_now)
        expect(new_request).to be_valid
      end
    end
  end
end
