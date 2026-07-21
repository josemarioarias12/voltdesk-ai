# frozen_string_literal: true

namespace :security do
  desc 'Run full security audit: Brakeman + bundle-audit + isolation + rate limiting specs'
  task audit: :environment do
    passed = true

    puts "\n== VoltDesk AI Security Audit =="

    puts "\n[1/3] Running Brakeman static analysis..."
    system('bundle exec brakeman --no-pager -q -i .brakeman.ignore')
    if $CHILD_STATUS.success?
      puts '  ✓ Brakeman: 0 warnings'
    else
      puts '  ✗ Brakeman: warnings found'
      passed = false
    end

    puts "\n[2/3] Running bundle-audit dependency check..."
    system('bundle exec bundle-audit check --update')
    if $CHILD_STATUS.success?
      puts '  ✓ bundle-audit: 0 vulnerabilities'
    else
      puts '  ✗ bundle-audit: vulnerabilities found'
      passed = false
    end

    puts "\n[3/3] Running security specs..."
    system('bundle exec rspec ' \
           'spec/requests/workspace_isolation_spec.rb ' \
           'spec/requests/rack_attack_spec.rb --format progress')
    if $CHILD_STATUS.success?
      puts '  ✓ Security specs: 0 failures'
    else
      puts '  ✗ Security specs: failures found'
      passed = false
    end

    puts ''
    if passed
      puts '✓ Security audit passed — 0 issues found'
    else
      puts '✗ Security audit FAILED — review output above'
      exit 1
    end
  end
end
