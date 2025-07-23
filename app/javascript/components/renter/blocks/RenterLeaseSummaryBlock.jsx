import React from 'react';
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const RenterLeaseSummaryBlock = ({lease}) => {

    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            {lease.status == constants.lease_statuses.applicant.key && <>
                <h3>Lease</h3>
                <div className="flex-line-block">
                    {lease.property && <div className="flex-line">Property: <strong className="rd-item">{lease.property.name}</strong></div>}
                    {lease.unit && <div className="flex-line">Unit: <strong className="rd-item">{lease.unit.unit_number}</strong></div>}
                    {lease.lease_start_on && <div className="flex-line">Start Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_start_on)}</strong></div>}
                    {lease.lease_end_on && <div className="flex-line">End Date: <strong className="rd-item">{insightUtils().formatDate(lease.lease_end_on)}</strong></div>}
                    {lease.rent && <div className="flex-line">Rent <strong className="rd-item">{insightUtils.numberToCurrency(lease.rent)}</strong></div>}
                    {lease.unit && <div className="flex-line">Beds: <strong className="rd-item">{insightUtils.getBedsLabel(lease.unit.beds)}</strong></div>}
                    {lease.unit && <div className="flex-line">Baths: <strong className="rd-item">{lease.unit.baths}</strong></div>}
                </div>
                <div className="spacer"></div>
            </>}

            {lease.status != constants.lease_statuses.applicant.key && <>
                <h3>Lease Summary</h3>
                <div className="flex-line-block">
                    <div className="flex-line">Start Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_start_on)}</strong></div>
                    <div className="flex-line">End Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_end_on)}</strong></div>
                </div>

                {false && <div className="flex-line-block">
                    <div className="flex-line">Security Deposit <strong className="rd-item">{insightUtils.numberToCurrency(lease.security_deposit)}</strong></div>
                    <div className="flex-line">Pet Deposit <strong className="rd-item">$250 (Paid)</strong></div>
                </div>}

                {(lease.move_in_on || lease.move_out_on) && <div className="flex-line-block">
                    {lease.move_in_on && <div className="flex-line">Move-In Date: <strong>{insightUtils.formatDate(lease.move_in_on)}</strong></div>}
                    {lease.move_out_on && <div className="flex-line">Move-Out Date: <strong>{insightUtils.formatDate(lease.move_out_on)}</strong></div>}
                </div>}
                <div className="spacer"></div>
                {lease.status == constants.lease_statuses.current.key && <div onClick={() => {navigate(insightRoutes.renterMoveOutOrRenew(lease.hash_id))}} className="btn btn-bottom btn-red"><span>Schedule Move-Out <i className="fal fa-person-dolly"></i></span></div>}
            </>}
        </div>
    )}

export default RenterLeaseSummaryBlock;

