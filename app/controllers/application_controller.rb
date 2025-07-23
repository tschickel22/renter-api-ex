class ApplicationController < ActionController::Base
  include SentryHelper

  before_action :set_custom_paper_trail_whodunnit
  before_action :set_sentry_user_attributes

  def set_sentry_user_attributes
    Sentry.set_user(helpers.user_attributes_for_logging())
  end

  private

  def set_custom_paper_trail_whodunnit
    PaperTrail.request.whodunnit = current_actual_user&.id
  end
end
