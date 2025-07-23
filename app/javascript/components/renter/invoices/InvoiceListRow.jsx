import React from 'react';
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const InvoiceListRow = ({invoice}) => {

    const { currentUser } = useSelector((state) => state.user)

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-50 st-first-col">
                        {insightUtils.isResident(currentUser) ?
                            <Link to={insightRoutes.renterInvoiceShow(invoice.lease_hash_id, invoice.hash_id)}>{invoice.name}</Link>
                            :
                            <Link to={insightRoutes.residentInvoiceShow(invoice.lease_hash_id, invoice.hash_id)}>{invoice.name}</Link>
                        }
                    </div>
                    <div className="st-col-50 text-right">
                        {insightUtils.numberToCurrency(invoice.amount, 2)}
                    </div>
                    <span className="st-nav-col">

                    </span>
                </div>
            </div>

        </>

    )}

export default InvoiceListRow;

