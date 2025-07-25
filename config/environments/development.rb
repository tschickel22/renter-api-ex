require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join('tmp', 'caching-dev.txt').exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true

    config.cache_store = :memory_store
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.to_i}"
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  config.active_storage.service = :amazon

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.dump_schema_after_migration = false
  config.active_record.belongs_to_required_by_default = false
  config.active_record.verbose_query_logs = true
  config.active_record.index_nested_attribute_errors = true

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true
  Rails.application.routes.default_url_options[:host] = "local.renterinsight.com"
  Rails.application.routes.default_url_options[:port] = "3000"

  config.hosts << "014b-24-52-35-199.ngrok.io"
  config.hosts << "local.renterinsight.com"
  config.x.saml_idp_base = 'http://local.renterinsight.com:3000/'
  config.action_mailer.asset_host = 'http://local.renterinsight.com:3000'
  config.action_mailer.default_url_options = { host: 'local.renterinsight.com', protocol: 'http', port: '3000' }

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address: 'email-smtp.us-west-2.amazonaws.com',
    port: 587,
    domain: 'notifications.renterinsight.com',
    user_name: Rails.application.credentials.dig(:smtp, :username),
    password: Rails.application.credentials.dig(:smtp, :password),
    authentication: 'plain',
    enable_starttls_auto: true
  }
end
