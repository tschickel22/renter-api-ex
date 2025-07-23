import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'

import {Form, Formik} from "formik";

import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {cancelMoveIn, loadLease, saveLease} from "../../../slices/leaseSlice";
import {loadChargesAndLedgerItems} from "../../../slices/chargeSlice";

const LeaseCancelMoveInPage = ({}) => {
    let params = useParams();
    let navigate = useNavigate()

    const { settings, properties } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [lease, setLease] = useState(null)
    const [payments, setPayments] = useState([])

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(async () => {

        /*
           Load Lease
         */
        if (!lease) {

            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            if (results.data.success) {
                let newLease = Object.assign({}, results.data.lease)

                /*
                    Load Charges
                */
                const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: newLease.hash_id})).unwrap()
                setPayments(charge_results.data.ledger_items.filter((ledger_item) => ledger_item.refundable && ledger_item.type == "Payment"))

                setLease(newLease)
            }
            else {
                // Error!
                setBaseErrors("Unable to load lease. Please try again.")
            }
        }

    }, []);

    function closeView() {
        navigate(insightRoutes.leaseShow(lease.hash_id))
    }

    return (
        <>
        {currentSettings && property && lease &&
        <div className="section">

            <h2>Cancel {!lease.previous_lease_id ? "Move-in" : "Renewal"} for {property.name}: {lease.unit.unit_number}</h2>
            <p className="text-center">Use this form to cancel {!lease.previous_lease_id ? "move-in" : "renewal"} for this lease.</p>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={lease}
                onSubmit={async(values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    let payments_to_refund = []

                    // Push payment IDs
                    payments.forEach((payment, i) => {
                        if (values["refund_payment_" + payment.hash_id]) {
                            payments_to_refund.push(payment.hash_id)
                        }
                    })

                    try {

                        const results = await store.dispatch(cancelMoveIn({leaseId: lease.hash_id, paymentsToRefund: payments_to_refund})).unwrap()

                        console.log(results.data)
                        setSubmitting(false);

                        if (results.data.success) {
                            if (lease.previous_lease_id) {
                                navigate(insightRoutes.residentListForProperty(lease.property_id))
                            }
                            else {
                                closeView()
                            }

                        }
                        else if (results.data.errors) {
                            setErrors(results.data.errors)

                            if (results.data.errors.base) {
                                setBaseErrorMessage(results.data.errors.base)
                            }

                            insightUtils.scrollTo('errors')
                        }
                    }
                    catch {
                        // Error!
                        setBaseErrorMessage("Unable to cancel move-in")
                        setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, values, setFieldValue }) => (
                    <Form>
                        <div className="add-property-wrap">
                            <div>
                                <h3>Refunds</h3>
                            </div>

                            {payments && payments.length > 0 ?
                                <>
                                    <p className="text-center">Indicate which fees you want to refund below:</p>
                                    <div className="section-table-wrap" style={{maxWidth: "700px", margin: "0 auto"}}>
                                        <div className="section-table">
                                            <div className="st-row st-header">
                                                <div className="st-first-col st-col-75"><span className="st-title">Payment</span></div>
                                                <span className="st-title st-col-25 text-right">Amount</span>
                                                <span className="st-nav-col"></span>
                                            </div>
                                            <div className="st-table-scroll">
                                                {payments.map((payment, i) => {
                                                    return (
                                                        <div key={i} className="st-row-wrap">
                                                            <div className="st-row">
                                                                <span className="st-col-75 st-first-col">
                                                                    <FormItem label={payment.description} name={"refund_payment_" + payment.hash_id} type="checkbox" optional={true} />
                                                                </span>
                                                                <span className="st-col-25 text-right">{insightUtils.numberToCurrency(Math.abs(payment.amount), 2)}</span>
                                                                <span className="st-nav-col">&nbsp;</span>
                                                            </div>
                                                        </div>)
                                                })}
                                            </div>
                                        </div>
                                    </div>


                                </>
                                :
                                <p className="text-center">There are no refundable payments for this lease.</p>
                            }

                            <div className="form-nav">
                                <a onClick={closeView} className="btn btn-gray"><span>Cancel</span></a>
                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? (!lease.previous_lease_id ? "Cancel Move-In" : "Cancel Renewal") : "Cancelling..."}</span></button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
        }
        </>
    )}

export default LeaseCancelMoveInPage;

