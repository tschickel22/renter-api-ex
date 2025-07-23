import React, {useEffect, useRef, useState} from 'react';
import {Field} from "formik";
import FormItem from "../../shared/FormItem";
import DragAndDrop from "../../shared/DragAndDrop";
import {client} from "../../../app/client";
import insightUtils from "../../../app/insightUtils";

const ResidentIncomeForm = ({leaseResident, currentSettings}) => {
    const uploadRef = useRef()

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [errorFiles, setErrorFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [fileTypeError, setFileTypeError] = useState("")

    useEffect(() => {

      // Load existing attachments
        client.get("/api/internal/residents/" + leaseResident.resident.hash_id + "/income_proofs")
            .then((response) => {

                if (response.income_proofs) {
                    setUploadedFiles(response.income_proofs)
                }
            })

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
            if (newFiles[i].type.indexOf("image") != 0 && newFiles[i].type.indexOf("application/pdf") != 0) {setFileTypeError("Files must be in pdf, jpg, gif, or png format"); setUploading(false); return; }
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
            "income_proof",
            currentFile,
            currentFile.name
        );

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/residents/" + leaseResident.resident.hash_id + "/upload_income_proofs", formData, {forUpload: true})
            .then((response) => {
                    const data = JSON.parse(response)

                    if (data.success) {
                        if (data.income_proofs) {
                            setUploadedFiles(data.income_proofs)
                        }
                        return true;
                    }
                    else if (data.errors) {
                        console.log(data.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not delete your photo. Please Try again")
                    return false;
                })
    }

    async function handleDelete(e, incomeProof) {
        e.stopPropagation();

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData["income_proof_id"] = incomeProof.id

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/residents/" + leaseResident.resident.hash_id + "/destroy_income_proof", formData)
            .then((response) => {
                    if (response.success) {
                        if (response.income_proofs) {
                            setUploadedFiles(response.income_proofs)
                        }
                        return true;
                    }
                    else if (response.errors) {
                        console.log(response.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your photo. Please Try again")
                    return false;
                })
    }

    return (
        <>
            <h3>Income</h3>
            <p>Enter your gross income (before taxes).  Include all sources such as wages, tips, social security, government subsidies and vouchers.  If your income is flexible, enter an average annual amount.  If you are applying with others, enter only your own income.</p>

            <div className="form-row">
                <div className="form-item form-item-25">
                    <FormItem label="Annual Income"  name={"lease_resident.resident.income"} mask={insightUtils.currencyMask()} optional={currentSettings.application_include_income == "optional"} />
                    <FormItem label="Comments" name={"lease_resident.resident.income_notes"} optional={true}>
                        <Field component="textarea" rows={4} name={"lease_resident.resident.income_notes"} className="form-input form-input-white" placeholder=""/>
                    </FormItem>
                </div>
                <div className="form-item form-item-75">
                    <label>Upload Proof of Income (Optional)</label>
                    <DragAndDrop handleDrop={handleDrop}>
                        <input type="file" ref={uploadRef} onChange={handleFileChange} style={{display: "none"}} multiple={true} />
                        <div style={{backgroundColor: "rgba(196, 76, 61, 0.2)", padding: "20px"}} onClick={() => uploadRef.current.click()}>
                            <div className="text-center" style={{color: "#838383"}}>
                                Drop files here or Upload<br/>
                                {uploadedFiles.length == 0 && <>Files must be in pdf, jpg, gif, or png format, and no larger than 25MB in size</>}
                                {fileTypeError && <div className="text-error">{fileTypeError}</div>}
                                {uploading && <div className="text-green">Uploading...</div>}
                                {uploadedFiles.length > 0 && <>
                                    <br/>Files Uploaded:
                                    <table style={{margin: "0 auto"}}>
                                        <tbody>
                                            {uploadedFiles.map((file) =>
                                                <tr key={file.id}><td align="left">{file.filename}</td><td><a onClick={(e) => handleDelete(e, file)}>&nbsp;&nbsp;&nbsp;<i className={"fal fa-trash"}></i></a></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>}

                                {errorFiles.length > 0 && <><br/><br/>We could not upload these files:</>}
                                {errorFiles.map((file, i) =>
                                    <div key={i}>{file}</div>
                                )}
                            </div>
                        </div>

                    </DragAndDrop>
                </div>
            </div>

        </>

    )}

export default ResidentIncomeForm;

