# frozen_string_literal: true

Rails.application.routes.draw do
  get '/health', to: 'health#index'

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

  # Public landing page for guests; PublicController#landing redirects
  # authenticated users internally to /dashboard.
  root 'public#landing'

  get  '/login',           to: 'sessions#new',    as: :login_page
  get  '/forgot-password', to: 'sessions#forgot', as: :forgot_password_page
  get  '/up',              to: proc { [200, {}, ['OK']] }

  # ── Dashboard ──────────────────────────────────────────────────────────────
  get '/dashboard', to: 'dashboards#show', as: :dashboard

  #  Ticket Engine ──────────────────────────────────────────────────────
  resources :tickets, except: %i[edit destroy] do
    member do
      post :resolve
    end
    collection do
      get   :export
      patch :bulk_update
    end
    resources :comments, only: %i[create],
                         controller: 'ticket_comments',
                         as: :ticket_comments
  end

  get '/tickets/ai_preview', to: 'ticket_ai_previews#show'

  resources :sla_policies, only: %i[index create update destroy]

  # ── Settings ───────────────────────────────────────────────────────────────
  get   '/settings',    to: 'settings#index',     as: :settings
  patch '/settings/ai', to: 'settings#update_ai', as: :settings_ai
  patch '/settings/automation', to: 'settings#update_automation', as: :settings_automation

  #  HR Operations Hub ──────────────────────────────────────────────────
  get '/hr', to: redirect('/hr/leave_requests'), as: :hr_root

  namespace :hr do
    resources :leave_requests, except: %i[edit update] do
      member do
        post :approve
        post :reject
      end
    end
    get '/sentiment-trending', to: 'sentiment_trending#index', as: :sentiment_trending
    resources :onboarding_plans, only: %i[show] do
      member do
        patch :update_task
      end
    end
  end

  # Notifications ──────────────────────────────────────────────────────
  resources :notifications, only: %i[index] do
    collection do
      post :mark_read
    end
    member do
      post :mark_read
    end
  end

  #  IT Asset Management ────────────────────────────────────────────────
  # /assets conflicts with Rails asset pipeline middleware — use /inventory
  resources :assets, path: 'inventory', except: %i[edit]

  # ── Admin ──────────────────────────────────────────────────────────────────
  namespace :admin do
    get '/',          to: 'overview#index',  as: :root
    get '/audit-log', to: 'audit_log#index', as: :audit_log
    resources :pattern_alerts, only: %i[index update]
    get '/operational-twin', to: 'operational_twin#show', as: :operational_twin
    get '/ai-health', to: 'ai_health#index', as: :ai_health
    get '/benchmark', to: 'benchmark#index', as: :benchmark
    get  '/compliance',          to: 'compliance#show', as: :compliance
    get  '/compliance/download', to: 'compliance#download_pdf', as: :compliance_download
    post '/compliance/purge',    to: 'compliance#purge_user',   as: :compliance_purge
    get  '/telegram-test',       to: 'telegram_test#show',      as: :telegram_test
  end

  #  AI Agent Orchestrator ─────────────────────────────────────────────
  resources :agent_actions, only: [:index] do
    member do
      patch :approve
      patch :reject
      patch :ticket_approve
      patch :ticket_reject
    end
  end

  #  Workflow Engine ────────────────────────────────────────────────────
  resources :workflow_rules, only: %i[index create update destroy]

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

  # Facilities & Space Management ────────────────────────────────────
  namespace :facilities do
    resources :spaces, only: %i[index show] do
      collection do
        get :utilization
        post :optimize
      end
      resources :reservations, only: %i[new create], shallow: true
    end
    resources :reservations, only: [] do
      member do
        patch :cancel
      end
    end
  end

  #  Public API ────────────────────────────────────────────────────────
  namespace :api do
    namespace :v1 do
      resources :tickets, only: %i[index show create]
      resources :assets,  only: %i[index show]
    end
  end

  #  Settings — API Keys & Webhooks ───────────────────────────────────
  namespace :settings do
    resources :api_keys,  only: %i[index create destroy]
    resources :webhooks,  only: %i[index create destroy] do
      member { patch :toggle }
    end
    resources :learning, only: [:index] do
      collection do
        post :apply
        post :dismiss
      end
    end
    resource :profile, only: %i[show update], controller: 'profile'
  end

  # API Dashboard ────────────────────────────────────────────────────
  namespace :admin do
    get 'api_dashboard', to: 'api_dashboard#index', as: :api_dashboard
    get 'data_access_log', to: 'data_access_log#index', as: :data_access_log
  end
end
