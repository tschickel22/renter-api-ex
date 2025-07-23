import React, {createRef, useEffect, useRef, useState} from 'react';

import {Link, useNavigate, useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";

const LeaseListRow = ({lease, mode}) => {

    const navigate = useNavigate()
    const params = useParams()

    const { constants, properties } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)
    const property = (properties || []).find((property) => property.id == lease.property_id)
    const unit = ((property && property.units) || []).find((unit) => unit.id == lease.unit_id)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url, params) {
        navigate(url, {state: params})
        setRowMenuOpen(false)
    }

    return (
        <>
            {property &&
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-30 st-col-md-75 st-first-col">
                        <div className="flex-column">
                            {((mode == "applicants" && currentUser.leasing_edit) || (mode != "applicants" && currentUser.residents_edit)) ?
                                <Link to={insightRoutes.leaseShow(lease.hash_id)} state={{return_url: location.pathname + (window.location.search || '')}}>
                                    {lease.primary_resident.resident.name}
                                    {[constants.lease_statuses.renewing.key, constants.lease_statuses.future.key, constants.lease_statuses.current.key, constants.lease_statuses.former.key].indexOf(lease.status) < 0 &&
                                    <>&nbsp;({insightUtils.getLabel(lease.primary_resident.current_step, constants.lease_resident_steps)})</>
                                    }
                                </Link>
                                :
                                <>
                                    {lease.primary_resident.resident.name}
                                    {[constants.lease_statuses.renewing.key, constants.lease_statuses.future.key, constants.lease_statuses.current.key, constants.lease_statuses.former.key].indexOf(lease.status) < 0 &&
                                    <>&nbsp;({insightUtils.getLabel(lease.primary_resident.current_step, constants.lease_resident_steps)})</>
                                    }
                                </>
                            }
                            {lease.secondary_residents && <>
                                {lease.secondary_residents.map((secondary_resident, i) => {
                                    return (
                                        <React.Fragment key={i}>
                                            {secondary_resident.resident.first_name} {secondary_resident.resident.last_name}&nbsp;
                                            {[constants.lease_statuses.renewing.key, constants.lease_statuses.future.key, constants.lease_statuses.current.key, constants.lease_statuses.former.key].indexOf(lease.status) < 0 &&
                                                <>&nbsp;({insightUtils.getLabel(secondary_resident.current_step || "Not Started", constants.lease_resident_steps)})</>
                                            }
                                            <br/>
                                        </React.Fragment>)
                                })}

                            </>}
                        </div>
                    </div>
                    <span className="st-col-15 hidden-md">
                        {!params.propertyId && <>{property.name}<br/></>}
                        {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                    </span>
                    <span className="st-col-10 hidden-md" title="Rent">
                        {lease && lease.rent > 0 && <>{insightUtils.numberToCurrency(lease.rent)}</>}
                    </span>
                    {mode == "applicants" && <>
                        <span className="st-col-20 st-col-md-25" title="Last Updated">
                            {insightUtils.formatDate(lease.primary_resident.updated_at)}
                        </span>
                        <span className="st-col-15 hidden-xl" title="Application Status">
                            {insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}
                        </span>
                    </>}
                    {mode == "residents" && <>
                        <span className="st-col-10 st-title hidden-lg">{insightUtils.formatDate(lease.lease_start_on)}</span>
                        <span className="st-col-10 st-title hidden-lg">
                            {insightUtils.formatDate(lease.lease_end_on)}
                            {lease && lease.move_out_on && insightUtils.isDateInFuture(lease.move_out_on) && <><br/><br/>Scheduled Move-Out: {insightUtils.formatDate(lease.move_out_on)}</>}
                        </span>
                        <span className="st-col-15 st-title hidden-xl">{insightUtils.getLabel(lease.status, constants.lease_statuses)}</span>
                    </>}
                    <span className="st-nav-col">
                        {((mode == "applicants" && currentUser.leasing_edit) || (mode != "applicants" && currentUser.residents_edit)) && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            {((mode == "applicants" && currentUser.leasing_edit) || (mode != "applicants" && currentUser.residents_edit)) && <li onClick={()=>navigateAndClose(insightRoutes.leaseShow(lease.hash_id), {from: mode})}><i className="fal fa-pencil"></i> Edit</li>}
                            {mode == "applicants" && currentUser.leasing_edit && <li><i className="fal fa-print"></i> <a href={insightRoutes.applicationPrint(lease.primary_resident.hash_id)} className="text-gray" target="_blank">View Printable Copy</a></li>}
                            {mode == "applicants" && currentUser.leasing_edit && [constants.lease_resident_steps.lead.key, constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.occupant_details.key, constants.lease_resident_steps.applicant_details.key].indexOf(lease.primary_resident.current_step) >= 0 && <li onClick={()=> {setRowMenuOpen(false); insightUtils.resendInvitation(lease.primary_resident.hash_id)}}><i className="fal fa-arrow-circle-up"></i> Resend Invitation</li>}
                        </RowMenu>}
                    </span>
                </div>
            </div>
            }
        </>

    )}

export default LeaseListRow;

