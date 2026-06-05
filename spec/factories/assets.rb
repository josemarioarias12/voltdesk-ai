# frozen_string_literal: true

FactoryBot.define do
  factory :asset do
    association :workspace
    sequence(:asset_number) { |n| "AST-#{n.to_s.rjust(5, '0')}" }
    sequence(:name)         { |n| "Asset #{n}" }
    asset_type              { :laptop }
    status                  { :active }
    risk_score              { 0 }
    incident_count          { 0 }
    warranty_alerts_sent    { {} }
    ai_metadata             { {} }

    trait :high_risk do
      risk_score { 85 }
    end

    trait :expiring_warranty do
      warranty_expires_at { 20.days.from_now.to_date }
    end

    trait :with_purchase_info do
      purchase_date       { 18.months.ago.to_date }
      purchase_price      { 1999.99 }
      warranty_expires_at { 18.months.from_now.to_date }
    end
  end
end
