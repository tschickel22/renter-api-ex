import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const ApplicationBlockItem = ({leaseResident}) => {
    let navigate = useNavigate();
    const { constants } = useSelector((state) => state.company)

    function handleEditApplication() {
        navigate(insightRoutes.applicationEdit(leaseResident.hash_id))
    }

    return (
        <div className="flex-line-block flex-line-resident">
            <div className="flex-line flex-resident-edit-info">
                <i onClick={handleEditApplication} className="fal fa-edit tooltip tooltip-edit btn-rd-edit-resident"></i>
                <a href={insightRoutes.applicationPrint(leaseResident.hash_id)} className="text-gray" target="_blank"><i className="fal fa-print"></i></a>
                {false && <i className="fal fa-trash-alt tooltip tooltip-remove btn-rd-remove-resident"></i>}
            </div>

            {false && <img className="flex-img-avatar" src="images/photo-resident-mikeb.jpg"/>}
            <div className="flex-line-resident-info">
                <div className="flex-line flex-resident-name">
                    {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                </div>
                {insightUtils.getLabel(leaseResident.current_step, constants.lease_resident_steps)}

                {[constants.lease_resident_steps.lead.key, constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.lead.key, constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.occupant_details.key, constants.lease_resident_steps.applicant_details.key].indexOf(leaseResident.current_step) >= 0 && <>
                    <br/>
                    <a onClick={() => insightUtils.resendInvitation(leaseResident.hash_id)}>Resend Invitation</a>
                </>}
                {leaseResident.screening_reopened_at && <>
                    <br/>
                    Reopened {insightUtils.formatDate(leaseResident.screening_reopened_at)}
                </>}
            </div>
        </div>
    )}

export default ApplicationBlockItem;

