import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import store from "../../../../app/store";
import ListPage from "../../../shared/ListPage";
import { NavLink } from "react-router-dom";
import DocumentsListRow from "./TableDocumentsListRow";
import FilesListRow from "./TableFilesListRow";
import InProgressListRow from "./TableInProgressListRow";
import TemplatesListRow from "./TableTemplatesListRow";
import { useParams } from "react-router-dom";
import RecipientsModal from "./RecipientsModal";
import {
  getDocuments,
  getExternalDocuments,
} from "../../../../slices/documentsSlice";
import DocumentsUploadModal from "./DocumentsUploadModal";
import {
  createTemplateFromDocument,
  deleteDocument,
  deleteExternalDocument,
  sendExternalDocumentReminders,
} from "./service";

const LeaseDocsPageView = () => {
  const perPage = 10;
  const { currentUser } = useSelector((state) => state.user);
  const { settings } = useSelector((state) => state.company);
  const globalSettings = insightUtils.getSettings(settings);
  const [reloadTable, setReloadTable] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [documentsPayload, setDocumentsPayload] = useState(null);
  const [isCreateDocumentModalOpen, setCreateDocumentModalOpen] =
    useState(false);

  let params = useParams();
  const [activeTab, setActiveTab] = useState(params.tab || "company");

  useEffect(() => {
    setActiveTab(params.tab);
    setReloadTable(!reloadTable);
  }, [params.tab]);

  const triggerTableReload = () => {
    setReloadTable(!reloadTable);
  };

  /* Documents search */
  async function runSearch(text) {
    let params = { searchText: text, documentFor: activeTab };
    let handler = getDocuments;
    if (activeTab == "pending-signature") {
      params = {
        ...params,
        documentType: "document",
        status: "non_executed",
      };
      handler = getExternalDocuments;
    } else if (activeTab === "executed") {
      params = {
        ...params,
        documentType: "document",
        status: "executed",
      };
      handler = getExternalDocuments;
    } else if (activeTab == "templates") {
      params = {
        ...params,
        documentType: "template",
      };
      handler = getExternalDocuments;
    }

    const result = await store.dispatch(handler(params)).unwrap();

    // Group documents by group_id or id
    const docs = Object.values(result.data.documents.reduce((acc, doc) => {
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

    return { total: docs.length, objects: docs };
  }

  /* Documents destroy handler */
  const destroyFile = (document) =>
    document.external_id
      ? deleteExternalDocument(document, triggerTableReload)
      : deleteDocument(document, triggerTableReload);


    const sendReminders = (document) => {
      sendExternalDocumentReminders(document, triggerTableReload)
    }

  /* Documents List Render */
  function generateTableRows(document, key) {
    if (activeTab == "templates") {
      return (
        <TemplatesListRow
          key={key}
          document={document}
          deleteExternalDocument={() =>
            deleteExternalDocument(document, triggerTableReload)
          }
          openCreateDocumentFromTemplateModal={
            openCreateDocumentFromTemplateModal
          }
        />
      );
    } else if (activeTab === "pending-signature") {
      return <InProgressListRow
        key={key}
        document={document}
        createTemplate={() =>
          createTemplateFromDocument(document, triggerTableReload)
        }
        openCreateDocumentForSigning={
          openCreteDocumentForSigningFromDocumentModal
        }
        deleteDocument={() => destroyFile(document)}
        sendReminders={sendReminders}
      />;
    } else if (activeTab === "executed") {
      return <DocumentsListRow key={key} document={document} />;
    } else {
      return (
        <FilesListRow
          key={key}
          document={document}
          // createTemplate={() =>
          //   createTemplateFromDocument(document, triggerTableReload)
          // }
          openCreateDocumentForSigning={
            openCreteDocumentForSigningFromDocumentModal
          }
          deleteDocument={() => destroyFile(document)}
        />
      );
    }
  }

  /* Documents columns */
  function tableColumns() {
    if (activeTab == "templates") {
      return [
        {
          label: "Property",
          class: "st-col-28",
          sort_by: "property_name",
        },
        {
          label: "Unit",
          class: "st-col-10 hidden-md",
          sort_by: "unit_number",
        },
        {
          label: "Resident",
          class: "st-col-10",
          sort_by: "residents",
        },
        {
          label: "Document",
          class: "st-col-40",
          sort_by: "filename",
        },
        {
          label: "Created",
          class: "st-col-10 hidden-lg",
          sort_by: "created_at",
        },
      ];
    } else if (activeTab === "executed") {
      return [
        {
          label: "Property",
          class: "st-col-28 hidden-md",
          sort_by: "property_name",
        },
        {
          label: "Unit",
          class: "st-col-10 hidden-md",
          sort_by: "unit_number",
        },
        {
          label: "Resident",
          class: "st-col-10 st-col-md-33",
          sort_by: "residents",
        },
        {
          label: "Document Name",
          class: "st-col-20 st-col-md-33",
          sort_by: "filename",
        },
        {
          label: "Created",
          class: "st-col-10 hidden-lg",
          sort_by: "created_at",
        },
        {
          label: "Status",
          class: "st-col-10 st-col-md-20",
          sort_by: "created_at",
        },
      ];
    } else {
      return [
        {
          label: "Property",
          class: "st-col-28 hidden-md",
          sort_by: "property_name",
        },
        {
          label: "Unit",
          class: "st-col-10 hidden-md",
          sort_by: "unit_number",
        },
        {
          label: "Resident",
          class: "st-col-10 st-col-md-33",
          sort_by: "residents",
        },
        {
          label: "Document Name",
          class: "st-col-20 st-col-md-33",
          sort_by: "filename",
        },
        {
          label: "Created",
          class: "st-col-10 hidden-lg",
          sort_by: "document_type",
        },
        {
          label: "Last Activity",
          class: "st-col-10 hidden-md",
          sort_by: "document_type",
        },
        {
          label: "Status",
          class: "st-col-10 st-col-md-20",
          sort_by: "document_type",
        },
      ];
    }
  }

  /* Upload Modal */
  async function openCreateDocumentFromTemplateModal(externalDocument) {
    setDocumentsPayload(externalDocument);
    setCreateDocumentModalOpen(true);
  }

  /* Recipients Modal */
  async function openCreteDocumentForSigningFromDocumentModal(payload) {
    setDocumentsPayload(payload);
    setCreateDocumentModalOpen(true);
  }

  return (
    <>
      {globalSettings && (
        <>
          <div className="no-max-width">
            <ListPage
              titleImage={<React.Fragment />}
              title="Documents"
              nav={
                <div className="horiz-nav">
                  <div></div>
                  <ul className="horiz-nav-list">
                    <li className="hn-item">
                      <NavLink
                        to={insightRoutes.onboardingLeaseDocs()}
                        end
                        className="hn-item"
                      >
                        Uploaded Files
                      </NavLink>
                    </li>
                    <li className="hn-item">
                      <NavLink
                        to={insightRoutes.onboardingLeaseDocs("pending-signature")}
                        end
                        className="hn-item"
                      >
                        Pending Signature
                      </NavLink>
                    </li>
                    <li className="hn-item">
                      <NavLink
                        to={insightRoutes.onboardingLeaseDocs("executed")}
                        end
                        className="hn-item"
                      >
                        Executed
                      </NavLink>
                    </li>
                    {/* <li className="hn-item">
                      <NavLink
                        to={insightRoutes.onboardingLeaseDocs("templates")}
                        end
                        className="hn-item"
                      >
                        Templates
                      </NavLink>
                    </li> */}
                  </ul>
                  <div></div>
                </div>
              }
              runSearch={runSearch}
              defaultSortBy="sent_at"
              defaultSortDir="desc"
              addButton={
                currentUser.lease_docs_view ? (
                  <div
                    onClick={() => setModalOpen(true)}
                    className="btn btn-red"
                  >
                    <span>
                      Upload File <i className="fas fa-plus"></i>
                    </span>
                  </div>
                ) : null
              }
              columns={tableColumns()}
              generateTableRow={generateTableRows}
              reloadWhenChanges={reloadTable}
              noDataMessage="No documents found."
              numberPerPage={perPage}
            />

            {isModalOpen && (
              <>
                <DocumentsUploadModal
                  setModalOpen={setModalOpen}
                  reloadTable={() => setReloadTable(!reloadTable)}
                  openCreateDocumentForSigning={
                    openCreteDocumentForSigningFromDocumentModal
                  }
                ></DocumentsUploadModal>
              </>
            )}
            {isCreateDocumentModalOpen && (
              <>
                <RecipientsModal
                  documentPayload={documentsPayload}
                  reloadTable={() => setReloadTable(!reloadTable)}
                  setModalOpen={setCreateDocumentModalOpen}
                ></RecipientsModal>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default LeaseDocsPageView;
