import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";

import insightRoutes from "../../../app/insightRoutes";
import {Form, Formik} from "formik";
import ResidentResidenceHistoryForm from "./ResidentResidenceHistoryForm";
import ResidentEmploymentHistoryForm from "./ResidentEmploymentHistoryForm";
import ResidentIncomeForm from "./ResidentIncomeForm";
import ResidentContactEmergencyForm from "./ResidentContactEmergencyForm";
import ResidentContactReferenceForm from "./ResidentContactReferenceForm";
import ResidentVehiclesForm from "./ResidentVehiclesForm";
import ResidentIdentificationForm from "./ResidentIdentificationForm";
import ResidentScreeningInformationForm from "./ResidentScreeningInformationForm";
import {saveLeaseResident} from "../../../slices/leaseResidentSlice";
import store from "../../../app/store";
import insightUtils from "../../../app/insightUtils";


const LeaseApplicantDetailsPage = ({currentSettings, baseLease, setBaseLease, setCurrentStep, baseLeaseResident, setBaseLeaseResident}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { properties, constants } = useSelector((state) => state.company)

    const [lease, setLease] = useState("")
    const [leaseResident, setLeaseResident] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [leaseAction, setLeaseAction] = useState("")

    const property = (properties || []).find((property) => baseLease && property.id == baseLease.property_id)

    let navigate = useNavigate()

    function emptyEmploymentHistory() { return {id: '', employment_status: '', company_name: '', contact_name: '', contact_phone: '', months_at_company: ''}}
    function emptyContactEmergency() { return {first_name: '', last_name: '', relationship_type: '', phone_number: ''}}
    function emptyContactReference() { return {first_name: '', last_name: '', relationship_type: '', phone_number: ''}}

    useEffect(() => {
        insightUtils.scrollTo('top')
    }, []);

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            populateLease(baseLease, baseLeaseResident)
        }

    }, [baseLease, baseLeaseResident]);

    function populateLease(l, lr) {

        let newResident = Object.assign({}, lr.resident)

        if (!newResident.resident_residence_histories || newResident.resident_residence_histories.length == 0) {
            newResident.resident_residence_histories = [insightUtils.emptyResidenceHistory()]
        }

        if (!newResident.resident_employment_histories || newResident.resident_employment_histories.length == 0) {
            newResident.resident_employment_histories = [emptyEmploymentHistory()]
        }

        if (!newResident.resident_employment_histories || newResident.resident_employment_histories.length == 0) {
            newResident.resident_employment_histories = [emptyEmploymentHistory()]
        }

        if (lr.type != "LeaseResidentGuarantor" && (!newResident.resident_contact_references || newResident.resident_contact_references.length == 0)) {
            newResident.resident_contact_references = [emptyContactReference()]
        }

        let newLeaseResident = Object.assign({}, lr)
        newLeaseResident.resident = newResident

        setLease(l)
        setLeaseResident(newLeaseResident)
        console.log(newLeaseResident)
    }

    function returnToScreenings() {
        navigate(insightRoutes.leaseShow(lease.hash_id))
    }

    return (
        <>
            {currentSettings && lease &&
            <div className="section-table-wrap">

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={{lease: lease, lease_resident: leaseResident}}
                    onSubmit={async (values, {setSubmitting, setErrors}) => {

                        /*
                           SAVE LEASE
                         */

                        setBaseErrorMessage("")

                        values.lease_resident.current_step = constants.lease_resident_steps.applicant_details.key

                        try {
                            const result = await store.dispatch(saveLeaseResident({leaseResident: values.lease_resident, leaseAction: leaseAction})).unwrap()
                            const response = result.data

                            console.log(response)

                            setSubmitting(false);

                            if (response.success) {

                                setLease(null)
                                setLeaseResident(null)

                                setBaseLease(response.lease)
                                setBaseLeaseResident(response.lease_resident)

                                if (leaseAction == constants.lease_actions.invite_to_screening.key || leaseAction == constants.lease_actions.begin_application.key) {
                                    returnToScreenings()
                                }
                            } else if (response.errors) {
                                setErrors({lease_resident: response.errors})

                                if (response.errors.base) {
                                    setBaseErrorMessage(response.errors.base)
                                }

                                insightUtils.scrollTo('errors')
                            }
                        } catch (err) {
                            setBaseErrorMessage("Unable to save applicant details. " + (err || ""))
                            setSubmitting(false);
                        }
                    }}
                >
                    {({isSubmitting, values}) => (
                        <Form>
                            <div className="add-property-wrap">
                                {leaseResident.type != "LeaseResidentMinor" && property && property.external_screening_id && <>
                                    <ResidentScreeningInformationForm lease={lease} leaseResident={values.lease_resident} currentSettings={currentSettings} />
                                    <hr/>
                                </>}

                                {insightUtils.shouldShow(currentSettings.application_include_resident_histories) && <>
                                    <ResidentResidenceHistoryForm property={property} leaseResident={values.lease_resident} optional={currentSettings.application_include_resident_histories == "optional"}/>
                                    <hr/>
                                </>}

                                {insightUtils.shouldShow(currentSettings.application_include_employment_histories) && <>
                                    <ResidentEmploymentHistoryForm property={property} leaseResident={values.lease_resident} optional={currentSettings.application_include_employment_histories == "optional"} emptyEmploymentHistory={emptyEmploymentHistory}/>
                                    <hr/>
                                </>}

                                {insightUtils.shouldShow(currentSettings.application_include_income) && <>
                                    <ResidentIncomeForm leaseResident={values.lease_resident} currentSettings={currentSettings} />
                                    <hr/>
                                </>}

                                {leaseResident.type != "LeaseResidentGuarantor" && <>
                                    {insightUtils.shouldShow(currentSettings.application_include_emergency_contacts) && <>
                                        <ResidentContactEmergencyForm leaseResident={values.lease_resident} emptyContactEmergency={emptyContactEmergency}/>
                                        <hr/>
                                    </>}
                                    {insightUtils.shouldShow(currentSettings.application_include_references) && <>
                                        <ResidentContactReferenceForm leaseResident={values.lease_resident} emptyContactReference={emptyContactReference}/>
                                        <hr/>
                                    </>}
                                </>}

                                {insightUtils.shouldShow(currentSettings.application_include_identification) && <>
                                    <ResidentIdentificationForm leaseResident={values.lease_resident} currentSettings={currentSettings}/>
                                    <hr/>
                                </>}

                                {currentSettings.application_include_vehicles && <ResidentVehiclesForm leaseResident={values.lease_resident} />}

                                <div className="form-nav">
                                    <a className="btn btn-gray" onClick={() => setCurrentStep(constants.lease_resident_steps.occupant_details.key)}>&lt; Previous</a>
                                    {insightUtils.isCompanyAdminAtLeast(currentUser) ?
                                        <>
                                            <button onClick={() => setLeaseAction(constants.lease_actions.begin_application.key)} className="btn" type="submit" disabled={isSubmitting}>
                                                <span>{!isSubmitting ? "Save and Close" : "Saving..."}</span>
                                            </button>
                                            {!values.lease_resident.invitation_sent_at &&
                                            <button onClick={() => setLeaseAction(constants.lease_actions.invite_to_screening.key)} className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                <span>Send Invitation</span>
                                            </button>
                                            }
                                        </>
                                        :
                                        <button onClick={() => setLeaseAction('')} className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>Next &gt;</span>
                                        </button>
                                    }

                                </div>
                            </div>

                        </Form>
                    )}
                </Formik>


            </div>
            }
        </>

    )}

export default LeaseApplicantDetailsPage;

