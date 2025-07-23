module ApiCallHelper
  attr_accessor :response, :response_data, :company_id, :log_calls

  def api_partner_id
    raise 'This should be overridden'
  end

  def api_initialize(log_calls = true, remote_ip = nil)
    @log_calls = log_calls
    @log = ApiLog.new
    @log.ip_address = remote_ip
    @log.api_partner_id = api_partner_id()
    @log.company_id = @company_id

    # We may reset this later
    @start_time = Time.now

  end

  def api_start(action, url, data = nil)
    @start_time = Time.now
    @log.action = action

    @log.status = 'start'
    @log.url= url
    @log.request = data if data.present? && data.to_s.length < 60000

    # Save before we even try the call
    @log.save if @log_calls
  end

  def api_exception(ex)
    api_error(ex.message + "\n" + ex.backtrace.join("\n"))
  end

  def api_error(msg, status='error')
    @log.status = status
    @log.response = msg
    @log.response = 'Data too large' if @log.response.to_s.length > 65000

    @log.response_time = (Time.now-@start_time)

    begin
      @log.save if @log_calls
    rescue
      Rails.logger.error("Could not save in api_error for partner #{@log.api_partner_id}\n#{$!.message + "\n" + $!.backtrace.join("\n")}")
    end

  end

  def api_success(response, log_production_successes = false)
    @log.status = 'success'

    # There's no need to log successful responses in production, unless there is.
    if log_production_successes || !Rails.env.production?
      @log.response = response
      @log.response = 'Data too large' if @log.response.to_s.length > 65000
    end

    @log.response_time = (Time.now-@start_time)

    begin
      @log.save if @log_calls
    rescue
      Rails.logger.error("Could not save in api_success for partner #{@log.api_partner_id}")
    end

  end

  def api_failure(response)
    @log.status = 'failure'
    @log.response = response
    @log.response = 'Data too large' if @log.response.to_s.length > 65000

    @log.response_time = (Time.now-@start_time)

    begin
      @log.save if @log_calls
    rescue
      Rails.logger.error("Could not save in api_failure for partner #{@log.api_partner_id}")
    end
  end

  def api_update_request(data)
    @log.request = data if data.present? && data.to_s.length < 60000
    @log.save
  end

  def get_api_partner_stub(api_partner_id)
    if @api_partners.nil?
      @api_partners = ApiPartner.all.inject({}) { |acc, ap| acc[ap.id] = ap.stub ; acc }
    end

    @api_partners[api_partner_id] || "unknown"
  end

end