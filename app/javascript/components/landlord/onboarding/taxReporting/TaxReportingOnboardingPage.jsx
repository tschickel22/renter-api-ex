import React from 'react';
import {useSelector} from "react-redux";
import TaxReportingOnboardingLandingView from "./TaxReportingOnboardingLandingView";

const TaxReportingOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <TaxReportingOnboardingLandingView />
                </>
            }
        </>
    )}

export default TaxReportingOnboardingPage;

