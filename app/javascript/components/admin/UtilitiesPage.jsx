import React, {useEffect, useRef, useState} from 'react';

import {loadEmailTemplate, loadEmailTemplates} from "../../slices/companySlice";
import store from "../../app/store";
import ListPage from "../shared/ListPage";
import Modal from "../shared/Modal";
import {client} from "../../app/client";

const UtilitiesPage = ({}) => {

    const [uploading, setUploading] = useState(false)
    const [fileTypeError, setFileTypeError] = useState("")

    const uploadRef = useRef()
    async function handleFileChange(event) {
        const newFiles = event.target.files

        setFileTypeError("")
        setUploading(true)

        for (let i = 0; i < newFiles.length; i++) {
            if (!newFiles[i].name) return
            if (newFiles[i].size > 25000000) {setFileTypeError("Files must smaller than 25MB"); setUploading(false); return; }

            await handleUpload(newFiles[i])

        }
        setUploading(false)
    }

    async function handleUpload(currentFile) {

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData.append(
            "credit_builder_upload",
            currentFile,
            currentFile.name
        );

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/credit_reporting_activities/upload_property_list", formData, {forUpload: true})
            .then((response) => {
                    const data = JSON.parse(response)

                    if (data.success) {
                        setFileTypeError(data.message)
                        return true;
                    }
                    else if (data.errors) {
                        setFileTypeError(JSON.stringify(data.errors))
                        return false;
                    }

                },
                () => {
                    setFileTypeError("We could not upload your file. Please Try again")
                    return false;
                })
    }

    return (
        <div className="section">
            <h1>Credit Builder - Property List Upload</h1>
            <p className="text-center">When TU returns an updated property list, upload it here to update our database.</p>
            <input type="file" ref={uploadRef} onChange={handleFileChange}/>
            <br/><br/>
            {fileTypeError && <div className="text-error">{fileTypeError}</div>}
            {uploading && <div className="text-green">Uploading...</div>}
        </div>
    )
}

export default UtilitiesPage;

