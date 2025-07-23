import React from 'react';

import {Link, useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";


const LedgerRow = ({ledgerItem, index, showActionLink, confirmRefund, confirmDelete, handleEdit}) => {

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <span className="st-col-35 st-first-col"><Link to={showActionLink}>{insightUtils.formatDate(ledgerItem.transaction_at)}: {ledgerItem.description}</Link></span>
                    <span className="st-col-15 text-right">{["Charge", "PaymentReturn"].includes(ledgerItem.type) ? insightUtils.numberToCurrency(ledgerItem.amount, 2) : null}</span>
                    <span className="st-col-15 text-right">{!["Charge", "PaymentReturn"].includes(ledgerItem.type) ? insightUtils.numberToCurrency(ledgerItem.amount * -1, 2) : null}</span>
                    <span className="st-col-15 text-right">{insightUtils.numberToCurrency(ledgerItem.balance, 2)}</span>
                    {(confirmRefund || confirmDelete || handleEdit) &&
                        <span className="st-col-20 hidden-md hidden-print text-right">
                            {confirmRefund && ledgerItem.refundable && <>
                                <a onClick={() => {confirmRefund(ledgerItem)}}>Refund</a>
                                {((confirmDelete && ledgerItem.deletable) || (handleEdit && ledgerItem.editable)) && <> | </>}
                            </>}
                            {confirmDelete && ledgerItem.deletable && <>
                                <a onClick={() => {confirmDelete(ledgerItem)}}>Delete</a>
                                {handleEdit && ledgerItem.editable && <> | </>}
                            </>}
                            {handleEdit && ledgerItem.editable && <><a onClick={() => {handleEdit(ledgerItem)}}>Edit</a></>}
                        </span>
                    }
                    <span className="st-nav-col">&nbsp;</span>
                </div>
            </div>

        </>

    )}

export default LedgerRow;

