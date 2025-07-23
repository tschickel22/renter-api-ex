Sentry.init do |config|
  config.dsn = 'https://ec44d998fc759ffcd20dac58d6a51165@o4505891623272448.ingest.sentry.io/4505891624779776'
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.excluded_exceptions += ['Net::SMTPSyntaxError']
  config.propagate_traces = false

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = Rails.env.production? ? 0.1 : 1.0

  # or
  config.traces_sampler = lambda do |context|
    true
  end
end if !Rails.env.development?
