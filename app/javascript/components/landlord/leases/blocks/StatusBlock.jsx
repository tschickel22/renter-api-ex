import React from 'react';
import {Link} from "react-router-dom";
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../../../app/insightRoutes";

const StatusBlock = ({title, lease}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <>
            <div className="title-block">
                <h1><span>{title} for</span><span className="mobile-br"></span> {lease.primary_resident.resident.first_name} {lease.primary_resident.resident.last_name}</h1>
                {lease.unit && <div className="subtitle">
                    {lease.unit.street}{lease.unit.unit_number && <>, Unit #{lease.unit.unit_number}</>}<span></span>{lease.property_name}<span></span>
                    {lease.lease_end_on && <>
                        {lease.lease_term && lease.lease_term == -1 ?
                            <>Lease Term: Month-to-Month</>
                            :
                            <>Lease Ending {insightUtils.formatDate(lease.lease_end_on)}</>
                        }
                    </>}
                </div>}
            </div>
            <div className="rd-status-wrap">
                {lease.status == constants.lease_statuses.lead.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Lead</span></div>
                </>}

                {lease.status == constants.lease_statuses.approved.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Approved</span></div>
                    {lease.lease_start_on && <div className="rd-balance">Lease Starts: <span className="btn-ledger-balance">{insightUtils.formatDate(lease.lease_start_on)}</span></div>}
                </>}

                {lease.status == constants.lease_statuses.renewing.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Renewing</span></div>
                    <div className="rd-balance">Move-in Date: <span className="btn-ledger-balance">{insightUtils.formatDate(lease.lease_start_on)}</span></div>
                </>}

                {lease.status == constants.lease_statuses.future.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Future</span></div>
                    <div className="rd-balance">Move-in Date: <span className="btn-ledger-balance">{insightUtils.formatDate(lease.lease_start_on)}</span></div>
                </>}

                {lease.status == constants.lease_statuses.current.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Current</span></div>
                    <div className="rd-balance">Amount Due: <Link to={insightRoutes.residentLedger(lease.hash_id)} className="btn-ledger-balance">{insightUtils.numberToCurrency(Math.max(lease.ledger_balance, 0), 2)}</Link></div>
                </>}

                {lease.status == constants.lease_statuses.former.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Former</span></div>
                    <div className="rd-balance">Move-out Date: <span className="btn-ledger-balance">{insightUtils.formatDate(lease.move_out_on)}</span></div>
                </>}

                {lease.status == constants.lease_statuses.applicant.key && <>
                    <div className="rd-status">Resident Status: <span className="rd-current">Applicant</span></div>
                    <div className="rd-balance">Application Status: <span className="btn-ledger-balance">{insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}</span></div>
                </>}
            </div>
        </>
    )}

export default StatusBlock;

