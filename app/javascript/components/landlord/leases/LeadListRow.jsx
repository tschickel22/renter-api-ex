import React, {createRef, useEffect, useRef, useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const LeadListRow = ({leaseResident}) => {

    const lease = leaseResident.lease
    const navigate = useNavigate()
    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    const { currentUser } = useSelector((state) => state.user)
    const { constants, properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => lease && property.id == lease.property_id)
    const unit = ((property && property.units) || []).find((unit) => lease && unit.id == lease.unit_id)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-30 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        <div className="flex-column">
                            {currentUser.leasing_edit ?
                                <Link to={insightRoutes.leaseShow(lease.hash_id)}>
                                    {leaseResident.resident.first_name} {leaseResident.resident.last_name} ({insightUtils.getLabel(leaseResident.current_step, constants.lease_resident_steps)})
                                </Link>
                                :
                                <>{leaseResident.resident.first_name} {leaseResident.resident.last_name} ({insightUtils.getLabel(leaseResident.current_step, constants.lease_resident_steps)})</>
                            }
                        </div>
                    </div>
                    <span className="st-col-15">
                        {property && <>
                            {property.name}<br/>
                            {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                        </>}
                    </span>
                    <span className="st-col-15" title="Last Updated">
                        {insightUtils.formatDate(leaseResident.updated_at)}
                    </span>
                    <span className="st-nav-col">
                        {currentUser.leasing_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <li onClick={()=>navigateAndClose(insightRoutes.leaseShow(lease.hash_id))}><i className="fal fa-pencil"></i> View</li>
                            <li onClick={()=>navigateAndClose(insightRoutes.screeningInviteLead(leaseResident.hash_id))}><i className="fal fa-arrow-circle-up"></i> Invite to Apply</li>
                        </RowMenu>}
                    </span>
                </div>
            </div>

        </>

    )}

export default LeadListRow;

