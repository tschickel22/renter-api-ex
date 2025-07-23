import React, {useState} from 'react';
import {useSelector} from "react-redux";
import PaymentsOnboardingLandingView from "./PaymentsOnboardingLandingView";
import PaymentsOnboardingCompanyInfoView from "./PaymentsOnboardingCompanyInfoView";
import PaymentsOnboardingAgreementsView from "./PaymentsOnboardingAgreementsView";
import PaymentsOnboardingSubmittedView from "./PaymentsOnboardingSubmittedView";
import PaymentsOnboardingTaxpayerInfoView from "./PaymentsOnboardingTaxpayerInfoView";
import PaymentsPropertyBankAccountsView from "./PaymentsPropertyBankAccountsView";

const PaymentsOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    let steps = {}
    steps[constants.payment_onboarding_statuses.started.key] = 'Company Information'
    steps[constants.payment_onboarding_statuses.agreement.key] = 'Agreement'
    steps[constants.payment_onboarding_statuses.taxpayer_info.key] = 'W-9'
    steps[constants.payment_onboarding_statuses.submitted.key] = 'Done'

    return (
        <>
            {currentCompany &&
                <>
                    {(!currentCompany.payments_onboard_status || currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.new.key) && <PaymentsOnboardingLandingView />}
                    {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.started.key && <PaymentsOnboardingCompanyInfoView steps={steps} />}
                    {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.agreement.key && <PaymentsOnboardingAgreementsView steps={steps} />}
                    {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.taxpayer_info.key && <PaymentsOnboardingTaxpayerInfoView steps={steps} />}
                    {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.submitted.key && <PaymentsOnboardingSubmittedView />}
                    {(currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.property_accounts.key || currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key) && <PaymentsPropertyBankAccountsView />}

                </>
            }
        </>
    )}

export default PaymentsOnboardingPage;

