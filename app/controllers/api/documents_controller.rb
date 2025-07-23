class Api::DocumentsController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:upload]

  def model_class
    Document
  end

  def search
    company = current_user.company
    documents = base_query

    if params[:document_for] == "property"
      documents = base_property_query
    end

    query_docs, total_docs = page(documents)
    docs = query_docs.collect{|doc| Document.to_builder(doc: doc).attributes! }
    docs = docs.sort_by { |doc| doc['created_at'] }.reverse

    render_json({ plural_object_key() =>  docs, total: total_docs })
  end

  def searchExternal
    company = current_user.company
    documents = base_external_documents_query

    if params[:document_for] == "property"
      documents = base_external_property_query
    end


    if params[:status] == "non_executed"
      documents = documents.where.not(status: "executed")
    elsif params[:status].present?
      documents = documents.where(status:  params[:status])
    end

    query, total = page(documents)

    render_json({ plural_object_key() => query.collect{|doc| ExternalDocument.to_builder(doc: doc, current_user: current_user).attributes! }, total: total })
  end

  def upload
    klass_name = load_clas_for_document_type(doc_type: params[:doc_type])
    klass = klass_name.constantize
    @object = klass.for_user(current_user).where(id: params[:id]).first
    docs = []
    if @object.present?
      group_id = nil
      docs_saved = true;
      params[:document].each do |d|
        doc = @object.documents.build(
          load_params_for_document_type(doc_type: params[:doc_type], upload: d, group_id: group_id, group_name: params[:document_name])
        )
        doc.attachment.attach(d)
        if !doc.save!
          render_json({success: false, errors: extract_errors_by_attribute(object)})
        end
        docs << doc
        group_id = group_id || doc.id
      end

      render_json({ success: true, documents: docs.collect{|doc| Document.to_builder(doc: doc).attributes!}})
    else
      render_json({ success: false, errors: ["#{load_clas_for_document_type(doc_type: params[:doc_type])} not found"]})
    end
  end

  def create_document_from_template
    if params[:id].present?
      external_document = ExternalDocument.for_user(current_user).where(id: params[:id]).first

      if external_document.present?
        document = external_document.document

        zoho_api = RenterInsightZohoApi::new
        result = zoho_api.create_document_from_template(
          document: document,
          external_document: external_document,
          recipients: params[:recipients],
          user: current_user,
          document_name: params[:document_name]
        )
        if result[:status] === "success"
          request_id = result[:requests][:request_id]
          document_status = "sent_for_signature" # result[:requests][:request_status]
          last_document_id = result[:requests][:document_ids].last[:document_id]
          document_fields = result[:requests][:document_fields]

          actions = result[:requests][:actions].map{|a|
            {
              action_id: a[:action_id],
              action_type: a[:action_type],
              recipient_email: a[:recipient_email],
              recipient_name: a[:recipient_name],
              fields: document_fields + [
                {
                  field_name: "Signature",
                  field_label: "Signature",
                  field_type_name: 'Signature',
                  document_id: last_document_id
                }
              ]
            }
          }
          ext_doc = document.external_documents.create(
            external_id: request_id,
            status: document_status,
            actions: actions.to_json,
            record_type: 'document',
            property_id: external_document.property_id,
            company_id: external_document.company_id,
            lease_id: external_document.lease_id,
            document_name: params[:document_name]
          )

          ext_doc.reload
          zoho_api = RenterInsightZohoApi::new
          result = zoho_api.update_document(external_document: ext_doc)

          render_json({success: true, message: "Document Created"})
        else
          render_json({success: false, message: "Document Creation Failed"}, false)
        end
      end
    else
      render_json({ success: false, message: "Document not found"}, false)
    end
  end

  def create_document
    if params[:id].present?
      document = Document.for_user(current_user).where(id: params[:id]).first

      if document.present?
        zoho_api = RenterInsightZohoApi::new
        result = zoho_api.create_document(
          document: document,
          recipients: params[:recipients],
          user: current_user,
          document_name: params[:document_name],
          notes: params[:notes] || "",
        )

        if result[:status] === "success"
          request_id = result[:requests][:request_id]
          document_status = result[:requests][:request_status]
          last_document_id = result[:requests][:document_ids].last[:document_id]
          actions = result[:requests][:actions].map{|a|
            {
              action_id: a[:action_id],
              action_type: a[:action_type],
              recipient_email: a[:recipient_email],
              recipient_name: a[:recipient_name],
              fields: [
                {
                  field_name: "Signature",
                  field_label: "Signature",
                  field_type_name: 'Signature',
                  document_id: last_document_id
                }
              ]
            }
          }
          ext_doc = document.external_documents.create(
            external_id: request_id,
            status: document_status,
            actions: actions.to_json,
            record_type: 'document',
            property_id: document.property_id,
            company_id: document.company_id,
            lease_id: document.lease_id,
            document_name: params[:document_name]
          )

          ext_doc.reload
          zoho_api = RenterInsightZohoApi::new
          result = zoho_api.update_document(external_document: ext_doc)
          render_json({success: true, message: "Document Created", external_document: {
            id: ext_doc.id,
            external_id: ext_doc.external_id,
            record_type: ext_doc.record_type,
          }})
        else
          render_json({success: false, message: "Document Creation Failed"}, false)
        end
      else
        render_json({success: false, message: "Document not found"}, false)
      end

    else
      render_json({success: false, message: "Document not found"}, false)
    end
  end

  def create_template
    if params[:id].present?
      document = Document.for_user(current_user).where(id: params[:id]).first

      if document.present?
        zoho_api = RenterInsightZohoApi::new
        document_name = params[:document_name] || document.filename
        result = zoho_api.create_template(document: document, document_name: document_name, user: current_user)
        if result[:status] === "success"
          template_id = result[:templates][:template_id]
          document_status = "created"
          actions = result[:templates][:actions].map{|a|
            {
              action_id: a[:action_id],
              action_type: a[:action_type],
            }
          }
          ext_doc = document.external_documents.create(
            external_id: template_id,
            property_id: document.property_id,
            company_id: document.company_id,
            document_name: document_name,
            lease_id: document.lease_id,
            status: document_status,
            actions: actions.to_json,
            record_type: 'template'
          )

          render_json({success: true, message: "Template Created"})
        else
          render_json({success: false, message: result[:message]}, false)
        end
      else
        render_json({success: false, message: "Document not found"}, false)
      end

    else
      render_json({success: false, message: "Document not found"}, false)
    end
  end

  def get_template
    if params[:id].present?
      zoho_api = RenterInsightZohoApi::new
      result = zoho_api.get_template(template_id: params[:id])

      if result[:status] === "success"
        template = result[:templates]
        actions = result[:templates][:actions]
        render_json({template: result[:templates], success: true, message: "Template loaded"})
      else
        render_json({success: false, message: "Template not found"})
      end
    else
      render_json({success: false, message: "Template not found"})
    end
  end

  def send_document_for_sign
    if params[:id].present?
      external_document = ExternalDocument.for_user(current_user).where(id: params[:id]).first
      zoho_api = RenterInsightZohoApi::new
      result = zoho_api.send_document_for_signature(
        external_document: external_document,
      )

      if result[:status] === "success"
        external_document.update(status: "sent_for_signature")

        render_json({success: true, message: "Document Ready for Signature"})
      else
        render_json({success: false, message: result[:message]}, false)
      end
    end
  end

  def send_document_reminders
    if params[:id].present?
      external_document = ExternalDocument.for_user(current_user).where(id: params[:id]).first
      zoho_api = RenterInsightZohoApi::new
      result = zoho_api.send_document_reminders(
        external_document: external_document,
      )

      if result[:status] === "success"
        render_json({success: true, message: "Document Reminders sent"})
      else
        render_json({success: false, message: result[:message]}, false)
      end
    end
  end

  def get_signing_iframe_details
    render_json({success: false, errors: "Document not found"}) unless params[:id].present?

    external_document = ExternalDocument.for_user(current_user).where(id: params[:id]).first
    render_json({success: false, errors: "Document not found"}) unless external_document.present?

    zoho_api = RenterInsightZohoApi::new
    result = zoho_api.signature_url(external_document: external_document, user: current_user)
    render_json({sign_url: result[:sign_url]})
  end

  def destroy_document
    document = Document.for_user(current_user).where(id: params[:id]).first

    if document.present?
      ActiveRecord::Base.transaction do
        attachment = document.attachment
        attachment.purge
        document.destroy!
      end

      render_json({ success: true })
    else
      render_json({ success: false, message: "Document not found"})
    end
  end

  def destroy_external_document
    document = ExternalDocument.for_user(current_user).where(id: params[:id]).first

    if document.present?
      ActiveRecord::Base.transaction do
        zoho_api = RenterInsightZohoApi::new
        result = zoho_api.delete_zoho_document(external_document: document)
        unless result
          raise "Zoho document not deleted"
        end

        document.destroy!
      end

      render_json({ success: true })
    else
      render_json({ success: false, message: "External Document not found"})
    end
  end

  def load_clas_for_document_type(doc_type:)
    case doc_type
    when "company"
      "Company"
    when "property"
      "Property"
    when "lease_document"
      "Lease"
    else
      raise "Document type not supported!"
    end
  end

  def load_params_for_document_type(doc_type:, upload:, group_id: nil, group_name: nil)
    case doc_type
    when "company"
      {
        document_type: 'document',
        content_type: upload&.content_type&.to_s,
        document_name: upload&.original_filename&.to_s,
        group_id: group_id.present? ? group_id : nil,
        group_name: group_name.present? ? group_name : upload&.original_filename&.to_s,
      }
    when "property"
      {
        document_type: 'document',
        company_id: @object.company_id,
        content_type: upload&.content_type&.to_s,
        document_name: upload&.original_filename&.to_s,
        group_id: group_id.present? ? group_id : nil,
        group_name: group_name.present? ? group_name : upload&.original_filename&.to_s,
      }
    when "lease_document"
      {
        document_type: 'document',
        company_id: @object.company_id,
        property_id: @object.property_id,
        content_type: upload&.content_type&.to_s,
        document_name: upload&.original_filename&.to_s,
        group_id: group_id.present? ? group_id : nil,
        group_name: group_name.present? ? group_name : upload&.original_filename&.to_s,
      }
    else
      raise "Document type not supported!"
    end
  end

  def render_documents_json(doc: )
    {
      id: doc.id,
      filename: doc.document_name,
      content_type: doc.content_type,
      url: Rails.application.routes.url_helpers.url_for(doc),
      document_type: doc.document_type,
      created_at: doc.created_at,
    }
  end

  def base_query()
    documents = Document.where(company_id: current_user&.company&.id)
                       .includes(:property, lease: [:unit, :residents])
                       .order(created_at: :desc)

    if params[:search_text].strip.present?
      search_term = "%#{params[:search_text]}%"
      documents = documents.joins(:property)
                         .joins(lease: :residents)
                         .where("group_name LIKE :term OR document_name LIKE :term OR properties.name LIKE :term OR residents.first_name LIKE :term OR residents.last_name LIKE :term", term: search_term)
                         .distinct
    end

    documents
  end

  def base_external_documents_query()
    documents = ExternalDocument.where(company_id: current_user&.company&.id, record_type: params[:document_type]).includes(:property, lease: [:unit, :residents]).order(created_at: :desc)

    if params[:search_text].strip.present?
      search_term = "%#{params[:search_text]}%"
      documents = documents.joins(:property)
      .joins(lease: :residents)
      .where("document_name LIKE :term OR properties.name LIKE :term OR residents.first_name LIKE :term OR residents.last_name LIKE :term", term: search_term)
      .distinct
    end

    documents
  end

  def base_external_lease_documents_query()
    if current_user.is_company_admin_at_least?
      lease = Lease.find_by(id: params[:id])
    else
      lease = current_user.resident&.leases&.where(id: params[:id])&.first
    end

    return [] unless lease.present?

    documents = ExternalDocument.where(lease_id: lease.id, record_type: 'document').where.not(status: ['draft']).includes(:property, lease: [:unit, :residents]).order(created_at: :desc)

    documents
  end

  def base_lease_query()
    if current_user.is_company_admin_at_least?
      lease = Lease.find_by(id: params[:id])
    else
      lease = current_user.resident&.leases&.where(id: params[:id])&.first
    end

    return [] unless lease.present?
    documents = Document.where(document_type: ["lease_document" ,"move_out_document"], lease_id: lease.id).includes(:property, lease: [:unit, :residents]).order(created_at: :desc)

    documents
  end

  def get_lease_documents
    documents = base_lease_query
    query, total = page(documents)

    external_documents = base_external_lease_documents_query
    query_external, total_external = page(external_documents)

    docs =  query.collect{|doc| Document.to_lease_builder(doc: doc).attributes! }.flatten
    docs_ext = query_external.collect{|doc| ExternalDocument.to_lease_builder(doc: doc, current_user: current_user).attributes! }
    all_docs = docs + docs_ext

    render_json({ plural_object_key() => all_docs, total: total + total_external })
  end

  def base_property_query()
    base_query.where('property_id IS NOT NULL')
  end

  def base_external_property_query()
    base_query.where('external_documents.property_id IS NOT NULL')
  end
end