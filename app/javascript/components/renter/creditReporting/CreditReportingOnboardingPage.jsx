import React from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {saveCompany} from "../../../slices/companySlice";
import insightRoutes from "../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const CreditReportingOnboardingPage = ({}) => {

    const navigate = useNavigate()

    const { settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)
    
    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>

                <i className="far fa-chart-line-up section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Credit Builder</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners" src="/images/credit-builder.png"/>
                    </div>

                    <div className="column">
                        <h2>You pay rent on time, get rewarded for it!</h2>
                        <p className="text-center">Build your credit by paying your rent. We'll do the rest!</p>

                        <div className="btn btn-red btn-large" onClick={() => navigate(insightRoutes.renterCreditReportingActivate())}><span>Activate Now</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-chart-line-up"></i>
                                <h3>Program Overview</h3>
                                <ul>
                                    <li>Renter Insight will report your Rent Payments to major credit bureau monthly boosting your credit.</li>
                                    <li>Only positive payments are reported with this plan.</li>
                                    <li>There is an average 60 point score increase when rent payments included for unscorable or subprime files.</li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-clipboard-list-check"></i>
                                <h3>Details</h3>
                                <ul>
                                    <li>$4.95 per month & no set up fees</li>
                                    <li>Optional Payment History Boost. A one time fee of only $14.95 and get up to your last 24 months payments instantly reported.</li>
                                    <li>Cancel at any time, or we will cancel at the end of your lease automatically.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners" src="/images/credit-builder.png"/>
                    </div>

                </div>

            </div>}
        </>

    )}


export default CreditReportingOnboardingPage;

