import React, { useState } from "react";
import RowMenu from "../../../shared/RowMenu";
import { useSelector } from "react-redux";
import insightUtils from "../../../../app/insightUtils";
import ExternalDocumentLink from "./ExternalDocumentLink";
import { titleCase } from "../../../../utils/strings";
import { useNavigate } from "react-router-dom";

const InProgressListRow = ({
  document,
  createTemplate,
  openCreateDocumentForSigning,
  deleteDocument,
  sendReminders,
}) => {
  // @ts-ignore
  const { currentUser } = useSelector((state) => state.user);
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const [createTemplateStarted, setCreateTemplateStarted] = useState(false);
  const [deleteDocumentStarted, setDeleteDocumentStarted] = useState(false);
  const [sendReminderStarted, setSendndReminderStarted] = useState(false);
  const navigate = useNavigate();

  async function handleCreateTemplateFromDocument(document) {
    if (!createTemplateStarted) {
      setCreateTemplateStarted(true);
      await createTemplate(document);
      setCreateTemplateStarted(false);
      setDocumentMenuOpen(false);
    }
  }

  function handleCreateDocumentForSigningFromDocument(document) {
    openCreateDocumentForSigning(document);
    setDocumentMenuOpen(false);
  }

  async function handleDeleteDocument(document) {
    if (!deleteDocumentStarted) {
      setDeleteDocumentStarted(true);
      await deleteDocument(document);
      setDeleteDocumentStarted(false);
      setDocumentMenuOpen(false);
    }
  }

  async function handleSendReminder(document) {
    if (!sendReminderStarted) {
      setSendndReminderStarted(true);
      await sendReminders(document);
      setSendndReminderStarted(false);
      setDocumentMenuOpen(false);
    }
  }

  // function handleSignIframe(external_document) {
  //   navigate(
  //     `/onboarding/lease_docs/${external_document.record_type}/${external_document.id}/sign`
  //   );
  // }

  function handleEditIframe(external_document) {
    navigate(
      `/onboarding/lease_docs/${external_document.record_type}/${external_document.id}/edit`
    );
  }

  const showReminder = (externalDocument) =>
    ["in_progress", "sent_for_signature"].includes(externalDocument.status)

  const showDelete = (externalDocument) =>
    ["draft"].includes(externalDocument.status);

  const showDeleteAndRecall = (externalDocument) =>
    ["in_progress", "sent_for_signature"].includes(externalDocument.status);

  const showEdit = (externalDocument) =>
    !!externalDocument.external_id &&
    !["in_progress", "sent_for_signature"].includes(externalDocument.status);

  return (
    <>
      <div className="st-row-wrap">
        <div className="st-row">
          <div className="st-col-28 hidden-md break-word">
            {document.property_name}
          </div>
          <span className="st-col-10 break-word hidden-md">{document.unit_number}</span>
          <span className="st-col-10 break-word st-col-md-33">
            {document.residents}
            <div className="visible-md">{document.property_name}
              {document.unit_number && <>
                <br/>Unit: {document.unit_number}
              </>}
            </div>
          </span>
          <span className="st-col-20 st-col-md-33 break-word">
            <ExternalDocumentLink document={document} />
          </span>
          <span className="st-col-10 hidden-lg">
            {insightUtils.formatDate(document.created_at)}
          </span>
          <span className="st-col-10 hidden-md">
            {insightUtils.formatDate(document.updated_at)}
          </span>
          <span className="st-col-10 st-col-md-20 break-word text-capitalized">
            {titleCase(document.status || "Draft")}
          </span>
          <span className="st-nav-col">
            {currentUser.lease_docs_delete && (
              <RowMenu
                rowMenuOpen={documentMenuOpen}
                setRowMenuOpen={setDocumentMenuOpen}
              >
                <>
                  {/* {document.can_be_template && (
                    <li
                      onClick={() => handleCreateTemplateFromDocument(document)}
                    >
                      <i className="fal fa-pencil"></i>{" "}
                      {createTemplateStarted
                        ? "Creating Template..."
                        : "Create Template"}
                    </li>
                  )} */}
                  {showEdit(document) && (
                    <>
                      <li onClick={() => handleEditIframe(document)}>
                        <i className="fal fa-send"></i> Edit
                      </li>
                    </>
                  )}
                  {showReminder(document) && (
                    <li onClick={() => handleSendReminder(document)}>
                      <i className="fal fa-send"></i> Send Reminder
                    </li>
                  )}
                  {showDelete(document) && (
                    <li
                      aria-disabled={deleteDocumentStarted}
                      onClick={() => handleDeleteDocument(document)}
                    >
                      <i className="fal fa-trash"></i>{" "}
                      {deleteDocumentStarted ? "Deleting..." : "Delete"}
                    </li>
                  )}
                  {showDeleteAndRecall(document) && (
                    <li
                      aria-disabled={deleteDocumentStarted}
                      onClick={() => handleDeleteDocument(document)}
                    >
                      <i className="fal fa-trash"></i>{" "}
                      {deleteDocumentStarted ? "Deleting..." : "Delete and Recall"}
                    </li>
                  )}
                </>
              </RowMenu>
            )}
          </span>
        </div>
      </div>
    </>
  );
};

export default InProgressListRow;
