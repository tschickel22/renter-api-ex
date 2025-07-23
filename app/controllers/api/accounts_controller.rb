class Api::AccountsController < Api::ApiController

  def model_class
    Account
  end

  def show
    render_json({ singular_object_key() => model_class().for_user(current_user).where(code: params[:id].gsub("-", '.')).first.to_builder("full").attributes! })
  end

  def perform_search(accounts)
    accounts.includes(account_category: :parent_account_category).where(["name like :search_text OR code like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def search
    objects = perform_search(Account.for_user(current_user))
    objects, total = page(objects)

    if params[:include_balances]
      AccountingService.calculate_balances(current_user, objects)
    end

    render_json({ plural_object_key() => objects.collect{|o| o.to_builder().attributes! }, total: total  })
  end

  def handle_before_create
    # Push account_type in from selected category
    if !object_params["account_category_id"].blank?
      account_category = AccountCategory.find(object_params["account_category_id"])
      @object.account_type = account_category.account_type
    end
  end

  def handle_after_update
    if @object.saved_change_to_name?
      bank_account = BankAccount.where(account: @object.id).first

      # Push name change over to Bank Account
      if bank_account.present?
        bank_account.name = @object.name
        bank_account.save
      end
    end
  end

  protected

  def object_params
    params.require(:account).permit(Account::public_fields)
  end
end