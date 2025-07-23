import React from 'react';

import {Link} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import FormItem from "../../shared/FormItem";

const PaymentDueRow = ({leaseSummary, index, mode}) => {

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <span className="st-col-10 st-first-col">{insightUtils.formatDate(leaseSummary.past_due_on)}</span>
                    <span className="st-col-15">
                        <Link to={insightRoutes.leaseShow(leaseSummary.lease_hash_id)}>
                            {leaseSummary.resident_first_name} {leaseSummary.resident_last_name}
                        </Link>
                    </span>
                    <span className="st-col-20">
                        <Link to={insightRoutes.leaseShow(leaseSummary.lease_hash_id)}>
                            {leaseSummary.property_and_unit}
                        </Link>
                    </span>
                    <span className="st-col-10 text-right">{insightUtils.numberToCurrency(leaseSummary.past_amount, 2)}</span>
                    {mode == "manual" && <>
                        <span className="st-col-15 text-right">
                            <FormItem name={"payments.l" + leaseSummary.lease_hash_id + ".amount"} label="" optional={true} mask={insightUtils.currencyMask()} />
                        </span>
                        <span className="st-col-15 text-right">
                            <FormItem name={"payments.l" + leaseSummary.lease_hash_id + ".extra_info"} label="" optional={true} />
                        </span>
                    </>}
                    {mode == "auto" && <span className="st-col-30 text-right">
                        <Link to={insightRoutes.financialPaymentNewAuto(leaseSummary.lease_hash_id, leaseSummary.primary_resident_hash_id)}>Make Payment</Link>
                    </span>}
                    <span className="st-nav-col">&nbsp;</span>
                </div>
            </div>

        </>

    )}

export default PaymentDueRow;

