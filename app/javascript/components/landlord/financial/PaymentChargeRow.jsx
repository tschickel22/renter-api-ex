import React from 'react';

import {Link, useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";


const PaymentChargeRow = ({ledgerItem, index}) => {

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <span className="st-col-25 st-first-col">{insightUtils.formatDate(ledgerItem.transaction_at)}</span>
                    <span className="st-col-30">
                        <>{ledgerItem.description}</>
                    </span>
                    <span className="st-col-15 text-right">{ledgerItem.type == "Charge" ? insightUtils.numberToCurrency(ledgerItem.amount, 2) : null}</span>
                    <span className="st-col-15 text-right">{ledgerItem.type != "Charge" ? insightUtils.numberToCurrency(ledgerItem.amount * -1, 2) : null}</span>
                    <span className="st-col-15 text-right">{insightUtils.numberToCurrency(ledgerItem.balance, 2)}</span>
                    <span className="st-nav-col">&nbsp;</span>
                </div>
            </div>

        </>

    )}

export default PaymentChargeRow;

