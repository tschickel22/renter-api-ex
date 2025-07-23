Resque.redis = Rails.application.credentials.dig(:redis_endpoint) || 'localhost:6379'
#TODO Resque.schedule = YAML.load_file('config/resque-schedule.yml')
