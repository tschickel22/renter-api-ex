import React, {useState} from 'react';
import {useSelector} from "react-redux";
import InsuranceOnboardingLandingView from "./InsuranceOnboardingLandingView";

const InsuranceOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <InsuranceOnboardingLandingView />
                </>
            }
        </>
    )}

export default InsuranceOnboardingPage;

