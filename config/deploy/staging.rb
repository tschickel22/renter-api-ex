set :deploy_to, "/data/renter-insight/staging"
set :rails_env, "staging"
set :branch, "release-019.5"

role :app, ["34.217.250.188"]
role :db,  ["34.217.250.188"], primary: true

after 'deploy:publishing', 'deploy:restart'

