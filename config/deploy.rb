# config valid for current version and patch releases of Capistrano
lock "~> 3.17.0"

set :application, "renter-insight-app"
set :repo_url, "git@github.com:doughays/renter-insight-app.git"

# Crashing:
set :stages, %w(sandbox staging production)
set :default_stage, "staging"
set :keep_releases, 20
set :precompile_env, "production"

# If you are using Passenger mod_rails uncomment this:
namespace :deploy do
  desc 'Restart application'
  task :restart do
    on roles(:app), wait: 5 do
      # Your restart mechanism here, for example:
      execute :mkdir, '-p', release_path.join('tmp')
      execute :touch, release_path.join('tmp/restart.txt')
      execute "sudo service god-monitor restart"
    end
  end
end

set :pty, true

set :application, "Renter-Insight-App" # Best with dashes

set :user, "ec2-user"  # The server's user for deploys
set :ssk_key_path, File.join(ENV["HOME"], ".ec2", "renter-insight.pem")
set :use_sudo, false

set :deploy_via, :remote_cache
set :default_shell, "/bin/bash"

#set the ssh options
set :ssh_options, {
  # This will use local keys... forward_agent: true,
  user: fetch(:user),
  keys: [fetch(:ssk_key_path)]
}
