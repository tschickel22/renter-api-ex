import React from 'react';

function DocumentLink({ document }) {
  return (
    <div>
      {document.docs.length > 1 ? (
        <>
        <span className="break-word">{document.group_name}</span>
        <ul>
          {document.docs.map((doc) => (
            <li className="break-word" key={doc.id}>
              {doc.document_name}
            </li>
          ))}
        </ul>
        </>
      ): (
        <a href={document.url} target="_blank" rel="noopener noreferrer">
          <span className="break-word">{document.group_name}</span>
        </a>
      )}
    </div>
  );
}

export default DocumentLink;