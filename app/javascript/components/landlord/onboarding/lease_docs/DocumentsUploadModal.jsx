import React, { useState } from "react";
import DocumentsUploadForm from "./DocumentsUploadForm";
import Modal from "../../../shared/Modal";
import { client } from "../../../../app/client";
import FormItem from "../../../shared/FormItem";
import { Field, Form, Formik } from "formik";
import { createTemplateFromDocument } from "./service";
import { useNavigate } from "react-router-dom";

const DocumentsUploadModal = ({
  setModalOpen,
  reloadTable,
  openCreateDocumentForSigning,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadDisabled, setUploadDisabled] = useState(true);
  const [formData, setFormData] = useState({});
  const [documentName, setDocumentName] = useState(null);
  const [baseErrorMessage, setBaseErrorMessage] = useState("");

  const navigate = useNavigate();

  async function uploadDocumentHandler(createDocumentForSigningFromDocument = false) {
    setUploading(true);
    await client
      .post("/api/internal/documents/upload", formData, { forUpload: true })
      .then(
        (response) => {
          const data = JSON.parse(response);
          if (data.success) {

            setUploading(false);
            if (createDocumentForSigningFromDocument) {
              createDocumentHandler(data.documents)
            } else {
              reloadTable();
            }
          } else if (data.errors) {
            setBaseErrorMessage(data.errors);
          }
        },
        () => {
          setUploading(false);
          setBaseErrorMessage(
            "We could not upload your file. Please Try again"
          );
        }
      );
  }

  const saveForLater = async () => {
    const createDocumentForSigningFromDocument = false;
    await uploadDocumentHandler(createDocumentForSigningFromDocument)

    setModalOpen(false);
    navigate("/onboarding/lease_docs");
  }

  const createSigningDocument = async () => {
    const createDocumentForSigningFromDocument = true;
    await uploadDocumentHandler(createDocumentForSigningFromDocument)
  }


  const formChanged = (params) => {
    let fileMissing = true;
    let documentNameMissing = true;
    let fileCount = 0;
    for (const [key, value] of params.entries()) {
      if(key === 'document[]') {
        fileMissing = false;
        fileCount++;
      }
      if(key === 'document_name' && value) {
        documentNameMissing = false;
      }
    }

    let disabled = false;

    if (fileMissing) {
      disabled = true;
    }

    if (documentNameMissing && fileCount > 1) {
      disabled = true;
    }

    setDocumentName(params.get('document_name'));
    setUploadDisabled(disabled);
    setFormData(params);
  }

  // const createTemplateHandler = async () => {
  //   const document = {
  //     ...uploadedDocument,
  //     document_name: documentName,
  //   };
  //   setCreatingTemplate(true);
  //   await createTemplateFromDocument(document, reloadTable);
  //   setCreatingTemplate(false);
  //   setModalStep("upload");
  //   setModalOpen(false);
  //   navigate("/onboarding/lease_docs/templates");
  // };

  const createDocumentHandler = async (uploadedDocuments) => {
    const payload = {
      documents: uploadedDocuments,
      document_name: documentName,
      from_upload: true,
    };
    setModalOpen(false);
    openCreateDocumentForSigning(payload);
    navigate("/onboarding/lease_docs/pending-signature");
  };

  return (
    <>
      <Modal preventClickOutsideToClose closeModal={(isModalOpen) => setModalOpen(false)}>
        <>
          <h2>Upload New Document</h2>
          <DocumentsUploadForm
            baseErrorMessage={baseErrorMessage}
            uploading={uploading}
            formChanged={formChanged}
          ></DocumentsUploadForm>
          <div className="form-nav flex-row flex-space-between">
            <button
              onClick={() => setModalOpen(false)}
              className="btn btn-red"
            >
              <span>Cancel</span>
            </button>
            <div className="form-nav flex-row mt-0">
              { !uploading && (
                <button
                  onClick={() => saveForLater()}
                  className="btn btn-red"
                  type="submit"
                  disabled={uploading || uploadDisabled}
                >
                  <span>{!uploading ? "Upload and Save for Later" : "Uploading..."}</span>
                </button>
              )}
              <button
                onClick={() => createSigningDocument()}
                className="btn btn-red"
                type="submit"
                disabled={uploading || uploadDisabled}
              >
                <span>{!uploading ? "Upload and Create Signing Document" : "Uploading..."}</span>
              </button>
            </div>
          </div>
        </>
      </Modal>
    </>
  );
};

export default DocumentsUploadModal;
