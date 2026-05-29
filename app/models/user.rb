# frozen_string_literal: true

class User < ApplicationRecord
  include WorkspaceScoped

  devise :database_authenticatable,
         :rememberable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  enum :role, {
    super_admin: 0,
    workspace_admin: 1,
    hr_manager: 2,
    it_manager: 3,
    facilities_manager: 4,
    operations_manager: 5,
    department_manager: 6,
    agent: 7,
    employee: 8,
    guest: 9
  }, prefix: true

  belongs_to :department, optional: true

  validates :email,      presence: true, uniqueness: true,
                         format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true
  validates :last_name,  presence: true
  validates :role,       presence: true

  validates :workspace, presence: true, unless: :role_super_admin?

  def full_name
    "#{first_name} #{last_name}".strip
  end

  def self.from_omniauth(auth, workspace: nil)
    user = find_by(provider: auth.provider, uid: auth.uid)
    user ||= find_by(email: auth.info.email)
    user ? update_from_omniauth(user, auth) : create_from_omniauth(auth, workspace)
  end

  def self.update_from_omniauth(user, auth)
    user.update!(
      provider: auth.provider,
      uid: auth.uid,
      first_name: auth.info.first_name || user.first_name,
      last_name: auth.info.last_name || user.last_name
    )
    user
  end
  private_class_method :update_from_omniauth

  def self.create_from_omniauth(auth, workspace)
    create!(
      email: auth.info.email,
      first_name: auth.info.first_name.presence || 'User',
      last_name: auth.info.last_name.presence || '',
      password: Devise.friendly_token[0, 20],
      provider: auth.provider,
      uid: auth.uid,
      role: :employee,
      workspace: workspace
    )
  end
  private_class_method :create_from_omniauth
end
