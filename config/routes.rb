# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             controllers: { omniauth_callbacks: 'users/omniauth_callbacks' },
             path_names: { sign_in: 'login', sign_out: 'logout' }

  devise_scope :user do
    get '/users/login', to: redirect('/login')
  end

  root 'dashboard#index'

  get '/login', to: 'sessions#new', as: :login_page

  get '/up', to: proc { [200, {}, ['OK']] }
end
