import React, { useState } from "react";
import RowMenu from "../../../shared/RowMenu";
import insightUtils from "../../../../app/insightUtils";
import DocumentLinkIcon from "./DocumentLinkIcon";
import { titleCase } from "../../../../utils/strings";
import { useNavigate } from "react-router-dom";

const TemplatesListRow = ({
  document,
  deleteExternalDocument,
  openCreateDocumentFromTemplateModal,
}) => {
  const [deleteDocumentStarted, setDeleteDocumentStarted] = useState(false);
  const [menuOpenState, setMenuOpenState] = useState(false);
  const navigate = useNavigate();

  async function handleDeleteExternalDocument(externalDocument) {
    if (!deleteDocumentStarted) {
      setDeleteDocumentStarted(true);
      await deleteExternalDocument(externalDocument);
      setDeleteDocumentStarted(false);
    }
  }

  function handleCreateDocumentFromTemplate(externalDocument) {
    openCreateDocumentFromTemplateModal(externalDocument);
  }

  function handleEditIframe(external_document) {
    navigate(`/onboarding/lease_docs/${external_document.record_type}/${external_document.id}/edit`);
  }

  const showDelete = (externalDocument) =>
    !["in_progress", "executed"].includes(externalDocument.status);

  return (
    <>
      <div className="st-row-wrap" key={document.id}>
        <div className="st-row">
          <div className="st-col-28 break-word">
            {document.property_name}
            <div className="visible-md">Unit: {document.unit_number}</div>
          </div>
          <span className="st-col-10 break-word hidden-md">{document.unit_number}</span>
          <span className="st-col-10 break-word">{document.residents}</span>
          <span className="st-col-40 break-word">
            <span>
              {titleCase(document.record_type)} {document.document_name}{" "}
              {!document.has_actions && (
                <React.Fragment>
                  <br/>
                  <i>{"Template needs to be updated to include signatures"}</i>
                </React.Fragment>
              )}
            </span>
          </span>
          <span className="st-col-10 hidden-lg">
            {insightUtils.formatDate(document.created_at)}
          </span>
          <span className="st-nav-col">
            <React.Fragment key={document.external_id}>
              {document.status !== "executed" &&
              document.status !== "in_progress" ? (
                <RowMenu
                  rowMenuOpen={menuOpenState}
                  setRowMenuOpen={setMenuOpenState}
                >
                  <>
                    {document.is_template && (
                      <li onClick={() => handleEditIframe(document)}>
                        <i className="fal fa-pencil"></i> Edit
                      </li>
                    )}
                    {document.has_actions && (
                      <li
                        onClick={() =>
                          handleCreateDocumentFromTemplate(document)
                        }
                      >
                        <i className="fal fa-send"></i> Create Document For
                        Signing
                      </li>
                    )}
                    {showDelete(document) && (
                      <li
                        onClick={() => handleDeleteExternalDocument(document)}
                      >
                        <i className="fal fa-trash"></i> Delete
                      </li>
                    )}
                  </>
                </RowMenu>
              ) : (
                <DocumentLinkIcon document={document} />
              )}
            </React.Fragment>
          </span>
        </div>
      </div>
    </>
  );
};

export default TemplatesListRow;
