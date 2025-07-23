import React, {useState} from 'react';
import {useSelector} from "react-redux";
import CollectionsOnboardingLandingView from "./CollectionsOnboardingLandingView";

const CollectionsOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <CollectionsOnboardingLandingView />
                </>
            }
        </>
    )}

export default CollectionsOnboardingPage;

