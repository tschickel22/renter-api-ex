import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";

import {Form, Formik} from "formik";

import insightUtils from "../../../app/insightUtils";
import ScreeningPackageBlock from "./ScreeningPackageBlock";
import store from "../../../app/store";
import {payApplicationFee, payScreeningFee, saveResidentPaymentMethod} from "../../../slices/paymentSlice";
import PaymentMethodForm from "../../shared/PaymentMethodForm";

const LeaseApplicationPaymentPage = ({property, currentSettings, baseLease, setCurrentStep, baseLeaseResident, setBaseLeaseResident}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany } = useSelector((state) => state.company)

    const [screeningPackage, setScreeningPackage]= useState(null)
    const [paymentMethod, setPaymentMethod] = useState("")
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [screeningFee, setScreeningFee] = useState(0)
    const [applicationFee, setApplicationFee] = useState(0)
    const [totalDue, setTotalDue] = useState(0)

    useEffect(() => {

        if (baseLease) {
            let emptyPaymentMethod = insightUtils.emptyPaymentMethod()
            emptyPaymentMethod.resident_id = baseLeaseResident.resident.id

            setPaymentMethod(emptyPaymentMethod)
        }
    }, [baseLease]);

    useEffect(() => {

        if (baseLeaseResident) {
            let newScreeningFee = 0
            let newApplicationFee = 0
            const newScreeningPackage = currentCompany.screening_packages.find((sp) => baseLeaseResident.screening_package_id == sp.id)

            setScreeningPackage(newScreeningPackage)

            if (newScreeningPackage && baseLease.screening_payment_responsibility == "resident") {
                newScreeningFee = parseFloat(newScreeningPackage.price)
            }

            if (currentSettings.application_charge_fee) {
                newApplicationFee = (parseFloat(currentSettings.application_fee) || 0)
            }

            setScreeningFee(newScreeningFee)
            setApplicationFee(newApplicationFee)
            setTotalDue(newScreeningFee + newApplicationFee)
        }
    }, [baseLeaseResident, currentCompany]);

    return (
        <>
            {paymentMethod &&
                <div className="section-table-wrap">

                    <Formik
                        initialValues={paymentMethod}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {

                            /*
                               SAVE PAYMENT METHOD
                             */

                            setBaseErrorMessage("")

                            let residentPaymentMethodId = null

                            if (!values.resident_payment_method_id || values.resident_payment_method_id.length == 0) {
                                setBaseErrorMessage("Select a payment method")
                                insightUtils.scrollTo('errors')
                                return
                            }
                            else {
                                residentPaymentMethodId = values.resident_payment_method_id
                            }


                            if (residentPaymentMethodId.toString().indexOf("new") >= 0) {
                                values.method = residentPaymentMethodId.replace("new_", "")
                                const results = await store.dispatch(saveResidentPaymentMethod({residentPaymentMethod: values, leaseResidentId: baseLeaseResident.hash_id})).unwrap()
                                const response = results.data

                                console.log(response)

                                if (response.success) {
                                    residentPaymentMethodId = response.resident_payment_method.id
                                    setBaseLeaseResident(response.lease_resident)

                                } else if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')

                                    return
                                }
                            }

                            /*
                                PAY SCREENING FEE
                            */
                            const screeningFeePaymentResults = await store.dispatch(payScreeningFee({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: baseLeaseResident.hash_id})).unwrap()
                            const screeningFeePaymentResponse = screeningFeePaymentResults.data

                            if (screeningFeePaymentResponse.success) {

                                /*
                                 PAY APPLICATION FEE
                                */
                                const applicationFeePaymentResults = await store.dispatch(payApplicationFee({residentPaymentMethodId: residentPaymentMethodId, leaseResidentId: baseLeaseResident.hash_id})).unwrap()
                                const applicationFeePaymentResponse = applicationFeePaymentResults.data

                                console.log(applicationFeePaymentResponse)
                                setSubmitting(false)

                                if (applicationFeePaymentResponse.success) {

                                    /*
                                        MOVE ON
                                     */
                                    setBaseLeaseResident(applicationFeePaymentResponse.lease_resident)
                                }
                                else if (applicationFeePaymentResponse.errors) {
                                    setErrors(applicationFeePaymentResponse.errors)

                                    if (applicationFeePaymentResponse.errors.base) {
                                        setBaseErrorMessage(applicationFeePaymentResponse.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            else if (screeningFeePaymentResponse.errors) {
                                setErrors(screeningFeePaymentResponse.errors)

                                if (screeningFeePaymentResponse.errors.base) {
                                    setBaseErrorMessage(screeningFeePaymentResponse.errors.base)
                                }

                                insightUtils.scrollTo('errors')
                            }

                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">

                                    <h2>Payment</h2>
                                    <hr />

                                    {baseLease.screening_payment_responsibility == "resident" &&
                                        <div className="choose-package">
                                            <p className="text-center">To apply for this lease, your landlord requires resident screening.</p>

                                            {screeningPackage && <>
                                                <div className="package-choices">
                                                    <ScreeningPackageBlock screeningPackage={screeningPackage} isActive={baseLeaseResident.screening_package_id == screeningPackage.id}  />
                                                </div>

                                                {!currentUser || insightUtils.isCompanyUserAtLeast(currentUser) && <>
                                                    {screeningPackage.has_criminal_report && <p className="text-center"><sup>*</sup> The National Criminal Report is subject to federal, state and local laws which may limit or restrict TransUnion's ability to return some records. Criminal results not available to return for Delaware, Hawaii, Kentucky, Massachusetts, South Dakota, Wyoming, and New Jersey.</p>}
                                                    {screeningPackage.has_eviction_report && <p className="text-center"><sup>**</sup> The National Eviction Report is subject to federal, state and local laws which may limit or restrict TransUnion's ability to return some records. Certain jurisdictions may limit what eviction related records are eligible for return. Eviction related results are not available for New York.</p>}
                                                </>}
                                            </>}
                                        </div>
                                    }
                                    {currentSettings.application_charge_fee && currentSettings.application_fee > 0 &&
                                        <div className="choose-package">
                                            <br/>
                                            <p className="text-center"><strong>The application fee is {insightUtils.numberToCurrency(currentSettings.application_fee, 2)} </strong></p>
                                        </div>
                                    }

                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}<br/><br/></div>}

                                    <PaymentMethodForm property={property} existingPaymentMethods={baseLeaseResident.resident.resident_payment_methods} excludeDebitCards={true} excludeCash={true} paymentMethodIdName="resident_payment_method_id" />

                                    <div className="form-row">
                                        <div className="st-col-100">
                                            <p className="text-center"><strong>NSF Fee</strong>: You agree we may charge you a service charge of {insightUtils.numberToCurrency(currentSettings.nsf_fee, 2)} for handling any dishonored payment instrument {currentSettings.charge_residents_nsf_and_late_fee ? " in addition to any late fees assessed" : ""}.</p>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="st-col-50 hidden-md">

                                        </div>
                                        <div className="st-col-50 st-col-md-100 form-nav flex-column flex-right">
                                            {(screeningFee > 0) &&
                                            <div className="flex-row flex-right">
                                                <div className="st-col-50 text-right">
                                                    Resident Screening Fee
                                                </div>
                                                <div className="st-col-25 text-right">{insightUtils.numberToCurrency(screeningFee, 2)}</div>
                                            </div>}
                                            {(applicationFee > 0) &&
                                            <div className="flex-row flex-right">
                                                <div className="st-col-50 text-right">
                                                    Application Fee
                                                </div>
                                                <div className="st-col-25 text-right">{insightUtils.numberToCurrency(applicationFee, 2)}</div>
                                            </div>}
                                            <div className="flex-row flex-right" style={{padding: "20px 0"}}>
                                                <div className="st-col-50 text-right" style={{fontSize: "1.4em", fontWeight: "bold"}}>
                                                    Total Due
                                                </div>
                                                <div className="st-col-25 text-sensitive text-right" style={{fontSize: "1.4em", fontWeight: "bold"}}>{insightUtils.numberToCurrency(totalDue, 2)}</div>

                                            </div>
                                            <div className="flex-row flex-right">
                                                <a className="btn btn-gray" onClick={() => setCurrentStep(constants.lease_resident_steps.applicant_details.key)}>&lt; Previous</a>
                                                {values.resident_payment_method_id && <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                    {isSubmitting && <span>Submitting...</span>}
                                                    {!isSubmitting && <span>Pay &amp; Submit</span>}
                                                </button>}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </Form>
                        )}
                    </Formik>




                </div>

            }
        </>

    )}

export default LeaseApplicationPaymentPage;

