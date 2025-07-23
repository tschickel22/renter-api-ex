import React, {useEffect, useState} from 'react';

import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {loadApplicationFee} from "../../../slices/paymentSlice";
import insightUtils from "../../../app/insightUtils";
import Modal from "../../shared/Modal";

const LeaseApplicationSubmittedPage = ({baseLeaseResident}) => {

    const [payment, setPayment] = useState(null)
    const [printingReceipt, setPrintingReceipt] = useState(false)

    useEffect(async() => {
        const results = await store.dispatch(loadApplicationFee({leaseResidentId: baseLeaseResident.hash_id})).unwrap()
console.log(results)
        if (results.data && results.data.payment) {
            setPayment(results.data.payment)
        }
    }, [])

    async function handlePrint() {
        await setPrintingReceipt(true)

        setTimeout(() => {window.print()}, 500)
    }

    return (
        <>

            <div className="section-table-wrap">
                <div className="add-property-wrap">

                    {baseLeaseResident.current_step == 'submitted' && <h2>Application Submitted</h2>}
                    {baseLeaseResident.current_step == 'screening_in_progress' && <h2>Screening In Progress</h2>}
                    {baseLeaseResident.current_step == 'screening_complete' && <h2>Screening Complete!</h2>}
                    {baseLeaseResident.current_step == 'screening_error' && <h2>Screening Error</h2>}
                    <hr />

                    <p>Your application has been submitted. The property owner will review your application and get back to you. You can view your reports in the <Link to={insightRoutes.renterPortal()}>Portal</Link>.</p>

                    {payment &&
                        <p>
                            This is your receipt for your Rental Application.<br/>
                            <strong>Receipt ID:</strong> {payment.hash_id}<br/>
                            <strong>Payment Date:</strong> {insightUtils.formatDate(payment.payment_at)}<br/>
                            <strong>Paid By:</strong> {payment.payment_method.nickname}<br/>
                            <strong>Amount:</strong> {insightUtils.numberToCurrency(payment.amount, 2)}
                        </p>
                    }

                    <div className="flex-row flex-right">
                        {payment && <><a onClick={() => handlePrint()} className="btn btn-gray">Print Receipt</a>&nbsp;</>}
                        <Link to={insightRoutes.renterPortal()} className="btn btn-red">Done</Link>
                    </div>

                </div>
            </div>

            {payment && printingReceipt &&
                <Modal closeModal={() => setPrintingReceipt(false)}>
                    <h1>Receipt</h1>
                    <p>
                        This is your receipt for your Rental Application.<br/>
                        <strong>Receipt ID:</strong> {payment.hash_id}<br/>
                        <strong>Payment Date:</strong> {insightUtils.formatDate(payment.payment_at)}<br/>
                        <strong>Paid By:</strong> {payment.payment_method.nickname}<br/>
                        <strong>Amount:</strong> {insightUtils.numberToCurrency(payment.amount, 2)}
                    </p>
                </Modal>
            }
        </>

    )}

export default LeaseApplicationSubmittedPage;

