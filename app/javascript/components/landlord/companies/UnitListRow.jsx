import React, {createRef, useEffect, useRef, useState} from 'react';

import {Link, useNavigate, useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {loadUnitListingsForDisplay, searchForUnitListings} from "../../../slices/unitListingSlice";


const UnitListRow = ({unit, unitListings}) => {

    const { constants } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, {propertyId: unit.property_id})
    const unitListing = unitListings ? unitListings.find((unitListing) => unitListing.unit_id == unit.id) : null

    const navigate = useNavigate()
    const params = useParams()

    const [rowMenuOpen, setRowMenuOpen] = useState(false)
    const [showAllApplicants, setShowAllApplicants] = useState(false)

    function navigateAndClose(url) {
        navigate(url, {state: {from: 'units'}})
        setRowMenuOpen(false)
    }

    const currentLease = insightUtils.findCurrentLease(unit.leases)
    const applicants = unit.leases.filter((lease) => lease.primary_resident && lease != currentLease)

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row st-row-valign-top">
                    <div className="st-col-25 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        {!params.propertyId && <>{property.name}<br/></>}
                        {unit.unit_number && <>{unit.unit_number}<br/></>}
                            {unit.street &&
                                <>
                                    {unit.street}<br/>{unit.city}, {unit.state} {unit.zip}
                                </>
                            }
                    </div>
                    <span className="st-col-25">
                         {!(currentLease && currentLease.primary_resident) &&
                         <>
                             <strong>Vacant</strong>
                             {unit.leases.length > 0 && <><br/><br/></>}
                         </>
                         }

                        {(currentLease && currentLease.primary_resident) &&
                        <>
                            <strong>
                                <Link to={insightRoutes.leaseShow(currentLease.hash_id)} state={{from: 'units'}}>
                                    <i className="fal fa-pencil"></i>&nbsp;&nbsp;
                                    {currentLease.primary_resident.resident.first_name} {currentLease.primary_resident.resident.last_name}
                                    {currentLease.status && ` (${insightUtils.getLabel(currentLease.status, constants.lease_statuses)})`}
                                </Link>
                            </strong>
                            {unit.leases.length > 1 && <><br/><br/></>}
                        </>
                        }

                        {applicants.map((lease, i) => {
                            return (
                                <React.Fragment key={i}>
                                    {(i < 4 || showAllApplicants) && <>
                                        <Link to={insightRoutes.leaseShow(lease.hash_id)} state={{from: 'units'}}>
                                            <i className="fal fa-pencil"></i>&nbsp;&nbsp;
                                            {lease.primary_resident.resident.first_name} {lease.primary_resident.resident.last_name}
                                            {lease.status && ` (${insightUtils.getLabel(lease.status, constants.lease_statuses)})`}
                                        </Link>
                                        <br/>
                                    </>}
                                    {!showAllApplicants && i == 3 && applicants.length > 4 &&
                                    <><br/><a onClick={() => setShowAllApplicants(true)}>View All Applications ({applicants.length - 4})</a><br/></>}
                                </React.Fragment>
                            )
                        })}

                    </span>
                    <span className="st-col-10" title="Rent">
                        {currentLease && currentLease.rent && <>{insightUtils.numberToCurrency(currentLease.rent)}</>}
                    </span>
                    <span className="st-col-15 hidden-md" title="Lease Expiration">
                        {currentLease && currentLease.lease_end_on && <>{insightUtils.formatDate(currentLease.lease_end_on)}</>}
                        {currentLease && currentLease.move_out_on && insightUtils.isDateInFuture(currentLease.move_out_on) && <><br/><br/>Scheduled Move-Out: {insightUtils.formatDate(currentLease.move_out_on)}</>}
                    </span>
                    <span className="st-col-10 hidden-lg" title="Active Listings?">{unitListing ? <Link to={insightRoutes.unitListingList(unit.property_id)} >Yes</Link> : <Link to={insightRoutes.propertyListingEdit(unit.property_id)} >No</Link>}</span>
                    <span className="st-col-10 hidden-xl" title="Electronic Rent Payments?">{currentLease && currentLease.electronic_payments ? "Yes" : "No"}</span>
                    <span className="st-col-08 hidden-xl" title="Renters Insurance">{currentLease && currentLease.renters_insurance ? "Yes" : "No"}</span>
                    <span className="st-nav-col">
                        <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            {currentUser.properties_edit && <li onClick={()=>navigateAndClose(insightRoutes.unitEdit(property.id, unit.id))}><i className="fal fa-pencil"></i> Edit Unit</li>}
                            <li onClick={()=>navigateAndClose(insightRoutes.screeningNew(property.id, unit.id))}><i className="fal fa-pencil"></i> New Application</li>
                            {false && <>
                                <li className="btn-cust-view-report"><i className="fal fa-chart-pie"></i>View Customer Reports</li>
                                <li className="btn-cust-email"><i className="fal fa-envelope"></i>Email Customer</li>
                                <li className="btn-cust-call"><i className="fal fa-phone"></i>Call Customer&nbsp;(612) 483-3817</li>
                                <li className="btn-cust-export"><i className="fal fa-download"></i>Export to Excel</li>
                            </>}
                        </RowMenu>
                    </span>
                </div>
            </div>

        </>

    )}

export default UnitListRow;

