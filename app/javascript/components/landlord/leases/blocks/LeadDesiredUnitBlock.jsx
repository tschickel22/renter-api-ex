import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const LeadDesiredUnitBlock = ({lease}) => {

    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>
                <i onClick={() => navigate(insightRoutes.leadEdit(lease.primary_resident.hash_id))} className="fal fa-edit tooltip tooltip-edit btn-rd-edit-resident" style={{marginRight: "10px"}}></i>
                Desired Unit
            </h3>

            {lease && <div className="flex-line-wrap-text">

                {lease.property_name && <div><strong>Property:</strong> {lease.property_name}</div>}
                {lease.unit && <div><strong>Unit:</strong> {lease.unit.street_and_unit}</div>}
                {lease.primary_resident.lead_info && <>
                    <div><strong>Beds:</strong> {insightUtils.getBedsLabel(lease.primary_resident.lead_info.beds)}</div>
                    <div><strong>Baths:</strong> {lease.primary_resident.lead_info.baths}</div>
                    <div><strong>Sq. Ft.:</strong> {lease.primary_resident.lead_info.square_feet}</div>
                    {lease.primary_resident.lead_info.move_in_on && <div><strong>Move-in Date:</strong> {insightUtils.formatDate(lease.primary_resident.lead_info.move_in_on)}</div>}
                    {lease.lease_term && <div><strong>Lease Term:</strong> {insightUtils.getLabel(lease.lease_term, constants.lease_term_options)}</div>}

                    {lease.primary_resident.lead_info.comment && <>
                        <br/>
                        <div><strong>Message:</strong><br/><pre>{lease.primary_resident.lead_info.comment}</pre></div>
                    </>}
                </>}

            </div>}

            <div className="spacer"></div>
            {lease && lease.primary_resident && lease.primary_resident.lead_info && lease.primary_resident.lead_info.notes && <>

                <div className="flex-line-blockwrap">
                    <strong>Notes:</strong> {lease.primary_resident.lead_info.notes}
                </div>
                <div className="spacer"></div>
            </>}


        </div>
    )}

export default LeadDesiredUnitBlock;

