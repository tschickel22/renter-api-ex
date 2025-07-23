class Api::JournalEntriesController < Api::ApiController
  include ApplicationHelper
  skip_before_action :verify_authenticity_token, only: [:upload_documents]

  def model_class
    JournalEntry
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(journal_entries)
    journal_entries.where(["hash_id like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def show
    if ["new_journal_entry"].include?(params[:id])

      @object = setup_new_object
      @object.frequency = JournalEntry::FREQUENCY_ONE_TIME
      @object.journal_entry_splits = [JournalEntrySplit.new, JournalEntrySplit.new]

      render_successful_update
    else
      super
    end
  end

  def destroy
    load_object_for_update

    if @object.present? && @object.force_destroy
      render_successful_update()
    else
      render_failed_update
    end
  end

  def handle_after_create

    # Move over any unattached photos
    if @object.documents_batch_number.present?
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: @object.documents_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = JournalEntry.to_s
          f.record_id = @object.id
          f.name = "documents"
          f.save
        end
      end
    end

    AccountingService.generate_entries_for_journal_entry(@object)

    # Was this a bank transaction? If so, update its related object
    if !params[:journal_entry][:bank_transaction_id].blank?
      BankTransaction.for_user(current_user).where(id: params[:journal_entry][:bank_transaction_id]).first&.update(related_object: @object)
    end
  end

  def handle_after_update
    AccountingService.generate_entries_for_journal_entry(@object)
  end


  def documents
    load_object_for_update()
    render_documents_json()
  end

  def destroy_document
    load_object_for_update()
    @object.documents.where(id: params[:document_id]).purge
    render_documents_json()
  end

  def upload_documents
    file_params = params.permit(:id, :document, :batch_number)

    if file_params[:id] == "new"
      unattached_file_batch = UnattachedFileBatch.where(company_id: current_user.company_id, user_id: current_user.id, object_type: JournalEntry.to_s, batch_number: file_params["batch_number"]).first_or_initialize
      unattached_file_batch.files.attach(file_params[:document])
      unattached_file_batch.save

      documents = unattached_file_batch.files.collect{|ip| JournalEntry.document_builder(ip).attributes!}
      render_json({ documents: documents  })
    else
      load_object_for_update()

      if @object.present?
        @object.documents.attach(params.permit(:document)[:document])

        if @object.save
          render_documents_json()
        else
          render_json({errors: extract_errors_by_attribute(@object)}, false)
        end
      else
        render_json({errors: ["JournalEntry not found"]}, false)
      end
    end
  end

  protected

  def object_params
    op = params.require(:journal_entry).permit(JournalEntry.public_fields + [:documents_batch_number] + [journal_entry_splits: [JournalEntrySplit.public_fields]]) || {}

    op[:journal_entry_splits_attributes] = op.delete(:journal_entry_splits).collect do |eas|
      internal_params = parse_number_param(eas, [:debit_amount, :credit_amount])
      internal_params[:updated_at] = Time.now
      internal_params
    end if op[:journal_entry_splits].present?

    check_for_removals(op[:journal_entry_splits_attributes], @object.journal_entry_splits)

    return op
  end

  def render_documents_json
    documents = @object.documents.collect{|ip| JournalEntry.document_builder(ip).attributes!} if @object.present?
    render_json({ documents: documents  })
  end
end