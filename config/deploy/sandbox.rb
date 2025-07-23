set :deploy_to, "/data/renter-insight/sandbox"
set :rails_env, "sandbox"
set :branch, "feature/lease-documents"

role :app, ["34.217.250.188"]
role :db,  ["34.217.250.188"], primary: true

after 'deploy:publishing', 'deploy:restart'

set :precompile_env, "development"

set :user, "sandbox"  # The server's user for deploys
set :ssk_key_path, File.join(ENV["HOME"], ".ec2", "renter-insight-sandbox.pem")

set :ssh_options, {
  user: fetch(:user),
  keys: [fetch(:ssk_key_path)]
}