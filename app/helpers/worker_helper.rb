require 'active_support/concern'

module WorkerHelper
  extend ActiveSupport::Concern
  included do
    def self.log(msg)
      puts("#{Time.now.to_s}: #{msg}")
    end
  end
end