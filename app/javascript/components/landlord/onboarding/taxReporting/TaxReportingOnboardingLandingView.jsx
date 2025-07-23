import React, {useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";
import Modal from "../../../shared/Modal";

const TaxReportingOnboardingLandingView = ({}) => {

    const navigate = useNavigate()

    const { currentCompany, constants, settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    const [confirmingOnboard, setConfirmingOnboard] = useState(false)

    async function handleStartOnboarding() {

        const newCompany = {id: currentCompany.id}

        if (![constants.tax_reporting_onboard_statuses.pending.key, constants.tax_reporting_onboard_statuses.completed.key].includes(newCompany.tax_reporting_onboard_status)) {
            newCompany.tax_reporting_onboard_status = constants.tax_reporting_onboard_statuses.started.key
        }

        const result = await store.dispatch(saveCompany({company: newCompany})).unwrap()
        console.log(result)

        navigate(insightRoutes.companyEdit("my"))

    }

    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>

                <img className="img-responsive" src="/images/1099-report.png" style={{maxWidth: "150px"}}/>

                <div className="title-block">
                    <h1>1099 Reporting</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column">
                        <h2>Save time, ensure compliance and file your 1099's in minutes</h2>
                        <p>IRS requires e-filing for 10+ 1099's. <a href="https://www.federalregister.gov/documents/2023/02/23/2023-03710/electronic-filing-requirements-for-specified-returns-and-other-documents" target="_blank">Learn More</a></p>

                        <div className="btn btn-red btn-large" onClick={() => setConfirmingOnboard(true)}><span>File Now</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-link"></i>
                                <h3>Program Overview</h3>
                                <ul>
                                    <li>Securely file 1099 NEC & Misc.</li>
                                    <li>Automatically transmit payee information</li>
                                    <li>Maintain compliance by filing electronically & by US Mail</li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red far fa-clipboard-list-check"></i>
                                <h3>Details</h3>
                                <ul>
                                    <li>Renter Insight Partnered with NELCO, a leading provider of 1099 reporting</li>
                                    <li><a href="https://acs.nelcoportal.com/Content/Filing_Information" target="_blank">Volume Pricing</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop" style={{paddingTop: "160px"}}>
                        <img className="img-responsive img-rounded-corners" src="/images/filing-logo-with-gear.png"/>
                    </div>

                </div>


            </div>}

            {confirmingOnboard &&
                <Modal closeModal={() => setConfirmingOnboard(false)}>
                    <h2>Activate 1099 Reporting?</h2>
                    <div className="form-nav">
                        In order to complete 1099 Reporting activation, you must complete your company profile.  Do you want to continue?
                    </div>
                    <div className="form-nav">
                        <a onClick={() => (setConfirmingOnboard(false))} className="btn btn-gray"><span>No</span></a>
                        <a onClick={() => (handleStartOnboarding())} className="btn btn-red"><span>Yes</span></a>
                    </div>
                </Modal>
            }
        </>

    )}

export default TaxReportingOnboardingLandingView;

