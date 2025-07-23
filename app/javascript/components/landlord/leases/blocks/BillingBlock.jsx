import React, {useEffect, useState} from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {loadLease} from "../../../../slices/leaseSlice";
import {loadChargesAndLedgerItems} from "../../../../slices/chargeSlice";
import insightRoutes from "../../../../app/insightRoutes";
import {Link, useNavigate} from "react-router-dom";

const BillingBlock = ({lease}) => {

    const { constants } = useSelector((state) => state.company)

    const [monthlyCharges, setMonthlyCharges] = useState(null)

    useEffect(async() => {

        /*
           Load Charges
         */
        const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: lease.hash_id})).unwrap()

        setMonthlyCharges(charge_results.data.charges.filter((charge) => (charge.frequency == constants.charge_frequencies.monthly.key)))

    }, []);



    return (
        <div className="flex-grid-item">
            <div className="flex-line-block flex-hero-block">
                {false && <img className="img-responsive flex-img-hero" src="/images/property-photo-01.jpg"/>}
                <h3>Scheduled Billing</h3>
            </div>
            {monthlyCharges && <>
                <div className="flex-line flex-line-lg"><strong>{insightUtils.numberToCurrency(insightUtils.calculateChargesTotal(monthlyCharges))}</strong>/month</div>
                <div className="flex-line-block">
                    {monthlyCharges.map((charge, i) => {
                        return (<Link key={i} to={insightRoutes.financialChargeEdit(charge.hash_id)} className="flex-line"><i className="fal fa-pencil"></i> <strong className="rd-item">{charge.description_pretty || charge.description}</strong> {insightUtils.numberToCurrency(charge.amount)}</Link>)
                    })}
                </div>
            </>}
            <div className="spacer"></div>

            <div className="flex-column flex-center btn-bottom">
                <Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id)} className="btn btn-red"><span>Add Charge <i className="fal fa-plus"></i></span></Link>
                {lease.ledger_balance > 0 &&
                    <>
                        <div>&nbsp;</div>
                        <Link to={insightRoutes.financialPaymentNewChoose(lease.hash_id, lease.primary_resident.hash_id)} className="btn btn-red"><span>Make Payment  <i className="fal fa-dollar-circle"></i></span></Link>
                    </>
                }
            </div>
        </div>
    )}

export default BillingBlock;

