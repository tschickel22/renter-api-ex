import React, {useState} from 'react';
import {useSelector} from "react-redux";
import FinancialConnectionsOnboardingLandingView from "./FinancialConnectionsOnboardingLandingView";

const FinancialConnectionsOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <FinancialConnectionsOnboardingLandingView />
                </>
            }
        </>
    )}

export default FinancialConnectionsOnboardingPage;

