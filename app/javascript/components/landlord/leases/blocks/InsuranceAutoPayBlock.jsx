import React, {useEffect, useState} from 'react';
import {loadResidentPaymentMethods} from "../../../../slices/paymentSlice";
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import insightUtils from "../../../../app/insightUtils";
import {loadInsurance} from "../../../../slices/insuranceSlice";

const InsuranceAutoPayBlock = ({lease}) => {

    const { constants } = useSelector((state) => state.company)

    const [recurringPaymentMethod, setRecurringPaymentMethod] = useState(null)
    const [insurance, setInsurance] = useState(null)

    useEffect(async () => {
        const results = await store.dispatch(loadInsurance({leaseId: lease.hash_id})).unwrap()

        if (results.data){
            setInsurance(insightUtils.findActiveInsurance(results.data.insurances))
        }

    }, [])

    const portalStatus = lease.primary_resident ? (lease.primary_resident.resident && lease.primary_resident.resident.user_id ? "Active" : (lease.primary_resident.invitation_sent_at ? "Invite Sent" : "Uninvited")) : "Inactive"
    const autoPayActivated = lease.primary_resident && lease.primary_resident.recurring_payment_frequency && lease.primary_resident.recurring_payment_frequency != constants.recurring_payment_frequencies.none.key

    useEffect(async() => {
        if (autoPayActivated) {
            const results = await store.dispatch(loadResidentPaymentMethods({leaseResidentId: lease.primary_resident.hash_id})).unwrap()

            const newPaymentMethod = results.data.resident_payment_methods.find((paymentMethod) => (paymentMethod.id == lease.primary_resident.recurring_payment_method_id))

            setRecurringPaymentMethod(newPaymentMethod)
        }
    }, [])

    return (
        <div className="flex-grid-item">
            <h3>Resident Portal</h3>
            <div className="flex-line-block">
                <div className="flex-line">Status: <strong className="rd-item">{portalStatus}</strong></div>
            </div>

            <div className="flex-line-block">
                <div className="flex-line">Renter's Insurance: <strong className="rd-item">{insurance ? insurance.status_pretty : "None"}</strong></div>
                {insurance && <div className="flex-line">Policy Number: <strong className="rd-item">{insurance.insurance_company_name} #{insurance.policy_number}</strong></div>}
                {insurance && <div className="flex-line">Policy Exp: <strong className="rd-item">{insightUtils.formatDate(insurance.expires_on)}</strong></div>}
            </div>

            <div className="flex-line-block">
                <div className="flex-line">AutoPay: <strong>{autoPayActivated ? "On" : "Off"}{autoPayActivated && recurringPaymentMethod ? " - " + recurringPaymentMethod.method_pretty : ""}</strong></div>
            </div>

            <div className="btn btn-bottom btn-red btn-rd-invite-resident-portal" onClick={() => insightUtils.sendPortalInvitation(lease.primary_resident.hash_id)}><span>{portalStatus == "Active" ? "Re-send Invite" : "Invite Resident to Portal"} <i className="fal fa-paper-plane"></i></span></div>
        </div>
    )}

export default InsuranceAutoPayBlock;

