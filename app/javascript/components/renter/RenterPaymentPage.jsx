import React, {useState, useEffect} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";

import FormItem from "../shared/FormItem";
import insightUtils from "../../app/insightUtils";
import store from "../../app/store";

import BasicDropdown from "../shared/BasicDropdown";
import DatePicker from "react-datepicker";
import {loadLeaseResident, searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import insightRoutes from "../../app/insightRoutes";
import PaymentMethodForm from "../shared/PaymentMethodForm";
import {loadResidentPaymentMethods, makePayment, saveResidentPaymentMethod, signUpForRecurringPayments} from "../../slices/paymentSlice";
import {loadChargesAndLedgerItems} from "../../slices/chargeSlice";
import RenterPaymentStartView from "./RenterPaymentStartView";
import RenterStatusBlock from "./RenterStatusBlock";
import {loadLease} from "../../slices/leaseSlice";
import {displayAlertMessage} from "../../slices/dashboardSlice";
import PaymentScheduleView from "../landlord/financial/PaymentScheduleView";
import {useSelector} from "react-redux";

const RenterPaymentPage = ({paymentAction}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { constants, settings, properties } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [residentPaymentMethods, setResidentPaymentMethods] = useState(null)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [completedPayment, setCompletedPayment] = useState(null)

    const [isPayingNow, setIsPayingNow] = useState(false)

    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(async ()  => {

        const leaseResults = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
        setLease(leaseResults.data.lease)

        const results = await store.dispatch(loadLeaseResident({leaseResidentId: params.leaseResidentId})).unwrap()
        let newLeaseResident = Object.assign(insightUtils.emptyPaymentMethod(), results.data.lease_resident)
        if (newLeaseResident.recurring_payment_starts_on) newLeaseResident.recurring_payment_starts_on = insightUtils.parseDate(newLeaseResident.recurring_payment_starts_on)
        if (!newLeaseResident.recurring_payment_day_of_week) newLeaseResident.recurring_payment_day_of_week = ""

        const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: params.leaseId, mode: "open"})).unwrap()

        // Make the total due the default amount
        if (charge_results.data.ledger_items.length > 0) {
            newLeaseResident.amount = insightUtils.numberToCurrency(charge_results.data.ledger_items[charge_results.data.ledger_items.length - 1].balance, 2)
        }

        const payment_method_results = await store.dispatch(loadResidentPaymentMethods({leaseResidentId: newLeaseResident.hash_id})).unwrap()
        setResidentPaymentMethods(payment_method_results.data.resident_payment_methods)

        setLeaseResident(newLeaseResident)
    }, []);

    function closeModal() {
        navigate(insightRoutes.renterLeaseShow(params.leaseId))
    }

    return (
        <>
        {lease && leaseResident && <div className="section">

            {!isPayingNow && residentPaymentMethods.length == 0 ?
                <RenterPaymentStartView setIsPayingNow={setIsPayingNow} />
                :
                <>
                    <RenterStatusBlock lease={lease} leaseResident={leaseResident} title="Payments" />

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}<br/></div>}

            {!completedPayment && <Formik
                initialValues={leaseResident}
                onSubmit={async (values, { setSubmitting, setErrors, setFieldValue }) => {
                    setBaseErrorMessage("")

                    let results = null
                    let response = null

                    try {
                        let newTab = null

                        let residentPaymentMethodId = null

                        if (!values.recurring_payment_method_id || values.recurring_payment_method_id.length == 0) {
                            setBaseErrorMessage("Select a payment method")
                            insightUtils.scrollTo('errors')
                            return
                        }
                        else {
                            residentPaymentMethodId = values.recurring_payment_method_id
                        }

                        const paymentMethod = residentPaymentMethods.find((pm) => pm.id == residentPaymentMethodId)

                        // Create blank tab so that the later pop-up blocker doesn't get us
                        if (residentPaymentMethodId == "new_cash" || paymentMethod?.method == "cash") {
                            newTab = window.open('', '_blank');
                        }

                        if (residentPaymentMethodId.toString().indexOf("new") >= 0) {
                            values.method = residentPaymentMethodId.replace("new_", "")
                            values.billing_agreement = true

                            // Make sure we don't confuse saveResidentPaymentMethod
                            let newValues = Object.assign({}, values)
                            newValues.id = null
                            newValues.hash_id = null

                            results = await store.dispatch(saveResidentPaymentMethod({residentPaymentMethod: newValues, leaseResidentId: values.hash_id})).unwrap()
                            response = results.data

                            console.log(response)

                            if (response.success) {
                                residentPaymentMethodId = response.resident_payment_method.id
                                let newResidentPaymentMethods = Array.from(residentPaymentMethods)
                                newResidentPaymentMethods.push(response.resident_payment_method)
                                setResidentPaymentMethods(newResidentPaymentMethods)

                                setFieldValue('recurring_payment_method_id', residentPaymentMethodId)

                                // Is this cash? Then no need to go further
                                if (response.resident_payment_method.method == "cash") {
                                    newTab.location.href = insightRoutes.cashPayCoupon(values.hash_id);

                                    return true
                                }

                            } else if (response.errors) {
                                setErrors(response.errors)

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base)
                                }

                                insightUtils.scrollTo('errors')

                                return
                            }
                        }

                        if (paymentAction == "recurring") {
                            results = await store.dispatch(signUpForRecurringPayments({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: values.hash_id, recurringPaymentFrequency: values.recurring_payment_frequency, recurringPaymentDayOfWeek: values.recurring_payment_day_of_week, recurringPaymentStartsOn: values.recurring_payment_starts_on})).unwrap()
                            response = results.data

                            if(response.success) {
                                store.dispatch(displayAlertMessage({message: "Your Autopay details have been updated."}))
                                closeModal()
                            }
                        }
                        else if (paymentAction == "one_time") {

                            // If this is a cash txn, just redirect to the Bill Pay Coupon
                            if (paymentMethod && paymentMethod.method == "cash") {
                                newTab.location.href = insightRoutes.cashPayCoupon(values.hash_id);
                                return true
                            }
                            else {
                                results = await store.dispatch(makePayment({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: values.hash_id, amount: values.amount})).unwrap()
                                response = results.data

                                if (response.success) {
                                    setCompletedPayment(response.payment)
                                }
                            }
                        }


                        console.log(response)

                        setSubmitting(false)

                        if (response.success) {
                            // Handled above
                        }
                        else if (response.errors) {
                            setErrors(response.errors)

                            if (response.errors.base) {
                                setBaseErrorMessage(response.errors.base)
                            }

                            insightUtils.scrollTo('errors')
                        }
                    }
                    catch(err) {
                        console.log("UH-OH", err)
                        setBaseErrorMessage("Unable to save payments")
                        setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, values, setFieldValue }) => (
                    <Form>
                        <div className="add-property-wrap">

                            {paymentAction == "one_time" && <>
                                {lease.status != constants.lease_statuses.former.key &&
                                    <div className="well">
                                        <p className="text-center">Use our super-helpful Autopay feature. Just enter your payment details once and we'll handle the rest!</p>
                                        <br/>
                                        <Link to={insightRoutes.renterRecurringPaymentEdit(lease.hash_id, leaseResident.hash_id)} className="btn btn-red">Enroll in Autopay</Link>
                                        <br/>
                                        <br/>
                                    </div>
                                }
                                <h1>Make Payment</h1>
                            </>
                            }

                            {paymentAction == "recurring" &&
                                <>
                                    <h1>Autopay</h1>

                                    <div className="form-row form-center">
                                        <div className="st-col-33">
                                            <FormItem label="Frequency" name="recurring_payment_frequency">
                                                <BasicDropdown name="recurring_payment_frequency" options={[{id: constants.recurring_payment_frequencies.none.key, name: "Turn Auto-Pay Off"}, {id: constants.recurring_payment_frequencies.weekly.key, name: "Weekly (25% Amount Due)"}, {id: constants.recurring_payment_frequencies.biweekly.key, name: "Bi-Weekly (50% Amount Due)"}, {id: constants.recurring_payment_frequencies.monthly.key, name: "Monthly (Amount Due)"}]} />
                                            </FormItem>
                                        </div>

                                        {(values.recurring_payment_frequency == constants.recurring_payment_frequencies.weekly.key || values.recurring_payment_frequency == constants.recurring_payment_frequencies.biweekly.key) &&
                                            <div className="st-col-33">
                                                <FormItem label="Day of week" name="recurring_payment_day_of_week">
                                                    <BasicDropdown name="recurring_payment_day_of_week" options={[{id: 1, name: "Monday"}, {id: 2, name: "Tuesday"}, {id: 3, name: "Wednesday"}, {id: 4, name: "Thursday"}, {id: 5, name: "Friday"}, {id: 6, name: "Saturday"}]} />
                                                </FormItem>
                                            </div>
                                        }
                                    </div>

                                    <PaymentScheduleView leaseResident={values} leaseResidentHashId={values.hash_id} numberOfPayments={11} noDataMessage="Select your AutoPay preferences above" />

                                </>
                            }

                            {residentPaymentMethods && <>
                                <div className="form-row form-center">
                                    <div className="st-col-100">
                                        <PaymentMethodForm property={property} title="Payment Method" existingPaymentMethods={residentPaymentMethods} excludeCash={paymentAction != "one_time"} paymentMethodIdName="recurring_payment_method_id" methodTypeLabel={"Select Payment Method"} showFees={true} />
                                    </div>
                                </div>
                            </>}

                            {paymentAction == "one_time" ?
                                <>
                                <div className="form-row form-center">
                                    <div className="st-col-33">
                                        {(currentSettings.allow_partial_payments || [constants.lease_statuses.future.key, constants.lease_statuses.former.key].indexOf(lease.status) >= 0) ?
                                            <FormItem label="Enter payment amount" name="amount" mask={insightUtils.currencyMask()}/>
                                            :
                                            <FormItem label="Enter payment amount" name="amount">
                                                <div className="text-left">{insightUtils.numberToCurrency(lease.ledger_balance, 2)}</div>
                                            </FormItem>
                                        }
                                    </div>
                                </div>

                                {insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, values.amount) > 0 &&
                                    <div className="form-row form-center">
                                        <div className="st-col-33">
                                            The total payment will include {insightUtils.numberToCurrency(insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, values.amount), 2)} in fees.
                                        </div>
                                    </div>
                                }
                            </>
                            :
                            <>
                                {parseFloat(insightUtils.clearNonNumerics(leaseResident.amount)) > 0 ? <>
                                    {insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, leaseResident.amount) > 0 &&
                                    <div className="form-row form-center">
                                        <div className="st-col-33">
                                            The total payment will include {insightUtils.numberToCurrency(insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, leaseResident.amount), 2)} in fees.
                                        </div>
                                    </div>
                                    }
                                </> : <>
                                    {insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, lease.rent) > 0 &&
                                        <div className="form-row form-center">
                                            <div className="st-col-33">
                                            The total payment will include {insightUtils.numberToCurrency(insightUtils.calculateFeesForResident(currentSettings, residentPaymentMethods, values.recurring_payment_method_id, lease.rent), 2)} in fees. Projected based on {insightUtils.numberToCurrency(lease.rent)} monthly rent.
                                            </div>
                                        </div>
                                    }
                                </>}
                            </>
                            }

                            <div className="form-row">
                                <div className="st-col-100">
                                    <p className="text-center"><strong>NSF Fee</strong>: You agree we may charge you a service charge of {insightUtils.numberToCurrency(currentSettings.nsf_fee, 2)} for handling any dishonored payment instrument {currentSettings.charge_residents_nsf_and_late_fee ? " in addition to any late fees assessed" : ""}.</p>
                                </div>
                            </div>

                            <div className="form-nav">
                                <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>}

            {completedPayment &&
                <div className="flex-row flex-center">
                    <div className="text-left st-col-33 st-col-md-100">
                        <h1>Payment #{completedPayment.hash_id}</h1>
                        <strong>Date:</strong> {insightUtils.formatDate(completedPayment.payment_at)}<br/>
                        <strong>Amount:</strong> {insightUtils.numberToCurrency(completedPayment.amount, 2)}<br/>

                        {completedPayment.fee_responsibility == "resident" && <><strong>Fee:</strong> {insightUtils.numberToCurrency(completedPayment.fee, 2)}<br/></>}
                        {completedPayment.external_id && <><strong>Processor #: </strong> {completedPayment.external_id}<br/></>}
                        {completedPayment.payment_method && <>
                            <strong>Method: </strong> {completedPayment.payment_method.nickname}<br/>
                            <strong>Name: </strong> {completedPayment.payment_method.billing_first_name} {completedPayment.payment_method.billing_last_name}<br/>
                            <strong>Street: </strong> {completedPayment.payment_method.billing_street}<br/>
                            <strong>City: </strong> {completedPayment.payment_method.billing_city}<br/>
                            <strong>State: </strong> {completedPayment.payment_method.billing_state}<br/>
                            <strong>Zip: </strong> {completedPayment.payment_method.billing_zip}<br/>
                        </>}

                        <div className="form-nav">
                            <a onClick={closeModal} className="btn btn-red"><span>Close</span></a>
                        </div>
                    </div>
                </div>
                }
            </>}
        </div>
        }
        </>
    )}

export default RenterPaymentPage;

