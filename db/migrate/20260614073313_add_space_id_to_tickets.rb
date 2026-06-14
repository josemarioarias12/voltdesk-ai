ruby -i -e '
content = File.read(ARGV[0])
content.sub!(
  "  belongs_to :sla_policy,  optional: true",
  "  belongs_to :sla_policy,  optional: true\n  belongs_to :space,        optional: true"
)
File.write(ARGV[0], content)
' app/models/ticket.rb