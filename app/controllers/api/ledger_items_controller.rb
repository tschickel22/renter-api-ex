class Api::LedgerItemsController < Api::ApiController
  include ApplicationHelper

  def model_class
    ResidentLedgerItem
  end

  def primary_key_field
    :hash_id
  end

  def lookup_lease
    load_object_for_update()

    render_json({lease: @object.lease.to_builder("skinny").attributes!}, true)
  end

  def load_object_for_update()
    @object = ResidentLedgerItem.for_user(current_user).where(related_object_type: Charge, hash_id: params[:id]).first
  end

  def destroy
    load_object_for_update()

    @object.force_destroy

    render_successful_update()
  end

  protected

  def handle_after_update
    # Update the accounts
    AccountEntry.where(related_object: @object).each{|ae| ae.force_destroy}
    AccountingService.generate_entry_for_resident_charge_ledger_item(@object)
  end

  def object_params
    cp = parse_number_param(params.require(:ledger_item).permit(LedgerItem.public_fields), [:amount])

    return cp
  end

end