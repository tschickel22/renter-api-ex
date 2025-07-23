import React, { useEffect, useState } from "react";
import Modal from "../../../shared/Modal";
import RecipientsForm from "./RecipientsForm";
import TemplateUpdater from "./TemplateLoader";
import {
  createDocumentFromDocument,
  createDocumentFromTemplate,
} from "./service";
import { useNavigate } from "react-router-dom";

const RecipientsModal = ({ documentPayload, setModalOpen, reloadTable }) => {
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [baseErrorMessage, setBaseErrorMessage] = useState("");
  const [formIsValid, setFormIsValid] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: documentPayload.documents[0].property_id ?? "",
    companyId: "",
    leaseId: documentPayload.documents[0].lease_id ?? "",
    recipients: [],
    documentName: documentPayload.documents[0].group_name,
    notes: "",
  });

  const navigate = useNavigate();

  const createDocumentHandler = async () => {
    console.log("formData", formData);
    setCreatingDocument(true);
    let result = null;
    result = await createDocumentFromDocument(
      documentPayload,
      formData,
      reloadTable
    );

    setCreatingDocument(false);

    if (result.data.success) {
      const { external_document } = result.data;
      setModalOpen(false);
      navigate(
        `/onboarding/lease_docs/${external_document.record_type}/${external_document.id}/edit`
      );
    } else {
      setBaseErrorMessage(
        "We could not create your document. Please Try again"
      );
    }
  };

  return (
    <Modal preventClickOutsideToClose closeModal={(isModalOpen) => setModalOpen(false)}>
      <h2>Select recipients for document</h2>
      <RecipientsForm
        documentPayload={documentPayload}
        formData={formData}
        setFormData={setFormData}
        setFormIsValid={setFormIsValid}
        baseErrorMessage={baseErrorMessage}
      ></RecipientsForm>
      <div className="form-nav flex-row flex-space-between">
        <button onClick={() => setModalOpen(false)} className="btn btn-red">
          <span>Cancel</span>
        </button>
        <button
          onClick={createDocumentHandler}
          className="btn btn-red"
          type="submit"
          disabled={creatingDocument || !formIsValid}
        >
          <span>{!creatingDocument ? 'Create' : "Saving..."}</span>
        </button>
      </div>
    </Modal>
  );
};

export default RecipientsModal;
