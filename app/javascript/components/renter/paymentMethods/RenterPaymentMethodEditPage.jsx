import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom'

import {deleteResidentPaymentMethod, loadResidentPaymentMethod, saveResidentPaymentMethod} from "../../../slices/paymentSlice";
import store from "../../../app/store";

import {Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";
import {loadLease} from "../../../slices/leaseSlice";
import PaymentMethodForm from "../../shared/PaymentMethodForm";

const RenterPaymentMethodEditPage = ({}) => {

    let navigate = useNavigate();
    let params = useParams();

    const { constants, properties } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [paymentMethod, setPaymentMethod] = useState(null)
    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [deletingPaymentMethod, setDeletingPaymentMethod] = useState(false)
    const [autoPayActivated, setAutoPayActivated] = useState(false)

    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    useEffect(async() => {

        let currentLeaseResident = null

        if (currentUser && !lease) {
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
            const response = results.data

            if (response.success) {
                setLease(response.lease)

                const leaseResidentResults = await store.dispatch(searchForLeaseResidents({})).unwrap()
                currentLeaseResident = leaseResidentResults.data.lease_residents.find((leaseResident) => {
                    return leaseResident.lease.hash_id == params.leaseId
                })

                setLeaseResident(currentLeaseResident)

            }
        }

        if (currentLeaseResident && currentLeaseResident.recurring_payment_frequency && currentLeaseResident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key) {
            setAutoPayActivated(true)
        }

        if (params.paymentMethodId) {
            const results = await store.dispatch(loadResidentPaymentMethod({paymentMethodId: params.paymentMethodId})).unwrap()

            if (results.data.resident_payment_method) {
                let newPaymentMethod = Object.assign({}, results.data.resident_payment_method)

                // Check the checkbox if this is the Auto-Pay method
                if (currentLeaseResident && currentLeaseResident.recurring_payment_method_id == newPaymentMethod.id) {
                    newPaymentMethod.switch_recurring_payment_method = true
                }

                setPaymentMethod(newPaymentMethod)
            }
        }
        else {
            setPaymentMethod(insightUtils.emptyPaymentMethod())
        }

    }, [])


    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setSubmitting(true)
        setBaseErrorMessage("")

        if (!paymentMethod.id) {
            let residentPaymentMethodId = null

            if (!values.resident_payment_method_id || values.resident_payment_method_id.length == 0) {
                setBaseErrorMessage("Select a payment method type")
                insightUtils.scrollTo('errors')
                return
            }
            else {
                residentPaymentMethodId = values.resident_payment_method_id
            }

            if (residentPaymentMethodId.indexOf("new") >= 0) {
                values.method = residentPaymentMethodId.replace("new_", "")
                values.billing_agreement = true
            }
        }

        const results = await store.dispatch(saveResidentPaymentMethod({residentPaymentMethod: values, leaseResidentId: leaseResident.hash_id})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeModal()
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(insightUtils.ensureArray(response.errors.base).join(", "))
            }

            insightUtils.scrollTo('errors')
        }
    }

    async function handleDeletePaymentMethod() {
        await store.dispatch(deleteResidentPaymentMethod({paymentMethodId: paymentMethod.hash_id})).unwrap()

        closeModal()
    }

    function closeModal() {
        navigate(insightRoutes.renterPaymentMethodList(lease.hash_id))
    }

    return (
        <div className="section">
            {paymentMethod && <>
                <Formik
                    initialValues={paymentMethod}
                    onSubmit={handleFormikSubmit}
                >
                    {({ values, isSubmitting}) => (
                        <Form>
                            <i className="fad fa-dollar-circle section-icon"></i>

                            {paymentMethod.id ?
                                <div>
                                    <div className="title-block">
                                        <h1><span>Edit Payment Method</span></h1>
                                    </div>

                                    <div className="skinny-column maint-request-form">
                                        <div className="smallspacer"></div>

                                        <div className="form-row">
                                            <FormItem label="Nickname" name="nickname" />
                                        </div>

                                        {autoPayActivated &&
                                            <div className="form-row">
                                                <FormItem label="Auto-Pay Default Payment Method" name="switch_recurring_payment_method" disabled={leaseResident && leaseResident.recurring_payment_method_id == paymentMethod.id} type="checkbox" optional={true} />
                                            </div>
                                        }

                                        {deletingPaymentMethod ?
                                            <>
                                                <div className="form-nav">
                                                    Are you sure you want to delete this payment method?
                                                </div>
                                                <div className="form-nav">
                                                    <a onClick={() => (setDeletingPaymentMethod(false))} className="btn btn-gray"><span>No</span></a>
                                                    <a onClick={() => (handleDeletePaymentMethod())} className="btn btn-red"><span>Yes</span></a>
                                                </div>
                                            </>
                                            :
                                            <div className="form-nav">
                                                <a onClick={() => closeModal()} className="btn btn-gray" disabled={isSubmitting}>
                                                    <span>Cancel</span>
                                                </a>
                                                {leaseResident && leaseResident.recurring_payment_method_id == paymentMethod.id ?
                                                    <></>
                                                    :
                                                    <a onClick={() => setDeletingPaymentMethod(true)} className="btn btn-gray" disabled={isSubmitting}>
                                                        <span>Delete</span>
                                                    </a>
                                                }
                                                <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                                </button>
                                            </div>
                                        }
                                    </div>
                                </div>
                            :
                                <>
                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                    <div className="form-row form-center">
                                        <div className="st-col-75 st-col-md-100">
                                            <PaymentMethodForm property={property} title="Payment Method" existingPaymentMethods={[]} excludeCash={true} paymentMethodIdName="resident_payment_method_id" methodTypeLabel={"Select Payment Method Type"}/>
                                        </div>
                                    </div>

                                    {autoPayActivated &&
                                        <div className="form-row form-center">
                                            <FormItem label="Make this my Auto-Pay Default Payment Method" name="switch_recurring_payment_method" type="checkbox" optional={true} />
                                        </div>
                                    }

                                    <div className="form-nav">
                                        <a onClick={() => closeModal()} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </>
                            }
                        </Form>
                    )}
                </Formik>


            </>}
        </div>
    )}

export default RenterPaymentMethodEditPage;

