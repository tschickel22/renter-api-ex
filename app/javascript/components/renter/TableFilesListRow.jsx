import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DocumentLink from "../landlord/onboarding/lease_docs/DocumentLink";
import insightUtils from "../../app/insightUtils";
import { titleCase } from "../../utils/strings";
import RowMenu from "../shared/RowMenu";
import DocumentLinkIcon from "../landlord/onboarding/lease_docs/DocumentLinkIcon";

const FilesListRow = ({
  document,
}) => {
  // @ts-ignore
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const navigate = useNavigate();

  // function handleSignIframe(external_document) {
  //   navigate(
  //     `/onboarding/lease_docs/${external_document.record_type}/${external_document.id}/sign`
  //   );
  // }

  const showSign = (externalDocument) =>
    ["in_progress", "sent_for_signature"].includes(externalDocument.status) &&
    externalDocument.user_can_sign;


  return (
    <>
      <div className="st-row-wrap">
        <div className="st-row">
          <div className="st-col-28 break-word">{document.property_name}</div>
          <span className="st-col-10 break-word">{document.unit_number}</span>
          <span className="st-col-30 break-word">
            <DocumentLink document={document} />
          </span>
          <span className="st-col-10 break-word">
            {insightUtils.formatDate(document.created_at)}
          </span>
          <span className="st-col-10 break-word">
            {insightUtils.formatDate(document.updated_at)}
          </span>
          <span className="st-col-10 break-word text-capitalized">
            {titleCase(document.status || "Draft")}
          </span>
          <span className="st-nav-col">
            { !showSign(document) && (
              <React.Fragment key={document.external_id}>
                <DocumentLinkIcon document={document} />
              </React.Fragment>
            )}
            {/* {showSign(document) && (
              <RowMenu
                rowMenuOpen={documentMenuOpen}
                setRowMenuOpen={setDocumentMenuOpen}
              >
                <li onClick={() => handleSignIframe(document)}>
                  <i className="fal fa-signature"></i> Sign
                </li>
              </RowMenu>
            )} */}
          </span>
        </div>
      </div>
    </>
  );
};

export default FilesListRow;
