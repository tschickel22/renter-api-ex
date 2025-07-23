import React, {useEffect, useState} from 'react';
import store from "../../../app/store";
import {useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {loadExpensePayment, voidExpensePayment} from "../../../slices/paymentSlice";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import insightUtils from "../../../app/insightUtils";

const ExpensePaymentVoidPage = () => {

    let params = useParams();
    let navigate = useNavigate()

    const { currentUser }= useSelector((state) => state.user)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [payment, setPayment] = useState(null)

    useEffect(async() => {
        const results = await store.dispatch(loadExpensePayment({paymentHashId: params.paymentId})).unwrap()
        console.log(results)
        setPayment(results.data.expense_payment)
    }, [])

    async function voidPayment() {
        try {
            const results = await store.dispatch(voidExpensePayment({paymentHashId: payment.hash_id})).unwrap()
            console.log(results)
            if (results.data.success) {
                closeView()
            } else {
                setBaseErrorMessage(results.data.errors?.base)
            }
        }
        catch (e) {
            setBaseErrorMessage("Could not void payment. Please contact Support.")
        }
    }

    function closeView() {
        history.back()
    }

    return (
        <>
            {currentUser.expenses_edit && payment && <div className="section">

                <h2>Void Payment</h2>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <div className="add-property-wrap" style={{maxWidth: "500px", margin: "0 auto"}}>

                    <div className="form-row form-center">
                        <div className="form-item form-item-50">
                            <label>Vendor</label>
                            <div className="form-value">{payment.expense.vendor_name}</div>
                        </div>
                        <div className="form-item form-item-50">
                            <label>Date Paid</label>
                            <div className="form-value">{insightUtils.formatDate(payment.payment_at)}</div>
                        </div>
                    </div>
                    <div className="form-row form-center">
                        <div className="form-item form-item-50">
                            <label>Payment Method</label>
                            <div className="form-value">{payment.expense_payment_status_pretty}</div>
                        </div>
                        <div className="form-item form-item-50">
                            <label>Amount</label>
                            <div className="form-value">{insightUtils.numberToCurrency(payment.amount, 2)}</div>
                        </div>
                    </div>
                    <div className="form-row form-center">
                        <div className="form-item form-item-50">
                            <label>Invoice Number</label>
                            <div className="form-value">Invoice #{payment.expense.invoice_number}</div>
                        </div>
                        <div className="form-item form-item-50">
                        </div>
                    </div>
                    <p>Are you sure you want to void this payment?</p>
                    <div className="form-nav">
                        <a onClick={closeView} className="btn btn-gray"><span>Back</span></a>
                        <a onClick={voidPayment} className="btn btn-red"><span>Void Payment</span></a>
                    </div>
                </div>

            </div>}
        </>

    )
}

export default ExpensePaymentVoidPage;

