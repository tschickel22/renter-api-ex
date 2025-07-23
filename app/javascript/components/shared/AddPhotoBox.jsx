import React, {useEffect, useRef, useState} from 'react';
import {client} from "../../app/client";
import DragAndDrop from "./DragAndDrop";
import Modal from "./Modal";
import insightUtils from "../../app/insightUtils";

const AddPhotoBox = ({apiPath, batchNumber, header, allowMultiSelect, buildMultiSelectUI, name}) => {

    const uploadRef = useRef()
    const fieldName = name || "photos"

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [errorFiles, setErrorFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [fileTypeError, setFileTypeError] = useState("")
    const [currentPhoto, setCurrentPhoto] = useState(null)
    const [selectedPhotos, setSelectedPhotos] = useState([])

    useEffect(() => {

        // Load existing attachments
        client.get(apiPath + "/" + fieldName)
            .then((response) => {

                if (response[fieldName]) {
                    setUploadedFiles(insightUtils.ensureArray(response[fieldName]))
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
            if (newFiles[i].type.indexOf("image") != 0) {setFileTypeError("Photos must be in jpg, gif, or png format"); setUploading(false); return; }
            if (newFiles[i].size > 25000000) {setFileTypeError("Photos must smaller than 25MB"); setUploading(false); return; }

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
            fieldName,
            currentFile,
            currentFile.name
        );

        formData.append('batch_number', batchNumber)

        // Request made to the backend api
        // Send formData object
        return client.post(apiPath + "/upload_" + fieldName, formData, {forUpload: true})
            .then((response) => {
                    const data = JSON.parse(response)

                    if (data.success) {
                        if (data[fieldName]) {
                            setUploadedFiles(insightUtils.ensureArray(data[fieldName]))
                        }
                        return true;
                    }
                    else if (data.errors) {
                        console.log(data.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your photo. Please Try again")
                    return false;
                })
    }

    function handleSelectPhoto(photo) {
        if (allowMultiSelect) {
            let newSelectedPhotos = Array.from(selectedPhotos)

            // If the photo isn't yet selected, add it to selected photos
            if (newSelectedPhotos.indexOf(photo) < 0) {
                newSelectedPhotos.push(photo)
            }
            else {
                newSelectedPhotos.splice(newSelectedPhotos.indexOf(photo), 1)
            }

            setSelectedPhotos(newSelectedPhotos)
        }
        else {
            setCurrentPhoto(photo)
        }
    }

    async function handleDelete(e, photo) {
        e.stopPropagation();

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData["photo_id"] = photo.id

        // Request made to the backend api
        // Send formData object
        return client.post(apiPath + "/destroy_" + fieldName, formData)
            .then((response) => {
                    if (response.success) {
                        setUploadedFiles(insightUtils.ensureArray(response[fieldName]))
                        setCurrentPhoto(null)
                        setSelectedPhotos([])

                        return true;
                    }
                    else if (response.errors) {
                        console.log(response.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not delete your photo. Please Try again")
                    return false;
                })
    }

    return (
        <>
            <div className="form-row form-stacked">
                
                {header ?
                    header
                    :
                    <>
                        <label>Add Photo</label>
                        <div className="smallspacer"></div>
                    </>
                }

                <DragAndDrop handleDrop={handleDrop}>
                    <input type="file" ref={uploadRef} onChange={handleFileChange} style={{display: "none"}} multiple={true} />
                    <div className="btn-add-box btn-maint-upload-photo" onClick={() => uploadRef.current.click()}>
                        {!fileTypeError && !uploading && errorFiles.length == 0 && <>
                            <i className="far fa-plus-circle"></i>
                            <span className="">Drag and drop photos here, or click to choose your file</span>
                            <span className="add-box-mobile">Click to choose your file</span>
                        </>}
                        {fileTypeError && <div className="text-error">{fileTypeError}</div>}
                        {uploading && <div className="text-green">Uploading...</div>}

                        {errorFiles.length > 0 && <><br/><br/><div>We could not upload these files:<br/>
                            {errorFiles.map((file, i) =>
                                <div key={i}>{file}</div>
                            )}
                        </div></>}
                    </div>
                </DragAndDrop>

                {uploadedFiles.length > 0 && <>
                    <div className="thumbnail-gallery">
                        {uploadedFiles.map((photo, i) =>
                            <div onClick={() => handleSelectPhoto(photo)} key={i} className={selectedPhotos.indexOf(photo) >= 0 ? "thumb-wrap thumb-selected" : "thumb-wrap"} title={photo.filename} style={{cursor: "pointer"}}><img src={photo.url}/></div>
                        )}
                    </div>
                </>}

                {allowMultiSelect && buildMultiSelectUI(selectedPhotos)}
            </div>

            {currentPhoto &&
                <Modal closeModal={() => setCurrentPhoto(null)}>
                    <img src={currentPhoto.url} className="img-responsive"/>
                    <a onClick={(e) => handleDelete(e, currentPhoto)}>Remove Photo</a>
                </Modal>
            }
        </>
    )}

export default AddPhotoBox;

