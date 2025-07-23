import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {Form, Formik} from "formik";
import store from "../../../app/store";

import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";
import FinancialNav from "./FinancialNav";
import {getFinancialSummary} from "../../../slices/financialSlice";
import PaymentDueRow from "./PaymentDueRow";
import {savePayments} from "../../../slices/paymentSlice";
import DatePicker from "react-datepicker";
import FormItem from "../../shared/FormItem";
import ToolTip from "../../shared/ToolTip";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";

const PaymentDuePage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [openCharges, setOpenCharges] = useState(null)
    const [propertyId, setPropertyId] = useState(null)

    useEffect(() => {
        runSearch()
    }, [])

    async function runSearch(text, page) {
        const results = await store.dispatch(getFinancialSummary({startDate: "01/01/2000", propertyId: propertyId, searchText: text})).unwrap()
        let emptyPayments = {}
        const leasesWithOpenBalances = results.data.summaries.filter((leaseSummary) => leaseSummary.past_amount > 0 )

        leasesWithOpenBalances.forEach((leaseSummary) => {
            let payment = insightUtils.emptyPayment()
            payment.past_amount = leaseSummary.past_amount
            payment.past_due_on = leaseSummary.past_due_on
            payment.lease_hash_id = leaseSummary.lease_hash_id
            payment.primary_resident_hash_id = leaseSummary.primary_resident_hash_id
            payment.resident_first_name = leaseSummary.resident_first_name
            payment.resident_last_name = leaseSummary.resident_last_name
            payment.property_and_unit = leaseSummary.property_and_unit

            emptyPayments["l" + leaseSummary.lease_hash_id] = payment
        })

        setOpenCharges(emptyPayments)

        return {total: Object.values(emptyPayments).length, objects: Object.values(emptyPayments)}
    }

    function generateTableRow(leaseSummary, key) {
        return (<PaymentDueRow key={key} index={key} leaseSummary={leaseSummary} mode={params.mode} />)
    }

    function handlePropertyChange(e) {
        setPropertyId(e.target.value)
    }


    return (
        <>

            {properties && currentUser.payments_edit && openCharges && <div className="section">

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={{payment_on: new Date(), payments: openCharges}}
                    onSubmit={async (values, { setSubmitting, setErrors }) => {
                        setBaseErrorMessage("")

                        try {
                            // Set the payment date
                            let newPayments = Object.values(values.payments)

                            const result = await store.dispatch(savePayments({manualPaymentOn: values.payment_on, payments: newPayments})).unwrap()
                            const response = result.data

                            console.log(response)

                            setSubmitting(false);

                            if (response.success) {
                                // If we're in manual mode, come right back here
                                if (params.mode == "manual") {
                                    document.location.href = insightRoutes.financialPaymentDueManual()
                                }
                                else {
                                    navigate(insightRoutes.financialSummary())
                                }
                            }
                            else if (response.errors) {

                                let newErrors = {}

                                // Need to turn errors back into hash form
                                if (response.errors.payments) {
                                    Object.keys(response.errors.payments).forEach((index) => {
                                        const paymentErrors = response.errors.payments[index]
                                        if (Object.values(paymentErrors).length > 0) {
                                            newErrors['l' + newPayments[index].lease_hash_id] = paymentErrors
                                        }
                                    })

                                    setErrors({payments: newErrors})
                                }

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
                        <>
                            <Form>
                                <ListPage
                                    title="Apply Payments"
                                    titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                                    runSearch={runSearch}
                                    generateTableRow={generateTableRow}
                                    nav={<FinancialNav/>}
                                    addButton={<div className="form-item"><BasicDropdown blankText="All Properties" name="property_id" options={properties} onChange={handlePropertyChange} /></div>}
                                    noDataMessage="No open balances exist"
                                    defaultSortBy="resident_last_name"
                                    defaultSortDir="asc"
                                    reloadWhenChanges={propertyId}
                                    columns={
                                        params.mode == "manual" ?
                                            [
                                                {label: "Due Date", class: "st-col-10", sort_by: "past_due_on"},
                                                {label: "Resident", class: "st-col-15", sort_by: "resident_last_name"},
                                                {label: "Unit", class: "st-col-20", sort_by: "property_and_unit"},
                                                {label: "Amount Due", class: "st-col-10 text-right", sort_by: "past_due"},
                                                {label: "Payment Amount", class: "st-col-15 text-right"},
                                                {label: "Check #", class: "st-col-15 text-right"}
                                            ]
                                            :
                                            [
                                                {label: "Due Date", class: "st-col-10", sort_by: "past_due_on"},
                                                {label: "Resident", class: "st-col-15", sort_by: "resident_last_name"},
                                                {label: "Unit", class: "st-col-20", sort_by: "property_and_unit"},
                                                {label: "Amount Due", class: "st-col-10 text-right", sort_by: "past_due"},
                                                {label: "", class: "st-col-30"}
                                            ]
                                    }
                                />

                                {params.mode == "manual" && <>
                                    <div className="spacer"/>
                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-25" label={<>Batch Date <ToolTip explanation="If you charge a late fee, and have not entered checks the day received, enter a batch date that is prior to the end of your grace period to reverse any late fees."/></>} name="payment_on">
                                            <DatePicker className="form-input form-input-white" selected={values.payment_on} onChange={(date) => setFieldValue("payment_on", date)} />
                                        </FormItem>
                                    </div>
                                </>}

                                <div className="form-row">
                                    <div className="st-col-100 form-nav">
                                        <a className="btn btn-gray" onClick={() => navigate(insightRoutes.financialSummary())}>&lt; Back</a>

                                        {params.mode == "manual" && <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <span>Submitting...</span>}
                                            {!isSubmitting && <span>Save</span>}
                                        </button>}
                                    </div>
                                </div>
                            </Form>
                        </>
                    )}
                </Formik>
            </div>}

        </>

    )}

export default PaymentDuePage;

