import React from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const PaymentsOnboardingSubmittedView = ({}) => {
    const navigate = useNavigate()

    const { currentCompany } = useSelector((state) => state.company)

    async function handleDone() {
        navigate(insightRoutes.settingList())
    }

    return (
        <>
            <div className="section" id="ll-section-resident-screening">

                <div className="title-block">
                    <h1>Information Submitted</h1>
                </div>

                <div className="section-table-wrap">
                    <p>Your information has been submitted to Zego, Powered by PayLease.  Zego will contact you within 24-48 business hours to complete the onboarding process.  Per State and Federal requirements, Zego must complete a Know Your Customer (KYC) review.</p>
                    <p>Please be sure to check your email inbox and junk box to ensure you receive instructions on how to complete the KYC review.</p>
                    <p>You will receive an email and or text alert notifying you when your account is active and ready to begin accepting Credit Card and ACH payments.</p>
                    <p>Application Submitted: {insightUtils.formatDate(currentCompany.payments_agreement_at)}</p>
                    <p>Please contact <a href="mailto:support@renterinsight.com">support@renterinsight.com</a> with any questions.</p>
                </div>

                <div className="text-center">
                    <a onClick={() => handleDone()} className="btn btn-red">Done</a>
                </div>
            </div>
        </>

    )}

export default PaymentsOnboardingSubmittedView;

