import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {loadInsurance, switchInsurancePartner} from "../../../slices/insuranceSlice";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const RentersInsuranceBlock = ({lease}) => {
    let navigate = useNavigate()

    const { constants, settings } = useSelector((state) => state.company)

    const [insuranceLoaded, setInsuranceLoaded] = useState(false)
    const [insurance, setInsurance] = useState(null)
    const [requireInsurance, setRequireInsurance] = useState(false)

    useEffect(async () => {
        const results = await store.dispatch(loadInsurance({leaseId: lease.hash_id})).unwrap()

        console.log(results)

        if (results.data){
            setInsurance(insightUtils.findActiveInsurance(results.data.insurances))
            setInsuranceLoaded(true)
        }

    }, [])

    useEffect(async () => {
        if (settings && lease) {
            const newSettings = insightUtils.getSettings(settings, lease.property_id)
            setRequireInsurance(newSettings.require_renters_insurance)
        }
    }, [settings, lease])

    async function switchApiPartner(apiPartnerId) {
        const results = await store.dispatch(switchInsurancePartner({insurance: {lease_id: lease.hash_id, api_partner_id: apiPartnerId}})).unwrap()

        if (results.data){
            navigate(insightRoutes.renterInsuranceEdit(lease.hash_id, apiPartnerId))
        }
    }

    return (
        <div className="flex-grid-item">
            <h3>Renters Insurance</h3>
            {insuranceLoaded && <div className="flex-line-blockwrap">
                {insurance && (insurance.status == "active" || insurance.status == "inactive") ?
                    <div className="flex-line-block">
                        {insurance.status_pretty && <div className="flex-line">Status: <strong className="rd-item">{insurance.status_pretty}</strong></div>}
                        {insurance.effective_on && <div className="flex-line">Effective Date: <strong className="rd-item">{insightUtils.formatDate(insurance.effective_on)}</strong></div>}
                        {insurance.expires_on && <div className="flex-line">Expiration Date: <strong className="rd-item">{insightUtils.formatDate(insurance.expires_on)}</strong></div>}
                        {insurance.policy_number && <div className="flex-line">Policy #: <strong className="rd-item">{insurance.policy_number}</strong></div>}
                        {insurance.insurance_company_name && <div className="flex-line">Company: <strong className="rd-item">{insurance.insurance_company_name}</strong></div>}
                        {insurance.api_partner_id == constants.env.insurance_api_partner_msi && <div className="flex-line">Phone: <strong className="rd-item">{constants.env.msi_phone_number}</strong></div>}
                        {insurance.status == "inactive" && <div className="text-error"><h3>Policy Inactive</h3></div>}
                    </div>
                    :
                    <>
                        <p>
                            {requireInsurance ?
                            <>
                                You Are Required to Have Renters Insurance
                            </>
                            :
                            <>
                                You Are Not Covered
                            </>
                            }
                        </p>
                        <img src="/images/apartment-disaster.png"/>
                    </>
                }
            </div>}

            <div className="spacer"></div>
            {insurance && insurance.status != "inactive" ?
                <>
                    {insurance.status == "active" ?
                        <>
                            <div onClick={() => navigate(insightRoutes.renterInsuranceShow(lease.hash_id))} className="btn btn-bottom btn-red"><span>View Policy Confirmation</span></div>
                            {insurance.api_partner_id == constants.env.insurance_api_partner_internal && <>
                                <br/>
                                <div onClick={() => switchApiPartner(constants.env.insurance_api_partner_msi)} className="btn btn-bottom btn-gray"><span>Purchase New Policy</span></div>
                            </>}
                        </>

                        :
                        (insurance.api_partner_id == constants.env.insurance_api_partner_internal ?
                                <>
                                    <div onClick={() => navigate(insightRoutes.renterInsuranceStart(lease.hash_id))} className="btn btn-bottom btn-red"><span>View Quote</span></div>
                                    <br/>
                                    <div onClick={() => switchApiPartner(constants.env.insurance_api_partner_internal)} className="btn btn-bottom btn-gray"><span>Upload Policy</span></div>
                                </>
                            :
                                <>
                                    <div onClick={() => navigate(insightRoutes.renterInsuranceEdit(lease.hash_id, constants.env.insurance_api_partner_msi))} className="btn btn-bottom btn-red"><span>Continue Setup</span></div>
                                    <br/>
                                    <div onClick={() => switchApiPartner(constants.env.insurance_api_partner_internal)} className="btn btn-bottom btn-gray"><span>Upload My Own Policy</span></div>
                                </>
                        )
                    }
                </>
                :
                <>
                    <div onClick={() => navigate(insightRoutes.renterInsuranceStart(lease.hash_id))} className="btn btn-bottom btn-red"><span>View Quote</span></div>
                    <br/>
                    <div onClick={() => switchApiPartner(constants.env.insurance_api_partner_internal)} className="btn btn-bottom btn-gray"><span>Upload Policy</span></div>
                </>
            }
        </div>
    )}

export default RentersInsuranceBlock;

