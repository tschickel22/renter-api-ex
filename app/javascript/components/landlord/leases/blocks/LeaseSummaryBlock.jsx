import React, {useEffect, useState} from 'react';
import moment from 'moment';

import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {loadLease} from "../../../../slices/leaseSlice";

const LeaseSummaryBlock = ({lease}) => {
    const maxDaysUntilMoveInCancel = 30 // Eventually, a setting here
    const { constants } = useSelector((state) => state.company)

    const [nextLease, setNextLease] = useState(null)

    useEffect(async() => {
        const results = await store.dispatch(loadLease({leaseId: lease.next_lease_hash_id})).unwrap()
        console.log(results)
        setNextLease(results.data?.lease)
    }, [lease.next_lease_hash_id])

    return (
        <div className="flex-grid-item">
            {lease.status == constants.lease_statuses.applicant.key && <>
                <h3>Lease</h3>
                <div className="flex-line-block">
                    {lease.property && <div className="flex-line">Property: <strong className="rd-item">{lease.property.name}</strong></div>}
                    {lease.unit && <div className="flex-line">Unit: <strong className="rd-item">{lease.unit.unit_number}</strong></div>}
                    {lease.lease_start_on && <div className="flex-line">Start Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_start_on)}</strong></div>}
                    {lease.lease_end_on && <div className="flex-line">End Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_end_on)}</strong></div>}
                    {lease.rent && <div className="flex-line">Rent <strong className="rd-item">{insightUtils.numberToCurrency(lease.rent)}</strong></div>}
                    {lease.unit && <div className="flex-line">Beds: <strong className="rd-item">{insightUtils.getBedsLabel(lease.unit.beds)}</strong></div>}
                    {lease.unit && <div className="flex-line">Baths: <strong className="rd-item">{lease.unit.baths}</strong></div>}
                </div>

                <div className="spacer"></div>

                {lease.application_status == constants.lease_application_statuses.approved.key ?
                    <Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>{lease.rent ? "Edit" : "Generate"} Lease <i className={lease.rent ? "fal fa-pencil" : "fal fa-plus"}></i></span></Link>
                    :
                    <Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Edit Details <i className={lease.rent ? "fal fa-pencil" : "fal fa-plus"}></i></span></Link>
                }
            </>}

            {lease.status != constants.lease_statuses.applicant.key && <>
                <h3>Lease</h3>
                <div className="flex-line-block">
                    <div className="flex-line">Start Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_start_on)}</strong></div>
                    {lease.lease_term && lease.lease_term == -1 ?
                        <div className="flex-line">Lease Term: <strong>Month-to-Month</strong></div>
                        :
                        <>
                            <div className="flex-line">End Date: <strong className="rd-item">{insightUtils.formatDate(lease.lease_end_on)}</strong></div>
                            {nextLease && nextLease.status == constants.lease_statuses.future.key && <div className="flex-line">Renewed Until: <strong className="rd-item">{insightUtils.formatDate(nextLease.lease_end_on)}</strong></div>}
                        </>
                    }
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


                {lease.status == constants.lease_statuses.approved.key ?
                    <div className="flex-line-block">
                        <Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Schedule Move-In <i className="fal fa-person-dolly"></i></span></Link>
                    </div>
                    :
                    <>
                        {lease.status == constants.lease_statuses.renewing.key ?
                            <div className="flex-line-block">
                                <Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Continue Renewal</span></Link>
                            </div>
                            :
                            <div className="flex-column flex-center">
                                {lease.lease_start_on && moment(lease.lease_start_on).isSameOrAfter(moment().subtract(maxDaysUntilMoveInCancel, 'days')) && <>
                                    {!lease.previous_lease_id ?
                                        <Link to={insightRoutes.leaseCancelMoveIn(lease.hash_id)} className="btn btn-bottom btn-red"><span>Cancel Move-In <i className="fal fa-times-circle"></i></span></Link>
                                        :
                                        <Link to={insightRoutes.leaseCancelMoveIn(lease.hash_id)} className="btn btn-bottom btn-red"><span>Cancel Renewal <i className="fal fa-times-circle"></i></span></Link>
                                    }
                                    <div>&nbsp;</div>
                                </>}
                                {nextLease && nextLease.status == constants.lease_statuses.future.key && <>
                                    <Link to={insightRoutes.leaseShow(nextLease.hash_id)} className="btn btn-bottom btn-red"><span>View/Cancel Renewal</span></Link>
                                    <div>&nbsp;</div>
                                </>}

                                <Link to={insightRoutes.leaseEdit(lease.hash_id)} className="btn btn-bottom btn-red"><span>Details <i className="fal fa-eye"></i></span></Link>

                                {!(nextLease && nextLease.status == constants.lease_statuses.future.key) && !moment(lease.lease_start_on).isSameOrAfter(moment().subtract(maxDaysUntilMoveInCancel, 'days')) && lease.status == constants.lease_statuses.current.key && <>
                                    <div>&nbsp;</div>
                                    <Link to={insightRoutes.leaseMoveOutOrRenew(lease.hash_id)} className="btn btn-bottom btn-red"><span>Renew / Move-Out <i className="fal fa-person-dolly"></i></span></Link>
                                </>}
                            </div>

                        }
                    </>

                }

            </>}
        </div>
    )}

export default LeaseSummaryBlock;

