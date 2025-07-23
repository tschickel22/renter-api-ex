import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import Modal from "../../shared/Modal";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {loadLedgerItemDetails} from "../../../slices/chargeSlice";


const ResidentLedgerDetailPage = ({}) => {

    let navigate = useNavigate()

    let params = useParams();
    const [ledgerItem, setLedgerItem] = useState(null)
    const [charge, setCharge] = useState(null)
    const [payment, setPayment] = useState(null)
    const [paymentReturn, setPaymentReturn] = useState(null)

    useEffect(async() => {

        /*
           Load Ledger Item
         */
        const ledger_item_results = await store.dispatch(loadLedgerItemDetails({leaseId: params.leaseId, ledgerItemId: params.ledgerItemId})).unwrap()
        setLedgerItem(ledger_item_results.data.ledger_item)
        setCharge(ledger_item_results.data.charge)
        setPayment(ledger_item_results.data.payment)
        setPaymentReturn(ledger_item_results.data.payment_return)

    }, []);

    function closeModal() {
        navigate(insightRoutes.residentLedger(params.leaseId))
    }

    return (
        <>
            <Modal extraClassName="overlay-box-small" closeModal={closeModal}>
                {ledgerItem && <div className="section">
                <div className="text-left">
                    {charge && <>
                        <h1>Charge #{charge.hash_id}</h1>
                        <strong>Description:</strong> {charge.description_pretty || charge.description}<br/>
                        <strong>Date:</strong> {insightUtils.formatDate(ledgerItem.transaction_at)}<br/>
                        <strong>Ledger ID:</strong> {ledgerItem.hash_id}<br/>
                        <strong>Amount:</strong> {insightUtils.numberToCurrency(ledgerItem.amount, 2)}<br/>
                        <strong>Frequency: {charge.frequency}</strong>
                    </>}

                    {payment && <>
                        <h1>Payment #{payment.hash_id}</h1>
                        <strong>Date:</strong> {insightUtils.formatDate(ledgerItem.transaction_at)}<br/>
                        <strong>Ledger ID:</strong> {ledgerItem.hash_id}<br/>
                        <strong>Amount:</strong> {insightUtils.numberToCurrency(payment.amount, 2)}<br/>

                        {payment.status == "manual" ?
                            <>
                                <strong>Method: </strong> Paper Check<br/>
                                {payment.extra_info && <><strong>Check #: </strong> {payment.extra_info}<br/></>}
                            </>
                            :
                            <>
                                {payment.fee_responsibility == "resident" && <><strong>Fee:</strong> {insightUtils.numberToCurrency(payment.fee, 2)}<br/></>}
                                {payment.external_id && <><strong>Processor #: </strong> {payment.external_id}<br/></>}
                                {payment.payment_method && <>
                                    <strong>Method: </strong> {payment.payment_method.nickname}<br/>
                                    <strong>Name: </strong> {payment.payment_method.billing_first_name} {payment.payment_method.billing_last_name}<br/>
                                    <strong>Street: </strong> {payment.payment_method.billing_street}<br/>
                                    <strong>City: </strong> {payment.payment_method.billing_city}<br/>
                                    <strong>State: </strong> {payment.payment_method.billing_state}<br/>
                                    <strong>Zip: </strong> {payment.payment_method.billing_zip}<br/>
                                </>}
                            </>
                        }
                    </>}

                    {paymentReturn && <>
                        <h1>Payment Return #{paymentReturn.hash_id}</h1>
                        <strong>Date:</strong> {insightUtils.formatDate(ledgerItem.transaction_at)}<br/>
                        <strong>Ledger ID:</strong> {ledgerItem.hash_id}<br/>
                        <strong>Amount:</strong> {insightUtils.numberToCurrency(paymentReturn.amount, 2)}<br/>
                        <strong>Reason:</strong> {paymentReturn.return_reason}<br/>

                    </>}

                    <div className="form-nav">
                        <a onClick={closeModal} className="btn btn-gray"><span>Close</span></a>
                    </div>
                    </div>
                </div>
                }
            </Modal>
        </>
    )}

export default ResidentLedgerDetailPage;
