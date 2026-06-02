# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             controllers: {
               sessions:           "users/sessions",
               passwords:          "users/passwords",
               omniauth_callbacks: "users/omniauth_callbacks"
             },
             path_names: { sign_in: "login", sign_out: "logout" }

  devise_scope :user do
    get "/users/login", to: redirect("/login")
  end

  root "dashboard#index"

  get  "/login",           to: "sessions#new",    as: :login_page
  get  "/forgot-password", to: "sessions#forgot", as: :forgot_password_page
  get  "/up",              to: proc { [200, {}, ["OK"]] }

  # ── Dashboard ──────────────────────────────────────────────────────────────
  get "/dashboard", to: "dashboard#index", as: :dashboard

  # ── S3: Ticket Engine ──────────────────────────────────────────────────────
  resources :tickets, except: %i[edit] do
    member do
      post :resolve
    end

    resources :comments, only: %i[create],
              controller: "ticket_comments",
              as:         :ticket_comments
  end

  # SLA Policies
  resources :sla_policies, only: %i[index create update destroy]
end
