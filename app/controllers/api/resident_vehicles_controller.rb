class Api::ResidentVehiclesController < Api::ApiController

  def model_class
    ResidentVehicle
  end

  def setup_new_object()
    resident = Resident.where(hash_id: params[:resident_vehicle].delete(:resident_id)).first
    ResidentVehicle.new(resident: resident)
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
    params.require(:resident_vehicle).permit(ResidentVehicle.public_fields)
  end

end