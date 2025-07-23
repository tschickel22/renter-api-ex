import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { getLeaseDocuments } from "../../slices/documentsSlice";
import store from "../../app/store";
import ListPage from "../shared/ListPage";
import FilesListRow from "./TableFilesListRow";

const DocumentsListPage = () => {
  const [documentsCount, setDocumentsCount] = useState(null);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  let params = useParams();
  const leaseId = params.leaseId;

  async function runSearch(text) {
    const results = await store.dispatch(getLeaseDocuments(leaseId)).unwrap();
    const docs = Object.values(results.data.documents.reduce((acc, doc) => {
      const identifier = doc.group_id || doc.id;
      acc[identifier] = acc[identifier] ? {
        ...acc[identifier],
        docs: [...acc[identifier].docs, doc]
      } : {
        ...doc,
        docs: [doc]
      }
      return acc;
    }, {})).sort((a, b) => {
      return new Date(b.docs[0].created_at) - new Date(a.docs[0].created_at);
    });

    setDocumentsCount(docs.length);
    setDocumentsLoaded(true);

    return { total: docs.length, objects: docs };
  }

  function tableColumns() {
    return [
      {
        label: "Property",
        class: "st-col-28",
        sort_by: "property_name",
      },
      {
        label: "Unit",
        class: "st-col-10",
        sort_by: "unit_number",
      },
      {
        label: "Document Name",
        class: "st-col-30",
        sort_by: "filename",
      },
      {
        label: "Created Date",
        class: "st-col-10",
        sort_by: "document_type",
      },
      {
        label: "Last Activity Date",
        class: "st-col-10",
        sort_by: "document_type",
      },
      {
        label: "Status",
        class: "st-col-10",
        sort_by: "document_type",
      },
    ];
  }

  function generateTableRows(document, key) {
    return <FilesListRow key={key} document={document} />;
  }

  return (
    <ListPage
      title="Documents"
      hideSearch={true}
      hideNavCol={true}
      titleImage={<React.Fragment />}
      runSearch={runSearch}
      columns={tableColumns()}
      generateTableRow={generateTableRows}
      noDataMessage="No documents found."
    />
  );
};

export default DocumentsListPage;
