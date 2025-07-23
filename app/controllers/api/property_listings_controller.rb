class Api::PropertyListingsController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_photos]

  def model_class
    PropertyListing
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(property_listings)
    property_listings.where(["hash_id like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def search
    if params[:property_listing_id]
      objects = PropertyListing.where(hash_id: params[:property_listing_id])

      if params[:entire_company] && !objects.empty?
        company = objects.first.company

        # Find all unit listings for this company
        unit_listings = UnitListing.where(company_id: company.id).active
        property_listings = PropertyListing.where(company_id: company.id)
        property_photos = property_listings.collect{|pl| pl.photos.first.present? ? {property_id: pl.property_id}.merge(PropertyListing.photo_builder(pl.photos.first).attributes!) : nil}.compact

        render_json({ unit_listings: unit_listings.collect{|o| o.to_builder().attributes! }, company: company.to_builder().attributes!, properties: company.properties.collect{|o| o.to_builder().attributes! }, property_photos: property_photos  })
      else
        objects, total = page(objects)

        render_json({ plural_object_key() => objects.collect{|o| o.to_builder().attributes! }, total: total  })
      end
    else
      super
    end

  end


  def show
    load_object_for_update()

    # Make sure we return something... if they're asking for an active property
    if @object.nil?
      if Property.for_user(current_user).active.where(id: params[:id]).exists?
        @object = PropertyListing.new
      end
    end

    render_json({ singular_object_key() => @object })
  end

  def load_object_for_update(loading_method = :property_id)
    if loading_method == :hash_id
      @object = PropertyListing.for_user(current_user).where(hash_id: params[:id]).first
    else
      @object = PropertyListing.for_user(current_user).where(property_id: params[:id]).first
    end
  end

  def handle_after_create

    # Move over any unattached photos
    if @object.photos_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.photos_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = PropertyListing.to_s
          f.record_id = @object.id
          f.name = "photos"
          f.save
        end
      end
    end
  end

  def photos
    load_object_for_update(:hash_id)
    render_photos_json()
  end

  def destroy_photos
    load_object_for_update(:hash_id)
    @object.photos.where(id: params[:photo_id]).purge
    render_photos_json()
  end

  def upload_photos
    file_params = params.permit(:id, :photos, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: PropertyListing.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:photos])
      unattached_file_batch.save

      photos = unattached_file_batch.files.collect{|ip| PropertyListing.photo_builder(ip).attributes!}
      render_json({ photos: photos  })
    else
      load_object_for_update(:hash_id)

      if @object.present?
        @object.photos.attach(params.permit(:photos)[:photos])

        if @object.save
          render_photos_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Property Listing not found"]}, false)
      end
    end
  end

  protected

  def object_params
    op = parse_number_param(params.require(:property_listing).permit(PropertyListing.public_fields + [:photos_batch_number]), [:parking_fee]) || {}

    return op
  end

  def render_photos_json
    photos = @object.photos.collect{|ip| PropertyListing.photo_builder(ip).attributes!} if @object.present?
    render_json({ photos: photos  })
  end
end