import React from 'react';
import TopBar from "../../shared/TopBar";
import UnitListingShowPage from "./UnitListingShowPage";

const UnitListingWrapper = ({}) => {

    return (
        <>

            <TopBar />
            <div className="main-container resident-portal">
                <UnitListingShowPage />
            </div>
        </>


    )}

export default UnitListingWrapper;

