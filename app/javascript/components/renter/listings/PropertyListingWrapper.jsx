import React from 'react';
import TopBar from "../../shared/TopBar";
import PropertyListingShowPage from "./PropertyListingShowPage";

const PropertyListingWrapper = ({}) => {

    return (
        <>

            <TopBar />
            <div className="main-container resident-portal">
                <PropertyListingShowPage />
            </div>
        </>


    )}

export default PropertyListingWrapper;

