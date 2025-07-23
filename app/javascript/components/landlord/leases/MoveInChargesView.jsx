import React, {useEffect, useState} from 'react';
import {Link} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";
import store from "../../../app/store";

import {loadChargesAndLedgerItems} from "../../../slices/chargeSlice";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";

const MoveInChargesView = ({lease}) => {

    const { constants } = useSelector((state) => state.company)
    const [chargesAndPayments, setChargesAndPayments] = useState([])

    useEffect(async() => {

        /*
           Load Charges
         */
        const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: lease.hash_id, mode: "move_in"})).unwrap()
        let existingCharges = charge_results.data.charges.filter((charge) => (!charge.proposed))
        let proposedCharges = charge_results.data.charges.filter((charge) => (charge.proposed))
        let payments = charge_results.data.ledger_items.filter((ledgerItem) => (ledgerItem.type == "Payment" || ledgerItem.type == "PaymentReturn"))

        // Show actual charges, then payments, then proposed charges
        setChargesAndPayments(existingCharges.concat(payments).concat(proposedCharges))

    }, [])

    function runSearch(_text, _page) {
        return {total: chargesAndPayments.length, objects: chargesAndPayments}
    }

    function generateTableRow(charge, key) {
        return (
            <div key={key} className="st-row-wrap">
                <div className="st-row">
                    <span className="st-col-25 st-first-col">{charge.description_pretty || charge.description}</span>
                    <span className="st-col-25 text-right">{charge.frequency == constants.charge_frequencies.one_time.key? insightUtils.numberToCurrency(charge.amount, 2) : ''}</span>
                    <span className="st-col-25 text-right">{charge.frequency == constants.charge_frequencies.monthly.key? insightUtils.numberToCurrency(charge.amount, 2) : ''}</span>
                    <span className="st-col-25 text-right">{insightUtils.numberToCurrency(charge.prorated_amount || charge.amount, 2)}</span>
                    <span className="st-nav-col">{(charge.proposed || charge.frequency == "monthly") ? <Link to={insightRoutes.financialChargeEdit(charge.hash_id)} style={{marginLeft: "10px"}}><i className="fa fa-pencil"></i></Link> : <>&nbsp;</>}</span>
                </div>
            </div>
        )
    }



    return (
        <>
            <ListPage
                hideSearch={true}
                titleImage={<></>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                noDataMessage={
                    <div className="st-row-wrap">

                        <div className="st-row">
                            <span className="st-col-100 text-center">No Charges Exist</span>
                        </div>

                        <div className="st-row">
                            <span className="st-col-100 text-center"><Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id, true)} className="btn btn-red">Add Charge</Link></span>
                        </div>
                    </div>
                }
                reloadWhenChanges={chargesAndPayments}
                numberPerPage={100000}
                columns={
                    [
                        {label: "", class: "st-col-25"},
                        {label: "One-Time Charges", class: "st-col-25 text-right"},
                        {label: "Monthly Charges", class: "st-col-25 text-right"},
                        {label: "Due at Move-in", class: "st-col-25 text-right"},
                    ]
                }
                footerRow={chargesAndPayments.length > 0 &&<>
                    <div className="st-row-wrap">

                        <div className="st-row">
                            <span className="st-col-25 st-first-col"></span>
                            <span className="st-col-75 text-right"><strong>Total:</strong> {insightUtils.numberToCurrency(insightUtils.calculateChargesTotal(chargesAndPayments), 2)}</span>
                            <span className="st-nav-col">&nbsp;</span>
                        </div>

                    </div>

                    <br/>

                    <div className="st-col-100 text-center"><Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id, true)} className="btn btn-red">Add Charge</Link></div>
                </>}
            />
        </>

    )}

export default MoveInChargesView;

