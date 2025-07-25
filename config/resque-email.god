number_of_workers = 1

for i in 1..number_of_workers do
    God.watch do |w|
      queues          = ['background_mailer', 'process_inbound_email', 'process_inbound_text']
      queues_str      = queues.join(',')

      w.name          = "resque-email-#{i}"
      w.interval      = 30.seconds
      w.env           = { 'S3_BUCKET_NAME'     => ENV['S3_BUCKET_NAME']}
      w.uid           = 'ec2-user'
      w.gid           = 'ec2-user'
      w.dir           = File.expand_path(File.join(File.dirname(__FILE__),'..'))
      w.start         = "/usr/local/bin/rake resque:work QUEUE=" + queues_str + " RAILS_ENV=#{ENV['RAILS_ENV']} --trace"
      w.start_grace   = 10.seconds
      w.log           = File.expand_path(File.join(File.dirname(__FILE__), '..','log', "email-#{i}.log"))

      # restart if memory gets too high
      w.transition(:up, :restart) do |on|
        on.condition(:memory_usage) do |c|
          c.above = 200.megabytes
          c.times = 2
        end
      end

      # determine the state on startup
      w.transition(:init, { true => :up, false => :start }) do |on|
        on.condition(:process_running) do |c|
          c.running = true
        end
      end

      # determine when process has finished starting
      w.transition([:start, :restart], :up) do |on|
        on.condition(:process_running) do |c|
          c.running = true
          c.interval = 5.seconds
        end

        # failsafe
        on.condition(:tries) do |c|
          c.times = 5
          c.transition = :start
          c.interval = 5.seconds
        end
      end

      # start if process is not running
      w.transition(:up, :start) do |on|
        on.condition(:process_running) do |c|
          c.running = false
        end
      end
    end
end
