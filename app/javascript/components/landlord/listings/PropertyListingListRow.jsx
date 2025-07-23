import React, {createRef, useEffect, useRef, useState} from 'react';

import {Link, useNavigate, useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const PropertyListingListRow = ({unitListing, updateListingStatus, propertyListingHashId}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { properties, constants, baseUrl } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, {propertyId: unitListing.property_id})

    const navigate = useNavigate()
    const params = useParams()

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url, {state: {from: 'listings'}})
        setRowMenuOpen(false)
    }

    function copyListingLink(unitListing) {
        setRowMenuOpen(false)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(baseUrl + insightRoutes.unitListingShow(unitListing.hash_id, unitListing.url_stub));
        }
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row st-row-valign-top">
                    <div className="st-col-25 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        <Link to={currentUser.listings_edit ? insightRoutes.unitListingList(unitListing.property_id) : insightRoutes.unitListingPreview(unitListing.hash_id)}>
                            {!params.propertyId && <>{property.name}<br/></>}
                            {unitListing.name}
                        </Link>
                    </div>
                    <span className="st-col-15" title="Status">
                        <div onClick={() => (currentUser.listings_edit ? (updateListingStatus(unitListing, unitListing.status == constants.unit_listing_statuses.active.key ? constants.unit_listing_statuses.inactive.key : constants.unit_listing_statuses.active.key)) : void(0))} className={"lp-status-label" + (unitListing.status == constants.unit_listing_statuses.active.key ? "": " text-light-gray")} style={{cursor: "pointer"}}><i className={unitListing.status == constants.unit_listing_statuses.active.key ? "fad fa-toggle-on text-red" : "fad fa-toggle-off"}></i> <span>{unitListing.status_pretty}</span></div>
                    </span>
                    <span className="st-col-15" title="Type">
                        {unitListing.floor_plan_name}
                    </span>
                    <span className="st-col-10 text-right" title="Rent">
                        {unitListing.rent && <>{insightUtils.numberToCurrency(unitListing.rent)}</>}
                    </span>
                    <span className="st-col-25 text-right" title="Last Modified">
                        {insightUtils.formatDate(unitListing.updated_at)}
                    </span>
                    <span className="st-col-15 hidden-xl text-center" title="Applications">
                        {unitListing.application_count}
                    </span>
                    <span className="st-nav-col">
                        <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            {currentUser.listings_edit && <li onClick={()=>navigateAndClose(insightRoutes.propertyListingEdit(unitListing.property_id))}><i className="fal fa-pencil"></i> Edit Listing</li>}
                            <li onClick={()=> navigateAndClose(insightRoutes.unitListingPreview(unitListing.hash_id))}> <i className="fal fa-eye"></i>Preview Listing</li>
                            {unitListing.status == constants.unit_listing_statuses.active.key && <li onClick={()=> copyListingLink(unitListing)}> <i className="fal fa-copy"></i>Copy Listing Link</li>}
                            <li onClick={()=> navigateAndClose(insightRoutes.propertyListingsPreview(propertyListingHashId))}> <i className="fal fa-eye"></i>Preview Company Listings</li>
                        </RowMenu>
                    </span>
                </div>
            </div>

        </>

    )}

export default PropertyListingListRow;

