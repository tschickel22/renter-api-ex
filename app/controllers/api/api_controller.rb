class Api::ApiController < ApplicationController

  include ApplicationHelper

  PAGE_LIMIT = 5

  def index
    query = model_class().for_user(current_user)
    query, total = page(query)
    render_json({ plural_object_key() => query, :total => total })
  end

  def show
    render_json({ singular_object_key() => model_class().for_user(current_user).where(primary_key_field() => params[:id]).first })
  end

  def create
    begin
      @object = setup_new_object()

      handle_before_create()

      @object.assign_attributes(object_params)

      handle_before_create_save()

      if @object.save(validate: validate_during_save())

        handle_after_create()

        render_successful_create()

      else
        render_json({errors: extract_errors_by_attribute(@object)}, false)
      end
    rescue
      Rails.logger.error("CREATE ERROR: #{$!.message}\n #{$!.backtrace.join("\n")}")
      render_json({errors: {base: $!.message}}, false)
    end
  end

  def update
    begin
      load_object_for_update()

      if @object.present?

        handle_before_update()

        @object.assign_attributes(object_params)

        handle_before_update_save()

        if @object.save(validate: validate_during_save())

          handle_after_update()

          render_successful_update()
        else
          render_failed_update()
        end
      else
        render_json({errors: {base: "#{model_class().to_s.humanize} not found"}}, false)
      end
    rescue
      Rails.logger.error("ERROR in update: #{$!.message}\n#{$!.backtrace.join("\n")}")
      render_json({errors: {base: $!.message}}, false)
    end
  end

  def render_successful_update()
    render_json({singular_object_key() => @object}, true)
  end

  def render_failed_update()
      render_json({errors: extract_errors_by_attribute(@object)}, false)
  end

  def render_successful_create()
    render_json({singular_object_key() => @object})
  end

  def search
    objects = perform_search(model_class().for_user(current_user))
    objects, total = page(objects)

    render_json({ plural_object_key() => objects.collect{|o| o.to_builder().attributes! }, total: total  })
  end

  def setup_new_object()
    model_class().new(company_id: current_user.company_id)
  end

  def load_object_for_update()
    @object = model_class().for_user(current_user).where(primary_key_field() => params[:id]).first
  end

  def render_json(response_object, success = true, fatal = false)

    if success
      render json: create_json_response(response_object.merge({success: true}))

    else
      if fatal
        render json: response_object.merge({success: false}), status: 500
      else
        render json: response_object.merge({success: false})
      end

    end
  end

  protected

  def singular_object_key
    model_class().to_s.underscore.to_sym
  end

  def plural_object_key
    model_class().to_s.pluralize(2).underscore.to_sym
  end

  def primary_key_field
    :id
  end

  def handle_before_create()

  end

  def handle_before_create_save()

  end

  def handle_after_create()

  end

  def handle_before_update()

  end

  def handle_before_update_save()

  end

  def handle_after_update()

  end

  def validate_during_save
    true
  end

  def translate_params(p, api_name)
    new_name = "#{api_name}_attributes".to_sym
    p[new_name] = p[api_name]
    p.delete(api_name)

    return p
  end

  def page(query)
    total = query.count

    return query, total
  end

  def create_json_response(response_object)
    if response_object.is_a?(Hash)
      response_object.inject({}) do | acc, (key, value) |
        acc[key] = create_json_response(value)
        acc
      end
    elsif response_object.is_a?(Array) || response_object.is_a?(ActiveRecord::Relation) || response_object.is_a?(ActiveRecord::Associations::CollectionProxy)
      response_object.inject([]) do | acc, value |
        acc << create_json_response(value)
        acc
      end
    elsif response_object.is_a?(Object)
      if response_object.respond_to?(:to_builder)
        response_object.to_builder.attributes!
      else
        response_object
      end
    else
      response_object
    end
  end
end
