import React, { useEffect, useRef, useState } from "react";
import insightUtils from "../../../../app/insightUtils";
import { useParams } from "react-router-dom";
import store from "../../../../app/store";
import { loadZohoSignOAuthToken } from "../../../../slices/zohoSignSlice";
import { useNavigate } from "react-router-dom";

const DocumentIframe = () => {
  const { id: externalDocumentId, record_type: documentType } = useParams();
  const [ iframeUrl, setIframeUrl ] = useState(null);

  const navigate = useNavigate();

  useEffect(async () => {
    if (externalDocumentId) {
      generateForm(externalDocumentId);
    }
  }, [externalDocumentId]);

  const [isIframeVisible, setDisplay] = useState(false);
  const [isLoading, setLoading] = useState(false);

  async function generateForm(externalDocumentId) {
    setDisplay(false);
    setLoading(true);
    const { data } = await store.dispatch(loadZohoSignOAuthToken(externalDocumentId)).unwrap();
    setIframeUrl(data.send_url)
    setLoading(false);
    setDisplay(true);
  }

  function getUrlBasedOnType() {
    return documentType === "document" ? `/request/new/${externalDocumentId}` : `/template/new/${externalDocumentId}`;
  }

  function getRedirectBasedOnType(integration) {
    return documentType === "document" ? `${integration.redirect_url}/external_document/${externalDocumentId}/sent_for_signature` : `${integration.redirect_url}/external_document/${externalDocumentId}/template_updated`;
  }

  return (
    <div>
      <div className="onboarding onboarding-wrap">
        <div className="column">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-red"
            type="button"
          >
            Back
          </button>
        </div>
      </div>
      <div className="onboarding onboarding-wrap">
        <div className="column text-center">
          {isLoading && (
            <>
              <i className="fa-sharp fa-spin fa-2x fa-regular fa-circle-notch"></i><br/>
              <span>Loading...</span>
            </>
          )}
          <iframe
            className="zoho-integration-iframe"
            style={{ display: isIframeVisible ? "block" : "none" }}
            width="1300px"
            height="1500px"
            name="signIframe"
            src={iframeUrl}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default DocumentIframe;
