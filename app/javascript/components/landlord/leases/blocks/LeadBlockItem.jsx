import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const LeadBlockItem = ({leaseResident}) => {
    let navigate = useNavigate();
    const { constants } = useSelector((state) => state.company)

    function handleInviteToApply() {
        navigate(insightRoutes.screeningInviteLead(leaseResident.hash_id))
    }

    return (
        <div className="flex-line-block flex-line-resident">
            <div className="flex-line flex-resident-edit-info">
                <a onClick={handleInviteToApply} className="flex-line flex-btn btn-resident-email"><i className="fal fa-arrow-circle-up tooltip tooltip-invite-to-apply btn-rd-edit-resident"></i></a>
            </div>
            
            <div className="flex-line-resident-info">
                <div className="flex-line flex-resident-name">
                    {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                </div>
                <span onClick={handleInviteToApply}>Invite to Apply</span>
            </div>
        </div>
    )}

export default LeadBlockItem;

