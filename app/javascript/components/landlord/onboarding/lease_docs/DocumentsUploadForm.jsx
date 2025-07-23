import React, { useEffect, useRef, useState } from "react";
import { Field, Form, Formik } from "formik";
import FormItem from "../../../shared/FormItem";
import { useSelector } from "react-redux";
import BasicDropdown from "../../../shared/BasicDropdown";
import DragAndDrop from "../../../shared/DragAndDrop";
import DocumentListView from "./DocumentsListView";
import { loadLeasesForDocuments } from "../../../../slices/leaseSlice";
import store from "../../../../app/store";
import insightUtils from "../../../../app/insightUtils";

const DocumentsUploadForm = ({
  baseErrorMessage,
  uploading,
  formChanged
}) => {
  const uploadRef = useRef();
  const { constants, currentCompany, properties } = useSelector((state) => state.company);

  const [fileTypeError, setFileTypeError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [propertyId, setPropertyId] = useState(null);
  const [leaseId, setLeaseId] = useState(null);
  const [currentLeases, setCurrentLeases] = useState([]);
  const currentProperties = _processProperties(properties);
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    updateForm();
  }, [propertyId, leaseId, uploadedFiles]);

  function handleFileChange(event) {
    handleDrop(event.target.files);
  }

  function handleDrop(newFiles) {
    setFileTypeError("");

    for (let i = 0; i < newFiles.length; i++) {
      if (!newFiles[i].name) return;
      if (newFiles[i].size > 25000000) {
        setFileTypeError("Files must smaller than 25MB");
        return;
      }
    }
    const existingFileNames = uploadedFiles.map((f) => f.name);
    const newUploadedFiles = uploadedFiles.concat(Array.from(newFiles).filter((f) => !existingFileNames.includes(f.name)).map((f) => {
      f["id"] = Math.random();
      return f;
    }));

    setUploadedFiles(newUploadedFiles);
  }

  function handleDelete(e, file) {
    e.stopPropagation();
    const oldFiles = uploadedFiles;
    const newFiles = oldFiles.filter((f) => f.id !== file.id);
    setUploadedFiles(newFiles);
  }

  function updateForm() {
    let formData = new FormData();
    let mainRecordId = currentCompany.id;
    let doc_type = "company";

    if (propertyId) {
      doc_type = "property";
      mainRecordId = propertyId;
    }

    if (leaseId) {
      doc_type = "lease_document";
      mainRecordId = leaseId;
    }

    formData.append("id", mainRecordId);
    formData.append("doc_type", doc_type);
    formData.append("document_name", documentName);

    if (uploadedFiles && uploadedFiles.length) {
      uploadedFiles.forEach((f) => {
        formData.append("document[]", f, f.name);
      });
    }
    formChanged(formData)
  }

  const updateDocumentName = (val) => {
    setDocumentName(val);
    updateForm()
  };

  async function handlePropertySelected(event) {
    const selectedValue = event.target.value;
    setPropertyId(selectedValue);
    setCurrentLeases([]);
    setLeaseId(null);
    if (selectedValue) {
      const results = await store
        // @ts-ignore
        .dispatch(loadLeasesForDocuments({ propertyId: selectedValue }))
      .unwrap();
      setCurrentLeases(_processLeaseResponse(results.data.leases));
    }
  }

  function handleLeaseSelected(event) {
    const selectedValue = event.target.value;
    setLeaseId(selectedValue);
  }

  function _processLeaseResponse(leases = []) {
    return leases.map((l) => ({ id: l.id, name: `${l.unit.full_address} - ${
      l.primary_resident.resident.name
    } - ${insightUtils.getLabel(l.status, constants.lease_statuses)}`, }));
  }

  function _processProperties(properties = []) {
    return properties.map((p) => ({ id: p.id, name: p.name }));
  }

  return (
    <>
      <div className="section">
        {baseErrorMessage && (
          <div className="text-error">{baseErrorMessage}</div>
        )}

        <Formik
          initialValues={{
            propertyId: "",
            file: null,
            companyId: currentCompany.id,
            leaseId: "",
          }}
          onSubmit={updateForm}
        >
          <Form>
            <div className="add-property-wrap">
              <div className="form-row">
                <div className="st-col-50 st-col-md-100">
                  <FormItem
                    optional={uploadedFiles.length < 2}
                    label="Document Name"
                    name="document_name"
                    formItemClass="form-item-100"
                  >
                    <Field
                      type="text"
                      name="document_name"
                      className="form-input form-input-white"
                      onChange={(e) =>
                        updateDocumentName(e.currentTarget.value)
                      }
                      onBlur={(e) =>
                        updateDocumentName(e.currentTarget.value)
                      }
                    />
                  </FormItem>
                </div>
                <div className="st-col-50 st-col-md-100">
                  <FormItem
                    optional
                    label="Property"
                    name="propertyId"
                    formItemClass="form-item-100"
                  >
                    <BasicDropdown
                      blankText="No property"
                      name="propertyId"
                      onChange={(e) => {
                        handlePropertySelected(e);
                      }}
                      options={currentProperties}
                      extraClass="form-select-wide"
                    />
                  </FormItem>
                  {currentLeases.length > 0 && (
                    <>
                      <FormItem
                        optional
                        label="Lease"
                        name="leaseId"
                        formItemClass="form-item-100"
                      >
                        <BasicDropdown
                          blankText="No Lease"
                          name="leaseId"
                          onChange={(e) => {
                            handleLeaseSelected(e);
                          }}
                          options={currentLeases}
                          extraClass="form-select-wide"
                        />
                      </FormItem>
                    </>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="st-col-50 st-col-md-100">
                  <FormItem
                    label="Files"
                    name="file"
                    formItemClass="form-item-100"
                  >
                    <DragAndDrop handleDrop={handleDrop}>
                      <input
                        type="file"
                        ref={uploadRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        multiple={true}
                      />
                      <div
                        style={{
                          backgroundColor: "rgba(196, 196, 196, 0.2)",
                          padding: "20px",
                        }}
                        onClick={() => uploadRef.current.click()}
                      >
                        <div
                          className="text-center"
                          style={{ color: "#838383" }}
                        >
                          Drop file here or Upload
                          <br />
                          {uploadedFiles.length == 0 && (
                            <>File must be no larger than 25MB in size</>
                          )}
                          {fileTypeError && (
                            <div className="text-error">{fileTypeError}</div>
                          )}
                          {uploading && (
                            <div className="text-green">Uploading...</div>
                          )}
                        </div>
                      </div>
                    </DragAndDrop>

                    <DocumentListView
                      uploadedFiles={uploadedFiles}
                      handleDelete={handleDelete}
                      hideLabel={true}
                    />
                  </FormItem>
                </div>
              </div>
            </div>
          </Form>
        </Formik>
      </div>
    </>
  );
};

export default DocumentsUploadForm;
