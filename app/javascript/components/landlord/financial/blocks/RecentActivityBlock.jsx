import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const RecentActivityBlock = ({recentTransactions}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="flex-grid-item">
            <h3>Recent Activity</h3>

            <div className="section-table-wrap section-table-wrap-small">
                <div className="section-table">
                    <div className="st-row st-header">
                        <div className="st-first-col st-col-20"><span className="st-title ">Name</span></div>
                        <span className="st-title st-col-20">Unit</span>
                        <span className="st-title st-col-15">Amount</span>
                        <span className="st-title st-col-20">Method</span>
                        <span className="st-title st-col-15">Date Paid</span>
                        <span className="st-title st-col-15">Status</span>
                    </div>
                    <div className="st-table-scroll">
                        {recentTransactions.map((recentTransaction, i) => (
                            <div key={i} className="st-row-wrap">
                                <div className="st-row">
                                    <div className="st-col-20 st-first-col"><Link to={insightRoutes.leaseShow(recentTransaction.lease_hash_id)}>{recentTransaction.resident_first_name} {recentTransaction.resident_last_name}</Link></div>
                                    <span className="st-col-20">{recentTransaction.property_and_unit}</span>
                                    <span className="st-col-15">{insightUtils.numberToCurrency(-1 * recentTransaction.amount, 2)}</span>
                                    <span className="st-col-20">
                                        {recentTransaction.status == constants.payment_statuses.manual.key ?
                                            <>{recentTransaction.payment_method_extra && <>Check #{recentTransaction.payment_method_extra}</>}</>
                                            :
                                            <>{insightUtils.getLabel(recentTransaction.payment_method, constants.payment_methods)} </>
                                        }
                                    </span>
                                    <span className="st-col-15">{insightUtils.formatDate(recentTransaction.paid_on)}</span>
                                    <span className="st-col-15">{insightUtils.getLabel(recentTransaction.status, constants.payment_statuses)}</span>
                                </div>
                            </div>
                        ))}
                        {recentTransactions && recentTransactions.length == 0 &&
                            <div className="st-row-wrap">
                                <br/>
                                <div className="text-center">No activity within selected date range</div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )}

export default RecentActivityBlock

