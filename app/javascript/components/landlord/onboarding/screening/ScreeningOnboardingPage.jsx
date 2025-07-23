import React, {useState} from 'react';
import {useSelector} from "react-redux";
import ScreeningOnboardingLandingView from "./ScreeningOnboardingLandingView";

const ScreeningOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <ScreeningOnboardingLandingView />
                </>
            }
        </>
    )}

export default ScreeningOnboardingPage;

