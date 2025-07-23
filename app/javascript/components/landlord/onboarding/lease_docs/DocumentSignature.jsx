import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import store from "../../../../app/store";
import { getSigningIframeDetails } from '../../../../slices/documentsSlice';

const DocumentSignature = () => {
  const { id: externalDocumentId } = useParams();
  const [embedUrl, setEmbedUrl] = useState(null);

  useEffect(async () => {
    if (externalDocumentId) {
      await loadExternalDocumentData(externalDocumentId);
    }
  }, [externalDocumentId]);


  const loadExternalDocumentData = async (externalDocumentId) => {
    const { data: {sign_url: signUrl } } = await store.dispatch(getSigningIframeDetails(externalDocumentId)).unwrap();
    setEmbedUrl(signUrl);
  }
  return (
    <>
      <h1>Document Signature</h1>
      {embedUrl && <iframe src={embedUrl} width="100%" height="1000px"></iframe>}
    </>
  );
};

export default DocumentSignature;
