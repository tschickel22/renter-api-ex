import React from "react";

function DocumentLinkIcon({ document }) {
  return (
    <a href={document.url} target="_blank" rel="noopener noreferrer">
      <i className="far fa-file-pdf btn-st-nav"></i>
    </a>
  );
}

export default DocumentLinkIcon;
