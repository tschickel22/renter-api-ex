import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadInsurance, saveInsurance} from "../../../slices/insuranceSlice";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {loadLease} from "../../../slices/leaseSlice";

const RenterInsuranceStartPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { constants, properties } = useSelector((state) => state.company)
    const [insurance, setInsurance] = useState(null)
    const [property, setProperty] = useState(null)
    const [lease, setLease] = useState(null)

    useEffect(async () => {
        if (properties) {
            const leaseResults = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            const newLease = leaseResults.data.lease

            setLease(newLease)
            setProperty(insightUtils.getCurrentProperty(properties, {propertyId: newLease.property_id}))

            const results = await store.dispatch(loadInsurance({leaseId: newLease.hash_id})).unwrap()

            if (results.data){
                setInsurance(insightUtils.findActiveInsurance(results.data.insurances))
            }
        }
    }, [properties])

    useEffect(() => {
        if (insurance && (insurance.api_partner_id != constants.env.insurance_api_partner_internal || insurance.status == "active")) {
            navigate(insightRoutes.renterInsuranceEdit(lease?.hash_id || params.leaseId, insurance.api_partner_id))
        }

    }, [insurance])

    async function handleStartInsuranceProcess(apiPartnerId) {
        const results = await store.dispatch(saveInsurance({insurance: {lease_id: params.leaseId, api_partner_id: apiPartnerId}})).unwrap()

        console.log(results)

        if (results.data){
            navigate(insightRoutes.renterInsuranceEdit(params.leaseId, apiPartnerId))
        }
    }

    return (
        <>
            <div className="section">

                <div className="circle-bg"></div>

                <i className="far fa-house-crack section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Get Started Now</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-insurance-program-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>Get renters insurance coverage in 60 seconds!</h2>
                        <p>Protect your belongings for unplanned events for pennies a day.</p>

                        {property && property.external_insurance_id ?
                            <div className="btn btn-red btn-large" onClick={() => handleStartInsuranceProcess(constants.env.insurance_api_partner_msi)}><span>Get Quote</span></div>
                            :
                            <p>Your property has not enrolled in our insurance offering yet. Encourage them to do so! Already have insurance? <a onClick={() => handleStartInsuranceProcess(constants.env.insurance_api_partner_internal)}>Click here to upload proof</a>.</p>
                        }

                        <div className="column-split-wrap">
                            <div className="st-col-10"></div>
                            <div>
                                <i className="icon-red far fa-umbrella"></i>
                                <h3>Coverage Highlights</h3>
                                <ul>
                                    <li>Fulfills landlord requirements</li>
                                    <li>Covers losses to your personal property</li>
                                    <li>Provides liability coverage to protect your home</li>
                                    <li>Includes Pet Coverage & Bed Bug Coverage</li>
                                </ul>
                            </div>
                            <div className="st-col-10"></div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-insurance-program.jpg"/>
                    </div>

                </div>

                <div className="onboarding-disclaimer"><p style={{color: "black"}}>*Already have insurance? <a onClick={() => handleStartInsuranceProcess(constants.env.insurance_api_partner_internal)}>Click here to upload proof</a>.</p></div>


            </div>
        </>

    )}

export default RenterInsuranceStartPage;

