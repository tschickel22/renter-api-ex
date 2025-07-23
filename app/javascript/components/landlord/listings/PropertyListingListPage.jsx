import React, {useEffect, useState} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {Link, useNavigate, useParams} from "react-router-dom";

import insightRoutes from "../../../app/insightRoutes";
import PropertyListingListRow from "./PropertyListingListRow";

import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";
import CompanyNav from "../companies/CompanyNav";
import PropertyNav from "../companies/PropertyNav";
import {saveUnitListing, searchForUnitListings} from "../../../slices/unitListingSlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const PropertyListingListPage = ({}) => {

    let params = useParams();
    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const { properties, currentCompany, constants } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [triggerRefresh, setTriggerRefresh] = useState(false)
    const [propertyListingHashId, setPropertyListingHashId] = useState(null)

    useEffect(() => {
        if (currentCompany.listings_onboard_status != constants.payment_onboarding_statuses.completed.key) {
            navigate(insightRoutes.onboardingListings())
        }
    }, [])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForUnitListings({propertyId: parseInt(params.propertyId), searchText: text})).unwrap()
        setTriggerRefresh(false)
        setPropertyListingHashId(results.data.property_listing_hash_id)
        return {total: results.data.unit_listings.length, objects: results.data.unit_listings}
    }

    function generateTableRow(unitListing, key) {
        return (<PropertyListingListRow key={key} unitListing={unitListing} updateListingStatus={updateListingStatus} propertyListingHashId={propertyListingHashId} />)
    }

    async function updateListingStatus(unitListing, newStatus) {
        let newUnitListing = Object.assign({}, unitListing)
        newUnitListing.status = newStatus

        const results = await store.dispatch(saveUnitListing({unitListing: newUnitListing})).unwrap()

        if (results.data.unit_listing) setTriggerRefresh(true)
        else if (results.data.errors) {
            if (results.data.errors.status) {
                if (results.data.errors.status.indexOf("screening settings") >= 0) {
                    store.dispatch(displayAlertMessage({message: results.data.errors.status, url: insightRoutes.settingEdit("properties", unitListing.property_id, "screening", true), navigateState: {return_url: location.pathname}, linkText: "Edit Settings"}))
                }
                else {
                    store.dispatch(displayAlertMessage({message: results.data.errors.status}))
                }
            }
            else {
                alert('Unable to update listing status')
            }
        }
    }

    return (
        <>
            {properties && currentUser.listings_view &&
                <ListPage
                    title="Listings"
                    runSearch={runSearch}
                    titleImage={<img className="section-img" src="/images/photo-units.jpg" />}
                    nav={property ? <PropertyNav property={property} /> : <CompanyNav /> }
                    addButton={
                        <><div className="smallspacer"></div>
                            <div className="st-nav">
                                {currentUser.listings_edit && <Link to={insightRoutes.propertyListingNew(property ? property.id : null)} className="btn btn-red"><span>Add Listing <i className="fas fa-plus"></i></span></Link>}
                            </div>
                        </>
                    }
                    columns={[
                        {label: "Property / Unit", class: "st-col-25", sort_by: 'property_id'},
                        {label: "Status", class: "st-col-15", sort_by: 'status'},
                        {label: "Type", class: "st-col-15", sort_by: 'type'},
                        {label: "Rent", class: "st-col-10 text-right", sort_by: 'rent'},
                        {label: "Last Modified", class: "st-col-25 text-right", sort_by: 'updated_at'},
                        {label: "Applications", class: "st-col-15 hidden-xl text-center", sort_by: 'applications'},
                    ]}
                    generateTableRow={generateTableRow}
                    noDataMessage="No Listings Found"
                    reloadWhenChanges={triggerRefresh}
                />
            }
        </>

    )}

export default PropertyListingListPage;

