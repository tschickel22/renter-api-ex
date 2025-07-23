import React, {useEffect, useState} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {Link, useParams} from "react-router-dom";

import insightRoutes from "../../../app/insightRoutes";
import UnitListRow from "./UnitListRow";
import {searchForUnits} from "../../../slices/unitSlice";
import PropertyNav from "./PropertyNav";
import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";
import CompanyNav from "./CompanyNav";
import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import {searchForUnitListings} from "../../../slices/unitListingSlice";


const UnitListPage = ({}) => {

    let params = useParams();
    const { currentUser } = useSelector((state) => state.user)
    const { properties, constants } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [triggerRefresh, setTriggerRefresh] = useState(false)
    const [searchByStatus, setSearchByStatus] = useState(params.status || "all")
    const [unitListings, setUnitListings] = useState(null)

    useEffect(async() => {

        const results = await store.dispatch(searchForUnitListings({})).unwrap()

        if (results.data.unit_listings) {
            setUnitListings(results.data.unit_listings.filter((unitListing) => unitListing.status == constants.unit_listing_statuses.active.key))
        }
    }, []);

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForUnits({propertyId: parseInt(params.propertyId), searchText: text, status: searchByStatus})).unwrap()
        setTriggerRefresh(false)
        return {total: results.data.units.length, objects: results.data.units}
    }

    function generateTableRow(unit, key) {
        return (<UnitListRow key={key} unit={unit} unitListings={unitListings}  />)
    }

    function currentLeaseResidentName(unit) {
        const currentLease = insightUtils.findCurrentLease(unit.leases)

        if (!(currentLease && currentLease.primary_resident)) {
            return "Vacant"
        }
        else {
            return currentLease.primary_resident.resident.first_name
        }
    }

    function currentLeaseRent(unit) {
        const currentLease = insightUtils.findCurrentLease(unit.leases)

        if (!(currentLease && currentLease.primary_resident)) {
            return null
        }
        else {
            return currentLease.rent
        }
    }

    function currentLeaseEndOn(unit) {
        const currentLease = insightUtils.findCurrentLease(unit.leases)

        if (!(currentLease && currentLease.primary_resident)) {
            return null
        }
        else {
            return currentLease.lease_end_on
        }
    }

    function handleStatusChange(e) {
        setSearchByStatus(e.target.value)
        setTriggerRefresh(true)
    }

    return (
        <>
            {currentUser.properties_view && <ListPage
                title="Units"
                runSearch={runSearch}
                titleImage={<img className="section-img" src="/images/photo-units.jpg" />}
                nav={property ? <PropertyNav property={property} /> : <CompanyNav /> }
                addButton={currentUser.properties_edit &&
                (!property || insightUtils.isMultiFamily(property.property_type)) ? <><div className="smallspacer"></div><div className="st-nav"><Link to={insightRoutes.unitNew(property ? property.id : null)} className="btn btn-red"><span>Add Unit <i className="fas fa-plus"></i></span></Link></div></> : null
                }
                secondaryNav={
                    <Formik initialValues={{status: searchByStatus}}>
                        {({  }) => (
                            <Form>
                                <div className="st-nav">
                                    <div className="form-item">
                                        <BasicDropdown name="status" options={[{id: "all", name: "All"}, {id: "occupied", name: "Occupied"}, {id: "vacant", name: "Vacant"}, {id: "vacant_leased", name: "Vacant Leased"}]} onChange={(e) => handleStatusChange(e)} extraClass="form-select-wide" />
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                }
                moveSecondaryNavAsNeeded={true}
                noDataMessage="No Units Found"
                columns={[
                    {label: "Unit", class: "st-col-25", sort_by: 'unit_number'},
                    {label: "Occupancy", class: "st-col-25", sort_by: 'primary_resident', data_type: 'function', sort_by_function: currentLeaseResidentName},
                    {label: "Rent", class: "st-col-10", sort_by: 'rent', data_type: 'function', sort_by_function: currentLeaseRent},
                    {label: "Lease<br/>Expirations", class: "st-col-15 hidden-md", sort_by: 'lease_end_on', data_type: 'function', sort_by_function: currentLeaseEndOn},
                    {label: "Active Listing", class: "st-col-10 hidden-lg", sort_by: 'active_listings'},
                    {label: "Electronic Payments", class: "st-col-10 hidden-xl", sort_by: 'electronic_payments'},
                    {label: "Renters Insurance", class: "st-col-10 hidden-xl", sort_by: 'renters_insurance'},
                ]}
                generateTableRow={generateTableRow}
                reloadWhenChanges={triggerRefresh}
            />}
        </>

    )}

export default UnitListPage;

