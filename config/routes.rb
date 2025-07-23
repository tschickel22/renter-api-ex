Rails.application.routes.draw do

  require "resque_web"
  get 'users/password/edit' => 'dashboard#index'
  get 'unsubscribe' => 'pages#unsubscribe'

  devise_for :users, controllers: {registrations: "registrations", sessions: "sessions", passwords: "passwords", confirmations: "confirmations"}

  get 'portal/invite/(:id)' => 'portal#invite'
  get 'portal(/*all)' => 'portal#index'
  get 'available-to-rent(/*all)' => 'portal#index'
  get 'property-listings(/*all)' => 'portal#index'

  scope 'api' do
    resources :units, {module: 'api'} do
      collection do
        post 'list_for_property'
      end
    end
  end

  scope 'api/internal' do
    resources :accounts, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :account_reconciliations, {module: 'api'} do
      collection do
        post 'search'
        post 'find_most_recent'
      end
      member do
        get 'account_entries'
        put 'finalize'
      end
    end

    resources :announcements, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        post 'recipient_lease_residents'
        post 'queue_for_delivery'
        post 'save_recipients'
        get 'attachments'
        post 'upload_attachments'
        post 'destroy_attachment'
        post 'clone'
      end
    end

    resources :credit_reporting_activities, {module: 'api'} do
      collection do
        post 'upload_property_list'
      end
    end

    resources :companies, {module: 'api'} do
      collection do
        post 'search'
        get 'taxpayer_info'
        post 'save_taxpayer_info'
        post 'save_property_bank_accounts'
        post 'save_item'
      end
      member do
        post 'payments_activation'
        get 'payments_activation_documents'
        post 'upload_payments_activation_documents'
        post 'destroy_payments_activation_document'
      end
    end

    resources :dashboard, {module: 'api'}

    resources :properties, {module: 'api'} do
      collection do
        post 'search'
        post 'upload'

      end
      member do
        post 'screening_activation'
        get 'screening_attestations'
        post 'save_screening_attestations'
        post 'deactivate'
        get 'residents'
        post 'reactivate'
      end
    end

    resources :property_listings, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        get 'photos'
        post 'upload_photos'
        post 'destroy_photos'
      end
    end

    resources :unit_listings, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        get 'photos'
        post 'upload_photos'
        post 'destroy_photos'
      end
    end

    resources :property_owners, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :insurances, {module: 'api'} do
      collection do
        post 'search'
        post 'switch_api_partner'
        post 'confirm'
      end
      member do
        get 'declarations'
        post 'upload_declarations'
        post 'destroy_declaration'
      end
    end

    resources :expenses, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        get 'receipts'
        post 'upload_receipts'
        post 'destroy_receipt'
      end
    end

    resources :expense_payments, {module: 'api'} do
      collection do
        post 'search'
        post 'create_multiple'
      end
      member do
        post 'void'
      end
    end

    resources :printed_checks, {module: 'api'} do
      collection do
        post 'search'
        post 'update_unprinted_checks'
        post 'delete_unprinted_checks'
        post 'reprint_checks'
      end
    end

    resources :journal_entries, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        get 'documents'
        post 'upload_documents'
        post 'destroy_document'
      end
    end

    resources :vendors, {module: 'api'} do
      collection do
        post 'search'
        post 'save_vendor_category'
      end
    end

    resources :bank_accounts, {module: 'api'} do
      member do
        get 'for_account'
      end
      collection do
        post 'search'
        get 'reconcilable'
      end
    end

    resources :bulk_charges, {module: 'api'} do
      member do
        post 'save_leases'
      end
      collection do
        post 'search'
      end
    end

    resources :communications, {module: 'api'} do
      collection do
        post 'search'
        post 'conversations'
        get 'conversations'
      end
      member do
        post 'save_comment'
        post 'mark_comment_read'
        post 'mark_conversation_read'
        post 'trash'
        post 'trash_conversation'
        post 'destroy_conversation'
      end
    end

    resources :maintenance_requests, {module: 'api'} do
      collection do
        post 'search'
        get 'assignees'
      end
      member do
        post 'close'
        get 'print'
        get 'photos'
        post 'upload_photos'
        post 'destroy_photos'
      end
    end

    resources :settings, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :invoices, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :leases, {module: 'api'} do
      collection do
        post 'search'
        post 'current'
        post 'for_documents'
        post 'create_existing'
      end
      member do
        post 'cancel_move_in'
        get 'determine_check_printing_eligibility'

        get 'lease_documents'
        post 'upload_lease_documents'
        post 'destroy_lease_document'

        get 'move_out_documents'
        post 'upload_move_out_documents'
        post 'destroy_move_out_document'
        get 'residents'
      end
    end

    resources :lease_residents, {module: 'api'} do
      collection do
        post 'search'
      end
      member do
        get 'validation_questions'
        post 'validation_answers'
        post 'resend_email'
        get 'request_reports'
        post 'request_full_access'
        post 'request_electronic_payments'
        post 'reports/:lease_resident_report_id/accept_disclaimer', action: :accept_disclaimer
        get 'reports/:lease_resident_report_id', action: :reports
      end
    end

    resources :residents, {module: 'api'} do
      collection do
        post 'search'
        post 'upload'
      end

      member do
        get 'credit_reporting_activities'

        get 'identification_selfie'
        post 'upload_identification_selfie'
        post 'destroy_identification_selfie'

        get 'identification_copy'
        post 'upload_identification_copy'
        post 'destroy_identification_copy'
      end
    end

    resources :resident_pets, {module: 'api'}

    resources :resident_vehicles, {module: 'api'}

    resources :charges, {module: 'api'} do
      member do
        get 'charges_and_ledger_items'
        get 'rent_and_deposit_charges'
        get 'ledger_item_details/:ledger_item_id', action: :ledger_item_details
      end
    end

    resources :ledger_items, {module: 'api'} do
      member do
        get 'lookup_lease'
      end
    end

    resources :units, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :histories, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :users, {module: 'api'} do
      collection do
        post 'search'
        post 'upgrade_subscription'
      end
    end

    resources :user_roles, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :residents, {module: 'api'} do
      member do
        get 'income_proofs'
        post 'upload_income_proofs'
        post 'destroy_income_proof'
      end
    end

    resources :company_payment_methods, {module: 'api'}

    resources :resident_payment_methods, {module: 'api'} do
      collection do
        post 'search'
      end
    end

    resources :payments, {module: 'api'} do
      collection do
        post 'application_fee'
        post 'pay_application_fee'
        post 'pay_screening_fee'
        post 'create_multiple'
        post 'sign_up_for_recurring_payments'
        post 'make_one_time_payment'
        post 'payment_schedule'
      end
      member do
        post 'refund'
      end
    end

    resources :financials, {module: 'api'} do
      collection do
        get 'summary'
        post 'summary'
      end
    end

    resources :financial_connections, {module: 'api'} do
      collection do
        post 'start'
        post 'store'
        post 'save_account_mapping'
        post 'save_account_unlinking'
      end
      member do
        get 'bank_transaction'
        post 'bank_transactions'
        post 'bank_transaction_matches'
        post 'update_bank_transaction_status'
        post 'save_bank_transaction_match'
      end
    end

    resources :email_templates, {module: 'api'}

    resources :reports, {module: 'api'} do
      member do
        get 'run'
        post 'run'
      end
    end

    resources :zoho_sign, {module: 'api'} do
      collection do
        get 'integration_details/:id', to: 'zoho_sign#integration_details'
      end
    end

    resources :documents, {module: 'api'} do
      collection do
        post 'search'
        post 'searchExternal'
        post 'upload'
        post 'destroy_document'
        post 'destroy_external_document'
        post 'create_template'
        post 'create_document'
        post 'create_document_from_template'
        post 'send_document_for_sign'
        post 'send_document_reminders'
        post 'get_template'
        get 'lease/:id', to: 'documents#get_lease_documents', as: 'get_lease_documents'
        get 'external_document/:id/get_signing_iframe_details', to: 'documents#get_signing_iframe_details', as: 'get_signing_iframe_details'
      end
    end

    resources :tax_reporting, {module: 'api'} do
      collection do
        post 'search'
        post 'submit'
      end
    end

    resources :vendor_insurances, {module: 'api'} do
      member do
        get 'declarations'
        post 'upload_declarations'
        post 'destroy_declaration'
      end
    end

    resources :vendor_licenses, {module: 'api'} do
      member do
        get 'licenses'
        post 'upload_licenses'
        post 'destroy_license'
      end
    end
  end

  namespace :admin do
    resources :users, only: [] do
      member do
        get 'proxy'
        get 'proxy_as_company_admin'
      end
    end
  end

  resources :print do
    collection do
      get 'w9'
      get 'zego_agreement'
    end
    member do
      get 'resident_application'
      get 'cash_pay_coupon'
      get 'cash_pay_coupon_bar_code'
    end
  end

  namespace :webhook do
    resource :msi, controller: :msi
    resource :twilio, controller: :twilio, only: [:create]
    resource :dwellsy, controller: :dwellsy, only: [:show]
    resource :rent, controller: :rent, only: [:show]
    resource :rental_source, controller: :rental_source, only: [:show]
    resource :zillow, controller: :zillow, only: [:show]
    resource :zumper, controller: :zumper, only: [:show]
    resource :email, controller: :email, only: [:create]
    resource :zego, controller: :zego do
      collection do
        post 'processed'
        post 'canceled'
      end
    end
    resource :zoho, controller: :zoho do
      collection do
        get 'subscriptions_complete'
        post 'subscriptions'
        post 'document_status'
      end
    end
  end


  get '/saml/metadata' => 'saml_idp#show'
  get '/saml/auth' => 'saml_idp#create'
  post '/saml/auth' => 'saml_idp#create'
  match '/saml/logout' => 'saml_idp#logout', via: [:get, :post, :delete]

  get '/upload/thank_you', controller: 'webhook/zoho', action: 'zoho_document_thank_you'

  get '/external_document/:id/complete', controller: 'webhook/zoho', action: 'zoho_document_complete'
  get '/external_document/:id/signed', controller: 'webhook/zoho', action: 'zoho_document_signed'

  get '/external_document/:id/sent_for_signature', controller: 'webhook/zoho', action: 'zoho_document_sent_for_signature'
  get '/external_document/:id/template_updated', controller: 'webhook/zoho', action: 'zoho_document_template_updated'
  get '/external_document/:id/signed', controller: 'webhook/zoho', action: 'zoho_document_signed'

  post '/webhook/catch_all', controller: 'webhook/email', action: 'catch_all'
  get '/subscriptions/complete', controller: 'webhook/zoho', action: 'subscriptions_complete'
  get '/System', controller: 'webhook/trans_union', action: 'ping'
  post '/reports/status', controller: 'webhook/trans_union', action: 'reports_status'
  post '/manualauthentication/status', controller: 'webhook/trans_union', action: 'manual_authentication_status'
  get '/mr/:id/qr_code' => 'pages#qr_code'
  get '/mr/:id' =>'pages#maintenance_request_jump'
  get '/export/:filename' => 'dashboard#export'

  authenticate :user, lambda {|u| u.is_admin? } do
    mount ResqueWeb::Engine => "/dlh_resque"
  end

  mount ActionCable.server => '/cable'

  get '/dashboard' => 'dashboard#index'
  get '*all', to: 'dashboard#index', constraints: lambda { |req|
    req.path.exclude? 'rails/active_storage'
  }
  root 'dashboard#index'
end
