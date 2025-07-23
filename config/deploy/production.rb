set :deploy_to, "/data/renter-insight/production"
set :branch, "main"
set :rails_env, "production"

role :app, ["44.234.57.98"]
role :db,  ["44.234.57.98"], primary: true

after 'deploy:publishing', 'deploy:restart'

