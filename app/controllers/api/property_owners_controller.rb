class Api::PropertyOwnersController < Api::ApiController

  def model_class
    PropertyOwner
  end

  def perform_search(property_owners)
    property_owners.includes(property_ownerships: :property).where(["name like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def destroy
    load_object_for_update()

    # Can we destroy this?
    if @object.properties.empty?
      @object.destroy
      render_json({}, true)
    else
      property_names = @object.properties.collect{|p| p.name}.join(", ")
      render_json({errors: {base: "Cannot delete this owner. This owner has assigned properties (#{property_names}). Update the assignments and try again."}}, false)
    end

  end

  protected

  def object_params
    params.require(:property_owner).permit(PropertyOwner.public_fields())
  end
end