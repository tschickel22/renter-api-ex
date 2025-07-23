import React from "react";
import { useSelector } from "react-redux";
import insightUtils from "../../../../app/insightUtils";
import store from "../../../../app/store";
import { saveCompany } from "../../../../slices/companySlice";

const LeaseDocsOnboardingLandingView = ({}) => {
  const { currentCompany, settings } = useSelector((state) => state.company);
  const globalSettings = insightUtils.getSettings(settings);

  async function activateDocumentManagement() {
    await store
      .dispatch(
        saveCompany({
          company: { id: currentCompany.id, document_management_active: true },
        })
      )
      .unwrap();
  }

  return (
    <>
      {globalSettings && (
        <div className="section">
          <div className="circle-bg"></div>

          <i className="far fa-file-signature section-icon section-icon-red"></i>

          <div className="title-block">
            <h1>Get Started Now</h1>
          </div>

          <div className="onboarding onboarding-wrap">
            <div className="column column-img-mobile">
              <img
                className="img-responsive img-rounded-corners"
                src="/images/marketing-products-lease-header.jpg"
              />
            </div>

            <div className="column">
              <h2>Document Management & eSignatures</h2>
              <p>
                Automate your document management and lease signing process with
                Renter Insight. Easily upload existing documents, identify
                fields to populate and send for eSignature. Save hours on each
                lease!
              </p>

              <div
                className="btn btn-red btn-large"
                onClick={() => activateDocumentManagement()}
              >
                <span>Activate document management</span>
              </div>

              <div className="column-split-wrap">
                <div className="column-split">
                  <i className="icon-red icon-vert far fa-files"></i>
                  <h3>Document Management</h3>
                  <ul>
                    <li>Unlimited document uploads</li>
                    <li>Document and folder management</li>
                    <li>Create and save templates</li>
                    <li>Automatic cloud backup</li>
                  </ul>
                </div>

                <div className="column-split">
                  <i className="icon-red icon-vert far fa-file-contract"></i>
                  <h3>eSignature</h3>
                  <ul>
                    <li>Workflow automation</li>
                    <li>Send invites via email and text (SMS)</li>
                    <li>Audit trail and certificate of completion</li>
                    <li>Reminders and notifications</li>
                    {/* <li className="btn-fees btn-onboard-pricing-lease-docs"><a onClick={() => setShowingFees(true)}>View Pricing<sup>*</sup></a></li> */}
                  </ul>
                </div>
              </div>

              <p>
                <b>$2.49 per Envelope Sent for Signature.</b> An envelope can
                contain multiple documents and be sent to multiple recipients
                for signature. (Example: A 20-page lease sent to 4 people for
                signature will incur one charge of $2.49)
              </p>
            </div>

            <div className="column column-img-desktop">
              <img
                className="img-responsive img-rounded-corners"
                src="/images/marketing-products-lease.jpg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaseDocsOnboardingLandingView;
