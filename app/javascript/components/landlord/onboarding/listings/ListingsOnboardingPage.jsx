import React, {useState} from 'react';
import {useSelector} from "react-redux";
import ListingsOnboardingLandingView from "./ListingsOnboardingLandingView";

const ListingsOnboardingPage = ({}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            {currentCompany &&
                <>
                    <ListingsOnboardingLandingView />
                </>
            }
        </>
    )}

export default ListingsOnboardingPage;

