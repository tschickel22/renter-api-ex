import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";

const AmountReceivedBlock = ({leaseSummaries, startDate, endDate}) => {

    return (
        <div className="flex-grid-item">
            <h3><a href={insightRoutes.reportRun('amount_received') + "?start_date=" + insightUtils.formatDate(startDate) + "&end_date="+insightUtils.formatDate(endDate)}>Amount Received</a></h3>

            <div className="section-table-wrap section-table-wrap-small">
                <div className="section-table">
                    <div className="st-row st-header">
                        <div className="st-first-col st-col-40"><span className="st-title ">Name</span></div>
                        <span className="st-title st-col-30">Due Date</span>
                        <span className="st-title st-col-30 text-right">Amount</span>
                    </div>
                    <div className="st-table-scroll">
                        {leaseSummaries.filter((leaseSummary) => leaseSummary.paid_amount != 0).map((leaseSummary, i) => (
                            <div key={i} className="st-row-wrap">
                                <div className="st-row">
                                    <div className="st-col-40 st-first-col"><Link to={insightRoutes.leaseShow(leaseSummary.lease_hash_id)}>{leaseSummary.resident_first_name} {leaseSummary.resident_last_name}</Link></div>
                                    <span className="st-col-30">{insightUtils.formatDate(leaseSummary.paid_on)}</span>
                                    <span className="st-col-30 text-right">{insightUtils.numberToCurrency(-1 * leaseSummary.paid_amount, 2)}</span>
                                </div>
                            </div>
                        ))}
                        {leaseSummaries && leaseSummaries.length == 0 &&
                            <div className="st-row-wrap">
                                <br/>
                                <div className="text-center">Nothing received within selected date range</div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )}

export default AmountReceivedBlock

