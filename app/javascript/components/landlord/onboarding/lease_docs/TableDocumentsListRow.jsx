import React from "react";
import insightUtils from "../../../../app/insightUtils";
import DocumentLinkIcon from "./DocumentLinkIcon";
import { titleCase } from "../../../../utils/strings";

const DocumentsListRow = ({ document }) => {
  return (
    <>
      <div className="st-row-wrap" key={document.id}>
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
            <span>
              {document.document_name}{" "}
            </span>
          </span>
          <span className="st-col-10 hidden-lg">
            {insightUtils.formatDate(document.created_at)}
          </span>
          <span className="st-col-10 st-col-md-20 break-word">
            {titleCase(document.status)}
          </span>
          <span className="st-nav-col">
            <React.Fragment key={document.external_id}>
              <DocumentLinkIcon document={document} />
            </React.Fragment>
          </span>
        </div>
      </div>
    </>
  );
};

export default DocumentsListRow;
