import React from 'react';

const DocumentListView = ({label, hideLabel, uploadedFiles, handleDelete}) => {
    return (
        <>
            {uploadedFiles.length > 0 && <>

                {!hideLabel && <><br/><br/>{label || "Files Uploaded"}:</>}

                <table style={{margin: "0 auto"}}>
                    <tbody>
                    {uploadedFiles.map((file) =>
                        <tr key={file.id}><td align="left"><a href={file.url} target="_blank">{file.filename}</a></td><td>{handleDelete && <a onClick={(e) => handleDelete(e, file)}>&nbsp;&nbsp;&nbsp;<i className={"fal fa-trash"}></i></a>}</td></tr>
                    )}
                    </tbody>
                </table>
            </>}
        </>
    )}

export default DocumentListView;

