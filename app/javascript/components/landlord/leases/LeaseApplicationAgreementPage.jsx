import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";

import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import ScreeningPackageBlock from "./ScreeningPackageBlock";
import store from "../../../app/store";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";

const LeaseApplicationAgreementPage = ({property, currentSettings, baseLease, setCurrentStep, baseLeaseResident, setBaseLeaseResident}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany } = useSelector((state) => state.company)

    const [screeningPackage, setScreeningPackage]= useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [screeningFee, setScreeningFee] = useState(0)
    const [applicationFee, setApplicationFee] = useState(0)
    const [totalDue, setTotalDue] = useState(0)

    useEffect(() => {

        if (baseLeaseResident) {
            let newScreeningFee = 0
            let newApplicationFee = 0
            const newScreeningPackage = currentCompany.screening_packages.find((sp) => baseLeaseResident.screening_package_id == sp.id)

            setScreeningPackage(newScreeningPackage)

            if (newScreeningPackage && baseLease.screening_payment_responsibility == "resident" && property && property.external_screening_id && currentSettings && currentSettings.application_require_screening) {
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
            <div className="section-table-wrap">

                <Formik
                    initialValues={{application_agreement: ""}}
                    onSubmit={async (values, { setSubmitting, setErrors }) => {

                        /*
                           SAVE AGREEMENT
                         */

                        setBaseErrorMessage("")

                        if (!values.application_agreement) {
                            setBaseErrorMessage("You must agree in order to continue")
                        }
                        else {

                            const result = await store.dispatch(saveLeaseResident({leaseResident: {hash_id: baseLeaseResident.hash_id, current_step: constants.lease_resident_steps.agreement.key, application_agreement: values.application_agreement}})).unwrap()
                            const response = result.data

                            console.log(response)

                            setSubmitting(false);

                            if (response.success) {
                                setBaseLeaseResident(response.lease_resident)
                            }
                            else if (response.errors) {
                                setErrors(response.errors)

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base)
                                }

                                insightUtils.scrollTo('errors')
                            }
                        }

                        setSubmitting(false)


                    }}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div className="add-property-wrap">

                                <h2>Agreement</h2>
                                <hr />

                                {baseLease.screening_payment_responsibility == "resident" && property && property.external_screening_id && currentSettings && currentSettings.application_require_screening &&
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

                                <div className="form-row">
                                    <FormItem name="application_agreement" label="I certify I am submitting this rental application on my own behalf, and that all information provided herein is true, accurate, and complete to the best of my knowledge.  I grant permission for the property owner or manager of this residence to contact any current and former employers and employees, property owner or manager, and references listed in this application, and I further grant permission to current and former employers, property owner or manager, and references listed on this application to release my information for verification purposes. All Parties consent to executing or accepting agreements by electronic or digital means and agree (i) documents executed or accepted in such manner shall be considered as legally binding and shall be treated as originally written, signed documents, and (ii) agree not to raise, and agree to waive the use of electronic transmission or electronic signatures as a defense to the binding nature of such agreements." formItemClass="text-gray text-agreement" type="checkbox" />
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
                                                Due at Completion
                                            </div>
                                            <div className="st-col-25 text-sensitive text-right" style={{fontSize: "1.4em", fontWeight: "bold"}}>{insightUtils.numberToCurrency(totalDue, 2)}</div>

                                        </div>
                                        <div className="flex-row flex-right">
                                            <a className="btn btn-gray" onClick={() => setCurrentStep(constants.lease_resident_steps.applicant_details.key)}>&lt; Previous</a>
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                {isSubmitting && <span>Submitting...</span>}
                                                {!isSubmitting && <span>Submit</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </Form>
                    )}
                </Formik>




            </div>

        </>

    )}

export default LeaseApplicationAgreementPage;

