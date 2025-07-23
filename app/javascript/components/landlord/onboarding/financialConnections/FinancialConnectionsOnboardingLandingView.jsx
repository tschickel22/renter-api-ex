import React, {useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";
import Modal from "../../../shared/Modal";

const FinancialConnectionsOnboardingLandingView = ({}) => {

    const navigate = useNavigate()

    const { currentCompany, constants, settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    const [confirmingOnboard, setConfirmingOnboard] = useState(false)

    async function handleStartOnboarding() {

        const newCompany = {id: currentCompany.id, financial_connections_onboard_status: constants.financial_connections_onboarding_statuses.completed.key}
        await store.dispatch(saveCompany({company: newCompany})).unwrap()

        navigate(insightRoutes.financialConnectionList())

    }

    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>


                <i className="fal fa-link section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Financial Connections</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-financial-connections-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>Import Financial Transactions &amp; Streamline Bookkeeping</h2>
                        <p>Save 5-10 hours bookkeeping each month!</p>

                        <div className="btn btn-red btn-large" onClick={() => setConfirmingOnboard(true)}><span>Activate Now</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-link"></i>
                                <h3>Program Overview</h3>
                                <ul>
                                    <li>Securely connect your financial accounts with Renter Insight Accounting</li>
                                    <li>Automatically import transactions, saving time and reducing errors</li>
                                    <li>Real-time updates with financial institutions</li>
                                    <li>Avoid duplicate entries</li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red far fa-clipboard-list-check"></i>
                                <h3>Details</h3>
                                <ul>
                                    <li>$9.95 per month with realtime updates</li>
                                    <li>$4.95 for each new account added (one-time charge)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop" style={{paddingTop: "160px"}}>
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-financial-connections-header.jpg"/>
                    </div>

                </div>


            </div>}

            {confirmingOnboard &&
                <Modal closeModal={() => setConfirmingOnboard(false)}>
                    <h2>Activate Financial Connections?</h2>
                    <div className="form-nav">
                        By confirming, your subscription will be updated with financial connections feeds
                    </div>
                    <div className="form-nav">
                        <a onClick={() => (setConfirmingOnboard(false))} className="btn btn-gray"><span>No</span></a>
                        <a onClick={() => (handleStartOnboarding())} className="btn btn-red"><span>Yes</span></a>
                    </div>
                </Modal>
            }
        </>

    )}

export default FinancialConnectionsOnboardingLandingView;

