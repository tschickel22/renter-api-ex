import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { getLeaseDocuments } from "../../../slices/documentsSlice";
import store from "../../../app/store";
import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";

const LeaseDocumentsBlock = ({ lease }) => {
  const [documentsCount, setDocumentsCount] = useState(null);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  async function runSearch(text) {
    const results = await store.dispatch(getLeaseDocuments(lease.id)).unwrap();
    setDocumentsCount(results.data.total);
    setDocumentsLoaded(true);

    return { total: 0, objects: results.data.documents.slice(0, 3) };
  }

  function generateTableRow(leaseDocument, key) {
    return (
      leaseDocument.document_type === "document" && (
        <div key={key} style={{ marginBottom: "6px", overflow: "hidden" }}>
          <div>
            {leaseDocument.document_name}{" "}
            {leaseDocument.url && (
              <a href={leaseDocument.url} target="_blank">
                View
              </a>
            )}
          </div>
        </div>
      )
    );
  }

  return (
    <div className="flex-grid-item">
      <h3>Documents</h3>
      {!documentsLoaded || documentsCount > 0 ? (
        <ListPage
          title=""
          hideSearch={true}
          hideNavCol={true}
          titleImage={<React.Fragment />}
          runSearch={runSearch}
          generateTableRow={generateTableRow}
        />
      ) : (
        <div className="flex-line-blockwrap">
          <p>You Have No Documents</p>
        </div>
      )}

      <div className="spacer"></div>
      <NavLink
        to={insightRoutes.renterLeaseDocumentsShow(lease.id)}
        className="btn btn-bottom btn-red"
      >
        <span>View Documents</span>
      </NavLink>
    </div>
  );
};

export default LeaseDocumentsBlock;
