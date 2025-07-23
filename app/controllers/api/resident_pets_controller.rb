class Api::ResidentPetsController < Api::ApiController

  def model_class
    ResidentPet
  end

  def setup_new_object()
    resident = Resident.where(hash_id: params[:resident_pet].delete(:resident_id)).first
    ResidentPet.new(resident: resident)
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.destroy
      render_successful_update()
    else
      render_failed_update()
    end
  end

  protected

  def object_params
    params.require(:resident_pet).permit(ResidentPet.public_fields)
  end

end