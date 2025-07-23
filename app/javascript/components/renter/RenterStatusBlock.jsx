import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../app/insightUtils";
import {Link, NavLink, useNavigate} from "react-router-dom";
import insightRoutes from "../../app/insightRoutes";

const RenterStatusBlock = ({title, lease, leaseResident, hideBackButton, hidePaymentNav, backUrl}) => {
    let navigate = useNavigate()

    const { constants, settings, properties } = useSelector((state) => state.company)
    const autoPayActivated = leaseResident && leaseResident.recurring_payment_frequency && leaseResident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key

    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(() => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    return (
        <>
            <div className="title-block">
                <h1><span>{title || "Lease Details"} for</span><span className="mobile-br"></span> Unit #{lease.unit.unit_number}</h1>
                {lease.unit &&
                    <div className="subtitle">
                        {lease.unit.street}, Unit #{lease.unit.unit_number}<span></span>{lease.unit.city}, {lease.unit.state} {lease.unit.zip}<span></span>
                        Lease starts {insightUtils.formatDate(lease.lease_start_on)}
                        {lease.lease_end_on && <>&nbsp;ends {insightUtils.formatDate(lease.lease_end_on)}</>}
                    </div>
                }
            </div>

            <div className="rd-status-wrap">

                {!hideBackButton && <><Link to={backUrl || insightRoutes.renterLeaseShow(lease.hash_id)} className="btn text-gray">&lt; Back</Link>&nbsp;&nbsp;</>}

                {lease.status == constants.lease_statuses.lead.key && <>
                    <div className="rd-status">Status: <span className="rd-current">Lead</span></div>
                </>}

                {lease.status == constants.lease_statuses.future.key && <>
                    <div className="rd-status">Status: <span className="rd-current">Future</span></div>
                </>}

                {lease.status == constants.lease_statuses.current.key && <>
                    <div className="rd-status">Status: <span className="rd-current">Current</span></div>
                </>}

                {(lease.status == constants.lease_statuses.future.key || lease.status == constants.lease_statuses.current.key) && <>
                    <div onClick={() => navigate(insightRoutes.renterLedger(lease.hash_id))} className="rd-balance">Amount Due: <span className="btn-ledger-balance">{insightUtils.numberToCurrency(Math.max(lease.ledger_balance, 0), 2)}</span></div>
                    <div onClick={() => navigate(autoPayActivated ? insightRoutes.renterRecurringPaymentSchedule(lease.hash_id, leaseResident.hash_id) : insightRoutes.renterRecurringPaymentEdit(lease.hash_id, leaseResident.hash_id))} className="rd-status" style={{cursor: 'pointer'}}>Autopay: <span className={autoPayActivated ? "rd-current" : "rd-past"}>{autoPayActivated ? "On" : "Off"}</span></div>
                    <div>&nbsp;</div>
                </>}

                {(lease.status == constants.lease_statuses.former.key) && <>
                    <div className="rd-status">Status: <span className="rd-current">Former</span></div>
                    <div onClick={() => navigate(insightRoutes.renterLedger(lease.hash_id))} className="rd-balance">Current Balance: <span className="btn-ledger-balance">{insightUtils.numberToCurrency(lease.ledger_balance, 2)}</span></div>
                    <div>&nbsp;</div>
                </>}

                {lease.status == constants.lease_statuses.applicant.key && <>
                    <div className="rd-status">Status: <span className="rd-current">Applicant</span></div>
                    <div className="rd-balance">Application Status: <span className="btn-ledger-balance">{insightUtils.getLabel(lease.application_status, constants.lease_application_statuses)}</span></div>
                </>}
            </div>

            {!hidePaymentNav && (lease.status == constants.lease_statuses.future.key || lease.status == constants.lease_statuses.current.key) && <>
                <div className="horiz-nav">
                    <div>&nbsp;</div>
                    <ul className="horiz-nav-list">


                        {autoPayActivated ?
                            <NavLink to={insightRoutes.renterRecurringPaymentEdit(lease.hash_id, leaseResident.hash_id)} className="hn-item">Edit Autopay</NavLink>
                            :
                            <>
                                {lease.ledger_balance > 0 && <NavLink to={insightRoutes.renterPaymentNew(lease.hash_id, leaseResident.hash_id)} className="hn-item">Make Payment</NavLink>}
                            </>
                        }


                        <NavLink to={insightRoutes.renterPaymentMethodList(lease.hash_id)} className="hn-item">Payment Methods</NavLink>
                        <NavLink to={insightRoutes.renterLedger(lease.hash_id)} className="hn-item">View Details</NavLink>
                        {autoPayActivated && <NavLink to={insightRoutes.renterRecurringPaymentSchedule(lease.hash_id, leaseResident.hash_id)} className="hn-item">Payment Schedule</NavLink>}
                        {currentSettings && currentSettings.enable_invoices && <NavLink to={insightRoutes.renterInvoiceList(lease.hash_id)} className="hn-item">Invoices</NavLink>}
                        {currentSettings && currentSettings.available_payment_methods_default_cash && <NavLink to={insightRoutes.cashPayCoupon(leaseResident.hash_id)} className="hn-item" target="_blank">Cash Pay</NavLink>}

                    </ul>
                    <div>&nbsp;</div>
                </div>
            </>}
        </>
    )}

export default RenterStatusBlock;

