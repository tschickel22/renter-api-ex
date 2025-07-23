import React, {useState, useEffect, useRef} from 'react';


import {getVendorInsuranceDeclarations} from "../../../slices/vendorSlice";

import DragAndDrop from "../../shared/DragAndDrop";
import {client} from "../../../app/client";
import DocumentListView from "../../landlord/leases/DocumentListView";
import store from "../../../app/store";


const VendorInsuranceDeclarationsView = ({vendorInsurance, readOnly, declarationsBatchNumber}) => {
    const uploadRef = useRef()

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [errorFiles, setErrorFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [fileTypeError, setFileTypeError] = useState("")

    useEffect(async() => {
        if (vendorInsurance.id) {
            // Load existing attachments
            const results = await store.dispatch(getVendorInsuranceDeclarations({vendorInsuranceId: vendorInsurance.id})).unwrap()

            if (results.data.declarations) {
                setUploadedFiles(results.data.declarations)
            }
        }
    }, []);

    function handleFileChange(event) {
        handleDrop(event.target.files)
    }

    async function handleDrop(newFiles) {
        setFileTypeError("")
        setUploading(true)
        let errorFileList = Array.from(errorFiles)

        for (let i = 0; i < newFiles.length; i++) {
            if (!newFiles[i].name) return
            if (newFiles[i].size > 25000000) {setFileTypeError("Files must smaller than 25MB"); setUploading(false); return; }

            if (await handleUpload(newFiles[i])) {
                // Nothing to do
            }
            else {
                errorFileList.push(newFiles[i].name)
            }

        }

        setErrorFiles(errorFileList)
        setUploading(false)
    }

    async function handleUpload(currentFile) {

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData.append(
            "declaration",
            currentFile,
            currentFile.name
        );

        formData.append('batch_number', declarationsBatchNumber)

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/vendor_insurances/" + (vendorInsurance.id || "new") + "/upload_declarations", formData, {forUpload: true})
            .then((response) => {
                    const data = JSON.parse(response)

                    if (data.success) {
                        if (data.declarations) {
                            setUploadedFiles(data.declarations)
                        }
                        return true;
                    }
                    else if (data.errors) {
                        console.log(data.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your file. Please Try again")
                    return false;
                })
    }

    async function handleDelete(e, declaration) {
        e.stopPropagation();

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData["declaration_id"] = declaration.id
        formData["batch_number"] = declarationsBatchNumber

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/vendor_insurances/" + (vendorInsurance.id || "new") + "/destroy_declaration", formData)
            .then((response) => {
                    if (response.success) {
                        if (response.declarations) {
                            setUploadedFiles(response.declarations)
                        }
                        return true;
                    }
                    else if (response.errors) {
                        console.log(response.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your file. Please Try again")
                    return false;
                })
    }

    return (
        <>
            {vendorInsurance &&
            <>
                <h3>Upload Policy Declarations Page</h3>
                {!readOnly &&
                    <DragAndDrop handleDrop={handleDrop}>
                        <input type="file" ref={uploadRef} onChange={handleFileChange} style={{display: "none"}} multiple={true} />
                        <div style={{backgroundColor: "rgba(196, 196, 196, 0.2)", padding: "20px"}} onClick={() => uploadRef.current.click()}>
                            <div className="text-center" style={{color: "#838383"}}>
                                Drop files here or Upload<br/>
                                {uploadedFiles.length == 0 && <>Files must be no larger than 25MB in size</>}
                                {fileTypeError && <div className="text-error">{fileTypeError}</div>}
                                {uploading && <div className="text-green">Uploading...</div>}

                                {errorFiles.length > 0 && <><br/><br/>We could not upload these files:</>}
                                {errorFiles.map((file, i) =>
                                    <div key={i}>{file}</div>
                                )}
                            </div>
                        </div>
                    </DragAndDrop>
                }

                <DocumentListView uploadedFiles={uploadedFiles} handleDelete={handleDelete} />
            </>
            }
        </>
    )}

export default VendorInsuranceDeclarationsView;

