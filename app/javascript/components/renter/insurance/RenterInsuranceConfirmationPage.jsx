import React, {useEffect} from 'react';
import store from "../../../app/store";
import {confirmInsurance} from "../../../slices/insuranceSlice";

const RenterInsuranceConfirmationPage = ({}) => {

    useEffect(async () => {

        // We are only landing on this page because renters insurance is active.
        const results = await store.dispatch(confirmInsurance()).unwrap()

        console.log(results)

    }, [])

    return (
        <>
            <div className="section">

                <div className="circle-bg"></div>

                <i className="far fa-house-crack section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Congratulations</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-insurance-program-header.jpg"/>
                    </div>

                    <div className="column">
                        <p className="text-center">You have now protected your belongings for unplanned events for pennies a day.</p>
                    </div>
                </div>
            </div>
        </>

    )}

export default RenterInsuranceConfirmationPage;

