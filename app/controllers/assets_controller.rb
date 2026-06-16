# frozen_string_literal: true

class AssetsController < ApplicationController
  include MaskableSerializer

  def index
    authorize :asset, :index?
    assets = policy_scope(Asset).includes(:assigned_to, :department).ordered_by_risk
    render inertia: 'Assets/Index', props: {
      assets: serialize_assets(assets),
      summary: assets_summary(assets)
    }
  end

  def show
    asset = policy_scope(Asset).includes(:assigned_to, :department, :asset_incidents).find(params.expect(:id))
    authorize asset
    render inertia: 'Assets/Show', props: { asset: serialize_asset_detail(asset) }
  end

  def new
    authorize :asset, :create?
    render inertia: 'Assets/New', props: {
      departments: current_workspace.departments.order(:name).map { |dep| { id: dep.id, name: dep.name } },
      users: current_workspace.users.active.order(:first_name).map do |usr|
        { id: usr.id, name: "#{usr.first_name} #{usr.last_name}" }
      end
    }
  end

  def create
    authorize :asset, :create?
    result = It::CreateAsset.call(workspace: current_workspace, user: current_user, params: asset_params)
    if result.success?
      redirect_to assets_path, notice: t('assets.created')
    else
      redirect_to new_asset_path, alert: result.error
    end
  end

  def update
    asset = policy_scope(Asset).includes(:assigned_to, :department, :asset_incidents).find(params.expect(:id))
    authorize asset
    result = It::UpdateAsset.call(asset: asset, user: current_user, params: asset_params)
    if result.success?
      redirect_to asset_path(asset), notice: t('assets.updated')
    else
      redirect_to asset_path(asset), alert: result.error
    end
  end

  def destroy
    asset = policy_scope(Asset).includes(:assigned_to, :department, :asset_incidents).find(params.expect(:id))
    authorize asset
    asset.destroy!
    redirect_to assets_path, notice: t('assets.destroyed')
  end

  private

  def asset_params
    params.expect(
      asset: %i[name model_spec serial_number asset_type status
                purchase_date purchase_price warranty_expires_at
                assigned_to_id department_id condition_at_assignment notes]
    )
  end

  def assets_summary(assets)
    {
      total: assets.count,
      high_risk: assets.high_risk.count,
      in_maintenance: assets.status_in_maintenance.count,
      warranty_expiring: assets.warranty_expiring(30).count
    }
  end

  def serialize_assets(assets)
    assets.map do |ast|
      {
        id: ast.id,
        asset_number: ast.asset_number,
        name: ast.name,
        model_spec: ast.model_spec,
        serial_number: ast.serial_number,
        asset_type: ast.asset_type,
        status: ast.status,
        risk_score: ast.risk_score,
        warranty_expires_at: ast.warranty_expires_at,
        assigned_to: ast.assigned_to ? { id: ast.assigned_to.id, name: ast.assigned_to.full_name } : nil,
        department: ast.department ? { id: ast.department.id, name: ast.department.name } : nil,
        updated_at: ast.updated_at
      }
    end
  end

  def serialize_asset_detail(asset)
    incidents = asset.asset_incidents.order(created_at: :desc).limit(10)
    risk_meta = asset.ai_metadata['risk_assessment']

    base = {
      id: asset.id,
      asset_number: asset.asset_number,
      name: asset.name,
      model_spec: asset.model_spec,
      serial_number: asset.serial_number,
      asset_type: asset.asset_type,
      status: asset.status,
      risk_score: asset.risk_score,
      purchase_date: asset.purchase_date,
      warranty_expires_at: asset.warranty_expires_at,
      days_until_warranty: asset.days_until_warranty_expires,
      last_maintenance_at: asset.last_maintenance_at,
      days_since_maintenance: asset.days_since_last_maintenance,
      condition_at_assignment: asset.condition_at_assignment,
      assigned_at: asset.assigned_at,
      notes: asset.notes,
      assigned_to: asset.assigned_to ? { id: asset.assigned_to.id, name: asset.assigned_to.full_name } : nil,
      department: asset.department ? { id: asset.department.id, name: asset.department.name } : nil,
      risk_assessment: risk_meta,
      incidents: serialize_incidents(incidents),
      created_at: asset.created_at,
      updated_at: asset.updated_at
    }

    sensitive = mask(asset, { purchase_price: asset.purchase_price,
                               vendor_contract_url: asset.vendor_contract_url }, current_user)
    base.merge(sensitive)
  end

  def serialize_incidents(incidents)
    incidents.map do |inc|
      { id: inc.id, title: inc.title, severity: inc.severity,
        status: inc.status, created_at: inc.created_at, resolved_at: inc.resolved_at }
    end
  end
end
