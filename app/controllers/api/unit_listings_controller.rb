class Api::UnitListingsController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload_photos]

  def model_class
    UnitListing
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(unit_listings)
    if !params[:search_text].blank?
      unit_listings.joins(:unit, :property).includes(:unit, :property).where(["hash_id like :search_text or unit_listings.name like :search_text or units.unit_number like :search_text or properties.name like :search_text", {search_text: "%#{params[:search_text]}%"}])
    else
      unit_listings
    end
  end

  def search
    unit_listings = perform_search(UnitListing.for_user(current_user))
    unit_listings, total = page(unit_listings)

    if !unit_listings.empty?
      property_listing_hash_id = unit_listings.first.property_listing.hash_id
    end

    render_json({ unit_listings: unit_listings.collect{|o| o.to_builder().attributes! }, total: total, property_listing_hash_id: property_listing_hash_id  })
  end

  def show
    # We will load all listings for this property
    # This allows for quick switching between them all
    unit_listing = UnitListing.where(hash_id: params[:id]).first

    # Grab property listing too
    if unit_listing.present?
      property_listing = PropertyListing.where(property_id: unit_listing.property_id).first
      unit_listings = UnitListing.where(property_id: unit_listing.property_id)

      unit_photos = UnitListingPhotoUnit.where(unit_listing_id: unit_listings.pluck(:id)).collect{|ip| UnitListing.photo_builder(ip).attributes!}
      property_photos = property_listing.photos.collect{|ip| PropertyListing.photo_builder(ip).attributes!} if property_listing.present?
      company = unit_listing.company
    end

    render_json({ unit_listings: unit_listings, company: company, property: property_listing.property.to_builder("full").attributes!, property_listing: property_listing, unit_photos: unit_photos, property_photos: property_photos })
  end

  def create
    # This create method can actually be an update... or a mixture.
    # We receive all of the unit listings for a property here
    # and must determine what to do with them
    @object = Property.for_user(current_user).where(id: params[:property_id]).first

    @object.assign_attributes(bulk_update_object_params(false))

    if @object.save(validate: validate_during_save())

      # Now, try saving with status info...
      @object.assign_attributes(bulk_update_object_params(true))

      if @object.save(validate: validate_during_save())

        handle_after_update()

        render_successful_update()
      else
        render_failed_update()
      end

    else
      render_failed_update()
    end
  end

  def load_object_for_update()
    # We can load unit listing ID by hash_id too
    @object = model_class().where(hash_id: params[:id]).first

    if @object.nil? && current_user.present?
    unit = Unit.for_user(current_user).where(id: params[:id]).first

      @object = model_class().for_user(current_user).where(unit_id: unit.id, property_id: unit.property_id, company_id: unit.property.company_id).first_or_create
      @object.status ||= UnitListing::STATUS_NEW
    end
  end

  def handle_after_create

    # Move over any unattached photos
    if @object.photos_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.photos_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = UnitListingPhoto.to_s
          f.record_id = @object.id
          f.name = "photo"
          f.save
        end
      end
    end
  end

  def handle_after_update
    if !params[:unit_listing][:other_unit_update].blank? && !params[:unit_listing][:other_unit_ids].blank?

      # Special handling for photos
      if params[:unit_listing][:other_unit_update] == "photos"
        params[:unit_listing][:other_unit_ids].split(",").each do | unit_id |

          unit = Unit.for_user(current_user).where(id: unit_id).first
          unit_listing = UnitListing.for_user(current_user).where(unit_id: unit.id, property_id: unit.property_id, company_id: unit.property.company_id).first_or_create

          if !params[:unit_listing][:photo_ids].blank?
            params[:unit_listing][:photo_ids].each do | photo_id |
              unit_listing_photo_unit = UnitListingPhotoUnit.find(photo_id)
              unit_listing.unit_listing_photos << unit_listing_photo_unit.unit_listing_photo if !unit_listing.unit_listing_photos.include?(unit_listing_photo_unit.unit_listing_photo)
            end

            unit_listing.save
          end
        end
      else
        UnitListing.where(unit_id: params[:unit_listing][:other_unit_ids].split(",")).each do | unit_listing |
          params[:unit_listing][:other_unit_update].split(",").each do | field |
            unit_listing[field] = @object[field]
          end
          unit_listing.save
        end
      end
    end
  end

  def photos
    load_object_for_update()
    render_photos_json()
  end

  def destroy_photos
    load_object_for_update()
    params[:photo_ids].each do | photo_id |
      @object.unit_listing_photo_units.where(id: photo_id).first.destroy
    end
    render_photos_json()
  end

  def upload_photos
    file_params = params.permit(:id, :photos, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: UnitListingPhotoUnit.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:photos])
      unattached_file_batch.save

      photos = unattached_file_batch.files.collect{|ip| UnitListing.photo_builder(ip).attributes!}
      render_json({ photos: photos  })
    else
      load_object_for_update()

      if @object.present?
        unit_listing_photo = @object.unit_listing_photos.create({company_id: @object.company_id, property_id: @object.property_id})
        unit_listing_photo.photo.attach(params.permit(:photos)[:photos])

        if @object.save
          render_photos_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["Unit Listing not found"]}, false)
      end
    end
  end

  protected

  def object_params
    op = parse_number_param(params.require(:unit_listing).permit(UnitListing.public_fields + [:photos_batch_number]), [:rent, :security_deposit]) || {}

    return op
  end

  def bulk_update_object_params(include_status = true)
    if params[:unit_listings] && !params[:unit_listings].empty?
      ulp = params[:unit_listings].map do | unit_listing_params |

        if include_status
          p = parse_number_param(unit_listing_params.permit(UnitListing.public_fields + [:photos_batch_number]), [:rent, :security_deposit])
        else
          p = parse_number_param(unit_listing_params.permit(UnitListing.public_fields - [:status] + [:photos_batch_number]), [:rent, :security_deposit])
        end

        # Add some key data
        p[:company_id] = current_user.company_id

        # Make sure the listing doesn't already exist
        if p[:id].nil?
          existing_unit_listing = UnitListing.for_user(current_user).where(unit_id: p[:unit_id]).first
          p[:id] = existing_unit_listing.id if existing_unit_listing.present?
          p[:status] = UnitListing::STATUS_NEW
        end

        p
      end

      {unit_listings_attributes: ulp}
    else
      {}
    end
  end

  def render_photos_json
    photos = @object.unit_listing_photo_units.collect{|ip| UnitListing.photo_builder(ip).attributes!} if @object.present?
    render_json({ photos: photos  })
  end
end