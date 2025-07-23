import React from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";

const InsuranceOnboardingLandingView = ({}) => {

    const { currentCompany, constants, settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    async function handleStartOnboarding() {
        //const newCompany = {id: currentCompany.id, insurance_onboarding_status: constants.insurance_onboarding_statuses.started.key}
        //await store.dispatch(saveCompany({company: newCompany})).unwrap()
    }

    return (
        <>
            {globalSettings && <div className="section">

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
                        <h2>Investment Property Insurance Program</h2>
                        <p>We’ve partnered with Arcana Insurance Services to give you more control of your business. Easily quote & bind policies 24/7 from your computer.</p>
                        <p><strong>Our simplistic underwriting with no inspections or photo requirement makes underwriting quick </strong>and easy to understand. Our distinctive approach saves you time and money.</p>

                        <div className="btn btn-red btn-large" onClick={() => alert('Oops... not yet.')}><span>Get Quote</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-umbrella"></i>
                                <h3>Coverage Highlights</h3>
                                <ul>
                                    <li>Rentals or Flippers</li>
                                    <li>Competitive pricing with deductible options</li>
                                    <li>ACV or RCV options available</li>
                                    <li>Windstorm Coverage</li>
                                    <li>Vandalism, malicious mischief</li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-globe"></i>
                                <h3>Program</h3>
                                <ul>
                                    <li>Built to maximize cash flow</li>
                                    <li>Add & remove properties easily online.</li>
                                    <li>No photos or inspections required to issue coverage</li>
                                    <li>Quote, bind & print from PC</li>
                                    <li>Electronic Billing & Payments</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-insurance-program.jpg"/>
                    </div>

                </div>

                <div className="onboarding-disclaimer"><p>*Available in all states except NY</p></div>


            </div>}
        </>

    )}

export default InsuranceOnboardingLandingView;

