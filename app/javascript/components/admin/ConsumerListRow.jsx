import React from 'react';
import {Link, useNavigate, useParams} from "react-router-dom";
import insightUtils from "../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../app/insightRoutes";

const ConsumerListRow = ({leaseResident, lease}) => {

    const params = useParams()

    const { constants, properties } = useSelector((state) => state.company)
    const property = (properties || []).find((property) => property.id == lease.property_id)
    const unit = ((property && property.units) || []).find((unit) => unit.id == lease.unit_id)

    return (
        <>
            {property &&
                <div className="st-row-wrap">
                    <div className="st-row">
                        <div className="st-col-25 st-first-col">
                            <div className="flex-column">
                                <Link to={insightRoutes.leaseShow(lease.hash_id)}>{leaseResident.resident.name}</Link>
                            </div>
                        </div>
                        <span className="st-col-25">
                            {!params.propertyId && <>{property.name}<br/></>}
                            {unit && <>{unit.street} {unit.unit_number}<br/>{unit.city}, {unit.state} {unit.zip}</>}
                        </span>
                        {['lead', 'applicant'].includes(lease.status) && <>
                            <span className="st-col-25">
                                Last Updated: {insightUtils.formatDate(leaseResident.updated_at)}
                            </span>
                            <span className="st-col-25">
                                Application Status: {insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}
                            </span>
                        </>}
                        {['future', 'current', 'former', 'renewing', 'cancelled'].includes(lease.status) && <>
                            <span className="st-col-25">
                                Lease Dates: {insightUtils.formatDate(lease.lease_start_on)} - {insightUtils.formatDate(lease.lease_end_on)}
                                {lease && lease.move_out_on && insightUtils.isDateInFuture(lease.move_out_on) && <><br/><br/>Scheduled Move-Out: {insightUtils.formatDate(lease.move_out_on)}</>}
                            </span>
                            <span className="st-col-25">
                                Status: {insightUtils.getLabel(lease.status, constants.lease_statuses)}
                            </span>
                        </>}
                        <span className="st-nav-col">

                        </span>
                    </div>
                </div>
            }
        </>

    )}
export default ConsumerListRow;

