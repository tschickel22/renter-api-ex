import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";

import {FieldArray, Form, Formik} from "formik";
import ResidentFormRow from "./ResidentFormRow";
import ResidentPetsForm from "./ResidentPetsForm";
import store from "../../../app/store";
import {saveLease} from "../../../slices/leaseSlice";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";
import insightUtils from "../../../app/insightUtils";

const LeaseOccupantDetailsPage = ({currentSettings, baseLease, setBaseLease, baseLeaseResident, setBaseLeaseResident}) => {

    const { currentUser }= useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    const [lease, setLease] = useState("")
    const [leaseResident, setLeaseResident] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            populateLease(baseLease, baseLeaseResident)
        }

    }, [baseLease, baseLeaseResident]);

    function populateLease(l, lr) {

        let newLease = Object.assign({}, l)
        let newLeaseResident = Object.assign({}, lr)

        if (!newLeaseResident.resident_pets) newLeaseResident.resident_pets = []

        if (!newLease.secondary_residents) {
            newLease.secondary_residents = []
        }

        if (!newLease.minors) {
            newLease.minors = []
        }

        if (!newLease.guarantors) {
            newLease.guarantors = []
        }

        setLease(newLease)
        setLeaseResident(newLeaseResident)

        console.log(newLease)
    }

    function addNewResident(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyLeaseResident())
    }

    return (
        <>
            {currentSettings && lease && leaseResident &&
                <div className="section-table-wrap">

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={
                            {
                                lease_resident: leaseResident,
                                secondary_residents: lease.secondary_residents,
                                minors: lease.minors,
                                guarantors: lease.guarantors
                            }
                        }
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            /*
                               SAVE LEASE
                             */

                            setBaseErrorMessage("")

                            values.lease_resident.current_step = constants.lease_resident_steps.occupant_details.key

                            try {
                                const result = await store.dispatch(saveLeaseResident({leaseResident: values.lease_resident})).unwrap()
                                const response = result.data

                                console.log(response)

                                setSubmitting(false);

                                if (response.success) {
                                    // Now, for primary residents push their co-residents
                                    if (leaseResident.type == "LeaseResidentPrimary") {

                                        const postData =
                                            {
                                                hash_id: lease.hash_id,
                                                secondary_residents: values.secondary_residents,
                                                minors: values.minors,
                                                guarantors: values.guarantors
                                            }


                                        const result = await store.dispatch(saveLease({lease: postData})).unwrap()
                                        const leaseResponse = result.data

                                        console.log(leaseResponse)
                                        setSubmitting(false);

                                        if (leaseResponse.success) {
                                            console.log(leaseResponse)

                                            setLease(null)
                                            setBaseLease(leaseResponse.lease)

                                            // Update the lease resident from first call
                                            setLeaseResident(null)
                                            setBaseLeaseResident(response.lease_resident)
                                        }
                                        else if (leaseResponse.errors) {
                                            setErrors(leaseResponse.errors)

                                            if (leaseResponse.errors.base) {
                                                setBaseErrorMessage(leaseResponse.errors.base)
                                            }
                                            else {
                                                setBaseErrorMessage("Please correct the errors and resubmit")
                                            }

                                            insightUtils.scrollTo('errors')
                                        }
                                    }
                                    else {
                                        setLease(null)
                                        setBaseLease(response.lease)

                                        setLeaseResident(null)
                                        setBaseLeaseResident(response.lease_resident)
                                    }
                                }
                                else if (response.errors) {
                                    setErrors({lease_resident: response.errors})

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }
                                    else {
                                        setBaseErrorMessage("Please correct the errors and resubmit")
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            catch(err) {
                                console.log("UHOH", err)
                                setBaseErrorMessage("Unable to save occupant details")
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Applicant Info</h3>

                                    <ResidentFormRow residentType="lease_resident" resident={values.lease_resident} index={0} />

                                    <hr/>

                                    {leaseResident.type == "LeaseResidentPrimary" && <>

                                        {currentSettings.application_include_co_applicants && <>
                                            <h3>Co-Applicants</h3>
                                            <p>All occupants over the age of 18 to must purchase and complete their own application, which will be submitted jointly along with the primary applicant. An separate invite will be sent to co-applicant.</p>

                                            <div>
                                                {<FieldArray
                                                    name="secondary_residents"
                                                    render={arrayHelpers => (
                                                        <>
                                                            {values.secondary_residents && values.secondary_residents.map((secondary_resident, index) => (
                                                                <ResidentFormRow key={index} index={index} arrayHelpers={arrayHelpers} residentType={"secondary_residents." + index} resident={secondary_resident} />
                                                            ))
                                                            }

                                                            <div className="form-row">
                                                                <div className="form-item">
                                                                    <a onClick={() => addNewResident(arrayHelpers)}>Add Co-Applicant</a>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                />}
                                            </div>
                                            <hr/>
                                        </>}


                                        {currentSettings.application_include_minors && <>

                                            <h3>Minors</h3>
                                            <p>Add individuals under the age of 18 who will live in the residence.</p>

                                            <div>
                                                {<FieldArray
                                                    name="minors"
                                                    render={arrayHelpers => (
                                                        <>
                                                            {values.minors && values.minors.map((minor, index) => (
                                                                <ResidentFormRow key={index} index={index} arrayHelpers={arrayHelpers} residentType={"minors." + index} resident={minor} />
                                                            ))}

                                                            <div className="form-row">
                                                                <div className="form-item">
                                                                    <a onClick={() => addNewResident(arrayHelpers)}>Add Minor</a>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                />}
                                            </div>
                                            <hr/>
                                        </>}

                                        {currentSettings.application_include_guarantors && <>
                                            <h3>Guarantors (co-signers)</h3>
                                            <p>Guarantors must be 18 years or older and must purchase and complete their own application, which will be submitted jointly along with the primary applicant. An separate invite will be sent to the guarantor.</p>

                                            <div>
                                                {<FieldArray
                                                    name="guarantors"
                                                    render={arrayHelpers => (
                                                        <>
                                                            {values.guarantors && values.guarantors.map((guarantor, index) => (
                                                                <ResidentFormRow key={index} index={index} arrayHelpers={arrayHelpers} residentType={"guarantors." + index} resident={guarantor} />
                                                            ))
                                                            }

                                                            <div className="form-row">
                                                                <div className="form-item">
                                                                    <a onClick={() => addNewResident(arrayHelpers)}>Add Guarantor</a>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                />}
                                            </div>

                                            <hr/>
                                        </>}
                                    </>}

                                    {currentSettings.application_include_pets && leaseResident.type != "LeaseResidentGuarantor" &&
                                        <ResidentPetsForm valuesLeaseResident={values.lease_resident}/>
                                    }

                                    <div className="form-nav">
                                        {insightUtils.isCompanyUserAtLeast(currentUser) &&
                                            <a className="btn btn-gray" onClick={() => history.back()}>&lt; Previous</a>
                                        }
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>Next &gt;</span>
                                        </button>
                                    </div>
                                </div>

                            </Form>
                        )}
                    </Formik>




                </div>

            }
        </>

    )}

export default LeaseOccupantDetailsPage;

