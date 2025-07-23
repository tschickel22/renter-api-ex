import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Form, Formik} from "formik";
import store from "../../../app/store";

import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {loadResidentPaymentMethods, makePayment, savePayments, saveResidentPaymentMethod, signUpForRecurringPayments} from "../../../slices/paymentSlice";
import ListPage from "../../shared/ListPage";
import PaymentChargeRow from "./PaymentChargeRow";
import {loadChargesAndLedgerItems} from "../../../slices/chargeSlice";
import PaymentMethodForm from "../../shared/PaymentMethodForm";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import DatePicker from "react-datepicker";
import {loadLease} from "../../../slices/leaseSlice";
import PaymentScheduleView from "./PaymentScheduleView";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import ToolTip from "../../shared/ToolTip";
import {useSelector} from "react-redux";

const PaymentNewPage = ({}) => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { currentUser } = useSelector((state) => state.user)
    const { constants, settings, properties } = useSelector((state) => state.company)

    const [formikValues, setFormikValues] = useState({})
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    const [property, setProperty] = useState(null)
    const [leaseResidents, setLeaseResidents] = useState(null)
    const [residentPaymentMethods, setResidentPaymentMethods] = useState(null)
    const [initialFormValues, setInitialFormValues] = useState(null)
    const [openLedgerItems, setOpenLedgerItems] = useState(null)
    const [futureLedgerItems, setFutureLedgerItems] = useState(null)
    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(async () => {
        if (properties && !property) {
            let initialFormValues = {"amount": "", "extra_info": "", "billing_first_name": "", "billing_last_name": "", "billing_street": "", "billing_city": "", "billing_state": "", "billing_zip": "", "credit_card_number": "", "credit_card_expires_on": "", "credit_card_cvv": "", "payment_action": "", "recurring_payment_frequency": "", "recurring_payment_starts_on": ""}
            const lease_results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
            const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: params.leaseId, mode: "open"})).unwrap()

            const allLeaseResidents = insightUtils.extractLeaseResidents(lease_results.data.lease)
            const leaseResidentOptions = allLeaseResidents.map((leaseResident) => {
                return {id: leaseResident.hash_id, name: leaseResident.resident.first_name + " " + leaseResident.resident.last_name}
            })

            setProperty(insightUtils.getCurrentProperty(properties, {propertyId: lease_results.data.lease.property_id}))

            // Auto-select the primary resident
            let selectedLeaseResident = null

            if (allLeaseResidents.length == 1) {
                selectedLeaseResident = allLeaseResidents[0]
            } else if (params.leaseResidentId) {
                selectedLeaseResident = allLeaseResidents.find((leaseResident) => (leaseResident.hash_id == params.leaseResidentId))
            }

            if (selectedLeaseResident) {
                initialFormValues.lease_resident_id = selectedLeaseResident.hash_id
                initialFormValues.recurring_payment_frequency = selectedLeaseResident.recurring_payment_frequency
                initialFormValues.recurring_payment_starts_on = insightUtils.parseDate(selectedLeaseResident.recurring_payment_starts_on)
                initialFormValues.recurring_payment_method_id = selectedLeaseResident.recurring_payment_method_id

                if (selectedLeaseResident.recurring_payment_frequency && selectedLeaseResident.recurring_payment_frequency != "none") initialFormValues.payment_action = "recurring"
            }

            initialFormValues.payment_on = new Date()

            // Make the total due the default amount
            if (charge_results.data.ledger_items.length > 0) {
                initialFormValues.amount = insightUtils.numberToCurrency(charge_results.data.ledger_items[charge_results.data.ledger_items.length - 1].balance, 2)
            }

            initialFormValues.mode = params.mode

            setLeaseResidents(leaseResidentOptions)
            setOpenLedgerItems(charge_results.data.ledger_items.reverse())
            setFutureLedgerItems(charge_results.data.future_ledger_items)
            setInitialFormValues(initialFormValues)
        }
    }, [properties])

    useEffect(() => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(async () => {
        if (formikValues.lease_resident_id) {
            const payment_method_results = await store.dispatch(loadResidentPaymentMethods({leaseResidentId: formikValues.lease_resident_id})).unwrap()
            console.log(payment_method_results)
            setResidentPaymentMethods(payment_method_results.data.resident_payment_methods)
        }

    }, [formikValues.lease_resident_id])

    function runOpenSearch(_text, _page) {
        return {total: openLedgerItems.length, objects: openLedgerItems}
    }

    function runFutureSearch(_text, _page) {
        return {total: futureLedgerItems.length, objects: futureLedgerItems}
    }

    function generateTableRow(ledgerItem, key) {
        return (<PaymentChargeRow key={key} index={key} ledgerItem={ledgerItem} />)
    }

    function closeView() {
        if (location.state && location.state.return_url) {
            navigate(location.state.return_url)
        }
        else {
            navigate(insightRoutes.financialSummary())
        }
    }

    return (
        <>

            {initialFormValues && currentUser.payments_edit && <div className="section">
                <ListPage
                    title="Make Payment"
                    hideSearch={true}
                    titleImage={<></>}
                    runSearch={runOpenSearch}
                    generateTableRow={generateTableRow}
                    noDataMessage="No open charges exist"
                    columns={
                        [
                            {label: "Due Date", class: "st-col-25", sort_by: "past_due_on"},
                            {label: "Description", class: "st-col-30", sort_by: "charge_description"},
                            {label: "Charges", class: "st-col-15 text-right", sort_by: "past_due"},
                            {label: "Payments", class: "st-col-15 text-right", sort_by: "past_due"},
                            {label: "Balance", class: "st-col-15 text-right", sort_by: "past_due"},
                        ]
                    }
                    footerRow={
                        openLedgerItems.length > 0 &&
                        <div className="st-row-wrap">
                            <div className="st-row">
                                <span className="st-col-25 st-first-col"></span>
                                <span className="st-col-30 text-right"><strong>Total:</strong></span>
                                <span className="st-col-45 text-right">{insightUtils.numberToCurrency(openLedgerItems[0].balance, 2)}</span>
                                <span className="st-nav-col">&nbsp;</span>
                            </div>
                        </div>
                    }
                />

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={initialFormValues}
                    innerRef={(formikActions) => (formikActions ? setFormikValues(formikActions.values) : setFormikValues({}))}
                    onSubmit={async (values, { setSubmitting, setErrors, setFieldValue }) => {

                        setBaseErrorMessage("")

                        let results = null
                        let response = null

                        try {

                            if (values.mode == "goto_cash") {
                                window.document.location.href = insightRoutes.cashPayCoupon(values.lease_resident_id)
                                return true
                            }
                            else if (values.mode == "auto") {
                                if (values.payment_action != "recurring" && values.payment_action != "one_time") {
                                    setBaseErrorMessage("Select Payment Frequency")
                                    insightUtils.scrollTo('errors')
                                    return
                                }

                                let residentPaymentMethodId = null

                                if (!values.resident_payment_method_id || values.resident_payment_method_id.length == 0) {
                                    setBaseErrorMessage("Select a payment method")
                                    insightUtils.scrollTo('errors')
                                    return
                                }
                                else {
                                    residentPaymentMethodId = values.resident_payment_method_id
                                }


                                if (residentPaymentMethodId.indexOf("new") >= 0) {
                                    values.method = residentPaymentMethodId.replace("new_", "")
                                    values.billing_agreement = true
                                    results = await store.dispatch(saveResidentPaymentMethod({residentPaymentMethod: values, leaseResidentId: values.lease_resident_id})).unwrap()
                                    response = results.data

                                    console.log(response)

                                    if (response.success) {
                                        residentPaymentMethodId = response.resident_payment_method.id
                                        let newResidentPaymentMethods = Array.from(residentPaymentMethods)
                                        newResidentPaymentMethods.push(response.resident_payment_method)
                                        setResidentPaymentMethods(newResidentPaymentMethods)

                                        setFieldValue('resident_payment_method_id', residentPaymentMethodId)

                                    }
                                    else if (response.errors) {
                                        setErrors(response.errors)

                                        if (response.errors.base) {
                                            setBaseErrorMessage(response.errors.base)
                                        }

                                        insightUtils.scrollTo('errors')
                                        setSubmitting(false)
                                        return
                                    }
                                }

                                if (values.payment_action == "recurring") {
                                    results = await store.dispatch(signUpForRecurringPayments({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: values.lease_resident_id, recurringPaymentFrequency: values.recurring_payment_frequency, recurringPaymentDayOfWeek: values.recurring_payment_day_of_week, recurringPaymentStartsOn: values.recurring_payment_starts_on})).unwrap()
                                } else if (values.payment_action == "one_time") {
                                    results = await store.dispatch(makePayment({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: values.lease_resident_id, amount: values.amount})).unwrap()
                                }
                            }
                            else if (values.mode == "manual") {
                                results = await store.dispatch(savePayments({manualPaymentOn: values.payment_on, payments: [{lease_hash_id: params.leaseId, amount: values.amount, extra_info: values.extra_info}]})).unwrap()
                            }
                            else {
                                setBaseErrorMessage("Please select a payment method")
                                setSubmitting(false)
                                return
                            }

                            response = results.data

                            console.log(response)

                            if (response.success) {
                                closeView()
                            }
                            else if (response.errors) {

                                // Manual payments come back differently
                                if (response.errors.payments && response.errors.payments[0]) {
                                    setErrors(response.errors.payments[0])
                                }
                                else {
                                    setErrors(response.errors)
                                }

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base)
                                }

                                insightUtils.scrollTo('errors')
                            }

                            setSubmitting(false);
                        }
                        catch(err) {
                            console.log("UH-OH", err)
                            setBaseErrorMessage("Unable to save payments")
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <>
                            <Form>

                                <h2>Select Resident</h2>

                                <div className="form-row form-center">
                                    <div className="st-col-33">
                                    </div>
                                    <div className="st-col-33">
                                        <FormItem label="" name="lease_resident_id" optional={true}>
                                            <BasicDropdown name="lease_resident_id" options={leaseResidents} direction="row" />
                                        </FormItem>
                                    </div>
                                    <div className="st-col-33">
                                    </div>
                                </div>

                                {values.lease_resident_id && <>
                                    <h2>Payment Method</h2>

                                    {params.mode != "auto" &&
                                        <>
                                            <div className="form-row form-center">
                                                <FormItem name="mode">
                                                    <RadioButtonGroup name="mode" options={
                                                        currentSettings && currentSettings.available_payment_methods_default_cash ?
                                                            [{id: "goto_cash", name: "Cash Pay"}, {id: "manual", name: "Paper Check"}, {id: "auto", name: "Card / ACH"}]
                                                            :
                                                            [{id: "manual", name: "Paper Check"}, {id: "auto", name: "Card / ACH"}]
                                                    } direction="row"/>
                                                </FormItem>
                                            </div>
                                        </>
                                    }

                                    {values.mode == "manual" &&
                                    <>
                                        <div className="form-row form-center">
                                            <FormItem formItemClass="form-item-33" label={<>Entry Date <ToolTip explanation="If you charge a late fee, and have not entered checks the day received, enter a batch date that is prior to the end of your grace period to reverse any late fees."/></>} name="payment_on">
                                                <DatePicker className="form-input form-input-white" selected={values.payment_on} onChange={(date) => setFieldValue("payment_on", date)} />
                                            </FormItem>
                                            <div className="st-col-33">
                                                <FormItem label="Amount" name="amount" mask={insightUtils.currencyMask()} />
                                            </div>
                                            <div className="st-col-33">
                                                <FormItem label="Check #" name="extra_info" />
                                            </div>
                                        </div>
                                    </>
                                    }

                                    {values.mode == "auto" && residentPaymentMethods && <>

                                        <PaymentMethodForm property={property} existingPaymentMethods={residentPaymentMethods} excludeCash={true} paymentMethodIdName="resident_payment_method_id" methodTypeLabel={"Select Payment Method"} />

                                        {values.resident_payment_method_id && <>
                                            <h2>Schedule Payment</h2>

                                            <div className="form-row form-center">
                                                <div className="st-col-33">
                                                    <FormItem label="Payment Type" name="payment_action">
                                                        <BasicDropdown name="payment_action" options={[{id: "one_time", name: "One-time Payment"}, {id: "recurring", name: "Recurring - Auto Pay"}]} direction="row" />
                                                    </FormItem>
                                                </div>
                                                {values.payment_action == "recurring" &&
                                                <>
                                                    <div className="st-col-33">
                                                        <FormItem label="Frequency" name="recurring_payment_frequency">
                                                            <BasicDropdown name="recurring_payment_frequency" options={[{id: "weekly", name: "Weekly (25% Amount Due)"}, {id: "biweekly", name: "Bi-Weekly (50% Amount Due)"}, {id: "monthly", name: "Monthly (Amount Due)"}]} direction="row" />
                                                        </FormItem>
                                                    </div>

                                                    {(values.recurring_payment_frequency == constants.recurring_payment_frequencies.weekly.key || values.recurring_payment_frequency == constants.recurring_payment_frequencies.biweekly.key) &&
                                                        <div className="st-col-33">
                                                            <FormItem label="Day of week" name="recurring_payment_day_of_week">
                                                                <BasicDropdown name="recurring_payment_day_of_week" options={[{id: 1, name: "Monday"}, {id: 2, name: "Tuesday"}, {id: 3, name: "Wednesday"}, {id: 4, name: "Thursday"}, {id: 5, name: "Friday"}, {id: 6, name: "Saturday"}]} />
                                                            </FormItem>
                                                        </div>
                                                    }
                                                </>
                                                }
                                                {values.payment_action == "one_time" &&
                                                <>
                                                    <div className="st-col-33">
                                                        <FormItem label="Enter payment amount" name="amount" mask={insightUtils.currencyMask()} />
                                                    </div>
                                                </>
                                                }
                                            </div>

                                            {values.payment_action == "recurring" && <PaymentScheduleView leaseResident={values} leaseResidentHashId={values.lease_resident_id} numberOfPayments={11} />}


                                        </>}
                                    </>}
                                </>}

                                <div className="form-row">
                                    <div className="st-col-100 form-nav">
                                        <a className="btn btn-gray" onClick={() => closeView()}>&lt; Back</a>

                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <span>Submitting...</span>}
                                            {!isSubmitting && <span>Next</span>}
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        </>
                    )}
                </Formik>
            </div>}

        </>

    )}

export default PaymentNewPage;

