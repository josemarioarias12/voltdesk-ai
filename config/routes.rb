# frozen_string_literal: true

Rails.application.routes.draw do
  get '/health', to: proc { [200, {}, ['OK']] }

  mount ActionCable.server => '/cable'

  require 'sidekiq/web'
  authenticate :user, ->(u) { u.role_super_admin? || u.role_workspace_admin? } do
    mount Sidekiq::Web => '/sidekiq'
  end
  devise_for :users,
             controllers: {
               sessions: 'users/sessions',
               passwords: 'users/passwords',
               omniauth_callbacks: 'users/omniauth_callbacks'
             },
             path_names: { sign_in: 'login', sign_out: 'logout' }

  devise_scope :user do
    get '/users/login', to: redirect('/login')
  end

  root 'dashboards#show'

  get  '/login',           to: 'sessions#new',    as: :login_page
  get  '/forgot-password', to: 'sessions#forgot', as: :forgot_password_page
  get  '/up',              to: proc { [200, {}, ['OK']] }

  # ── Dashboard ──────────────────────────────────────────────────────────────
  get '/dashboard', to: 'dashboards#show', as: :dashboard

  # ── S3: Ticket Engine ──────────────────────────────────────────────────────
  resources :tickets, except: %i[edit] do
    member do
      post :resolve
    end
    resources :comments, only: %i[create],
                         controller: 'ticket_comments',
                         as: :ticket_comments
  end

  resources :sla_policies, only: %i[index create update destroy]

  # ── Settings ───────────────────────────────────────────────────────────────
  get   '/settings',    to: 'settings#index',     as: :settings
  patch '/settings/ai', to: 'settings#update_ai', as: :settings_ai

  # ── S5: HR Operations Hub ──────────────────────────────────────────────────
  get '/hr', to: redirect('/hr/leave_requests'), as: :hr_root

  namespace :hr do
    resources :leave_requests, except: %i[edit update] do
      member do
        post :approve
        post :reject
      end
    end
    resources :onboarding_plans, only: %i[show] do
      member do
        patch :update_task
      end
    end
  end

  # ── S5: Notifications ──────────────────────────────────────────────────────
  resources :notifications, only: %i[index] do
    collection do
      post :mark_read
    end
    member do
      post :mark_read
    end
  end

  # ── S6: IT Asset Management ────────────────────────────────────────────────
  # /assets conflicts with Rails asset pipeline middleware — use /inventory
  resources :assets, path: 'inventory', except: %i[edit]

  # ── Admin ──────────────────────────────────────────────────────────────────
  namespace :admin do
    get '/',          to: 'overview#index',  as: :root
    get '/audit-log', to: 'audit_log#index', as: :audit_log

    # S7
    resources :pattern_alerts, only: %i[index update]
  end

  # QR Demo Mode
  get  '/demo/:token',        to: 'demo#join',          as: :demo_join
  post '/demo/ticket',        to: 'demo#create_ticket', as: :demo_create_ticket
  get  '/demo/:token/presenter', to: 'demo#presenter',  as: :demo_presenter

  # workspace_admin activates demo
  namespace :workspace_admin do
    post 'demo/activate', to: 'demo_modes#activate', as: :activate_demo
    delete 'demo/deactivate', to: 'demo_modes#deactivate', as: :deactivate_demo
    get 'demo/status', to: 'demo_modes#status', as: :demo_status
  end
end
