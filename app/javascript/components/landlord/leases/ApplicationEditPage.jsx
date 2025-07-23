import React, {useEffect, useState} from 'react';
import StepsHeader from "../../shared/StepsHeader";
import LeaseOccupantDetailsPage from "./LeaseOccupantDetailsPage";
import LeaseApplicantDetailsPage from "./LeaseApplicantDetailsPage";
import {useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import LeaseScreeningIdentifyingInfoPage from "./LeaseScreeningIdentifyingInfoPage";
import LeaseApplicationPaymentPage from "./LeaseApplicationPaymentPage";
import LeaseApplicationSubmittedPage from "./LeaseApplicationSubmittedPage";
import LeaseScreeningVerificationPage from "./LeaseScreeningVerificationPage";
import LeaseScreeningReportRequestPage from "./LeaseScreeningReportRequestPage";

import store from "../../../app/store";
import {loadLeaseResident} from "../../../slices/leaseResidentSlice";
import LeaseApplicationInvitedPage from "./LeaseApplicationInvitedPage";
import insightUtils from "../../../app/insightUtils";
import LeaseApplicationAgreementPage from "./LeaseApplicationAgreementPage";

const ApplicationEditPage = ({}) => {
    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)
    const { constants, settings, properties } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [baseLease, setBaseLease] = useState(null)
    const [baseLeaseResident, setBaseLeaseResident] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

    const [currentStep, setCurrentStep] = useState('')
    const [navigationCurrentStep, setNavigationCurrentStep] = useState('')
    const property = (properties || []).find((property) => baseLease && property.id == baseLease.property_id)

    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(() => {

        if (baseLease) {
            if (baseLeaseResident) {
                setCurrentStep(baseLeaseResident.current_step)
                setNavigationCurrentStep(baseLeaseResident.current_step)

                // Some of the sub-steps need to reflect a certain step
                if (['screening_identity_pending', 'screening_ready_for_reports'].indexOf(baseLeaseResident.current_step) >= 0) {
                    setNavigationCurrentStep('screening')
                }
            }
            else {
                setCurrentStep('occupant_details')
                setNavigationCurrentStep('occupant_details')
            }
        }

    }, [baseLease, baseLeaseResident]);

    useEffect(async () => {

        /*
           Load Lease
         */
        if (currentUser && !baseLease) {
            const result = await store.dispatch(loadLeaseResident({leaseResidentId: params.leaseResidentId})).unwrap()
            const response = result.data

            if (response.success) {
                setBaseLeaseResident(response.lease_resident)
                setBaseLease(response.lease)
            }
            else if (response.errors) {
                setBaseErrors(response.errors)
            }
        }

    }, [currentUser]);


    function handleChangeStep(newStep) {
        if (baseLeaseResident) {
            setCurrentStep(newStep)
            setNavigationCurrentStep(newStep)
        }
    }

    function determineApplicationSteps() {
        let steps = {}

        steps[constants.lease_resident_steps.occupant_details.key] = 'Occupant Information'
        steps[constants.lease_resident_steps.applicant_details.key] = 'Applicant Details'

        if (insightUtils.isResident(currentUser)) {
            steps[constants.lease_resident_steps.agreement.key] = "Agreement"

            if (property && property.external_screening_id && currentSettings && currentSettings.application_require_screening) {
                steps[constants.lease_resident_steps.screening.key] = "Screening"
            }

            if (baseLease && (!baseLease.screening_payment_responsibility || baseLease.screening_payment_responsibility == "resident" || (currentSettings.application_charge_fee && currentSettings.application_fee > 0))) {
                steps[constants.lease_resident_steps.payment.key] = "Payment"
            }

        }

        return steps
    }

    return (
        <>

            {currentSettings && <div className="section" id="ll-section-resident-screening">

                <StepsHeader steps={determineApplicationSteps()} currentStep={navigationCurrentStep} setCurrentStep={() => {}}/>

                <hr />

                {baseErrors && <div className="text-error">{baseErrors}</div>}
                {currentStep == constants.lease_resident_steps.invitation.key && <LeaseApplicationInvitedPage baseLease={baseLease} baseLeaseResident={baseLeaseResident} setCurrentStep={setCurrentStep} />}
                {!currentStep || currentStep == constants.lease_resident_steps.occupant_details.key && <LeaseOccupantDetailsPage currentSettings={currentSettings} baseLease={baseLease} setBaseLease={setBaseLease} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}  />}
                {currentStep == constants.lease_resident_steps.applicant_details.key && <LeaseApplicantDetailsPage currentSettings={currentSettings} baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={handleChangeStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident} />}

                {insightUtils.isResident(currentUser) &&
                    <>
                        {currentStep == constants.lease_resident_steps.agreement.key && <LeaseApplicationAgreementPage property={property} currentSettings={currentSettings} baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={handleChangeStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}/>}
                        {currentStep == constants.lease_resident_steps.screening.key && <LeaseScreeningIdentifyingInfoPage baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={handleChangeStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}/>}
                        {currentStep == constants.lease_resident_steps.screening_identity_pending.key && <LeaseScreeningVerificationPage baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={setCurrentStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}/>}
                        {currentStep == constants.lease_resident_steps.payment.key && <LeaseApplicationPaymentPage property={property} currentSettings={currentSettings} baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={handleChangeStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}/>}
                        {currentStep == constants.lease_resident_steps.screening_ready_for_reports.key && <LeaseScreeningReportRequestPage baseLease={baseLease} setBaseLease={setBaseLease} setCurrentStep={setCurrentStep} baseLeaseResident={baseLeaseResident} setBaseLeaseResident={setBaseLeaseResident}/>}
                    </>
                }

                {insightUtils.isCompanyUserAtLeast(currentUser) && [constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.occupant_details.key, constants.lease_resident_steps.applicant_details.key].indexOf(currentStep) < 0 ?
                    <LeaseApplicationInvitedPage baseLease={baseLease} baseLeaseResident={baseLeaseResident} setCurrentStep={setCurrentStep}  />
                    :
                    <>
                        { [constants.lease_resident_steps.submitted.key, constants.lease_resident_steps.screening_in_progress.key, constants.lease_resident_steps.screening_complete.key, constants.lease_resident_steps.screening_error.key].indexOf(currentStep) >= 0 && <LeaseApplicationSubmittedPage baseLeaseResident={baseLeaseResident} />}
                    </>
                }

            </div>}

        </>

    )}

export default ApplicationEditPage;

