import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";
import ApplicationActionButton from "./ApplicationActionButton";
import {useSelector} from "react-redux";

const MoveInBlock = ({lease, setLease}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>Move-In</h3>

            { lease.status == constants.lease_statuses.approved.key ?

                (lease.lease_start_on ?
                    <>
                        <div className="flex-line-block">Scheduled for {insightUtils.formatDate(lease.lease_start_on)}</div>
                        <div className="spacer"></div>
                        <div className="flex-line-block"><Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Change Move-In <i className="fal fa-person-dolly"></i></span></Link></div>
                    </>
                :
                    <>
                        <div className="flex-line-block">Not Scheduled</div>
                        <div className="spacer"></div>
                        <div className="flex-line-block"><Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Schedule Move-In <i className="fal fa-person-dolly"></i></span></Link></div>
                    </>
                )

                :

                <>
                    {[constants.lease_application_statuses.completed.key, constants.lease_application_statuses.declined.key].indexOf(lease.application_status) >= 0 && <>
                        <div className="flex-line-block">The application must be approved first</div>
                        <div className="spacer"></div>
                        <div className="flex-line-block"><ApplicationActionButton lease={lease} setLease={setLease} /></div>
                    </>}
                </>

            }

        </div>
    )}

export default MoveInBlock;

