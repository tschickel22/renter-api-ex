import React from 'react';

function ExternalDocumentLink({ document }) {
  return (
    <span className="break-word">{document.document_name}</span>
  );
}

export default ExternalDocumentLink;