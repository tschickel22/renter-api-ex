import React, {useState} from 'react';
import {useSelector} from "react-redux";

import insightUtils from "../../../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";
import ScreeningPackageBlock from "../../leases/ScreeningPackageBlock";
import Modal from "../../../shared/Modal";
import ScreeningTermsView from "./ScreeningTermsView";
import store from "../../../../app/store";
import {displayAlertMessage} from "../../../../slices/dashboardSlice";

const ScreeningOnboardingLandingView = ({}) => {

    const navigate = useNavigate()

    const { settings, currentCompany } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [showingFees, setShowingFees] = useState(false)
    const [showingTerms, setShowingTerms] = useState(false)


    function handleBeginActivation() {
        if (agreedToTerms) {
            navigate(insightRoutes.screeningActivate())
        }
        else {
            store.dispatch(displayAlertMessage({message: "You must agree to the terms and conditions"}))
        }
    }

    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>


                <i className="far fa-file-magnifying-glass section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Get Started Now</h1>
                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-screening-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2 className="long-title">Resident Screening Reports in Minutes&mdash;FREE to Landlord!</h2>
                        <p>Now you have access to Resident Screening Reports that are typically only available to the largest apartment owners. Placing a good resident in your rental is crucial to avoid unexpected vacancy, consistent late payments, property damage and other resident caused financial burdens. Choose your package and your future resident pays for the report during the application process.</p>

                        <p>
                            <div onClick={() => setAgreedToTerms(!agreedToTerms)} className={"input-radio " + (agreedToTerms ? "active" : "")}><i className={(agreedToTerms ? "fa-square input-radio-btn fas" : "fal fa-square input-radio-btn")}></i><label>I agree to these <a onClick={()=>setShowingTerms(true)}>terms and conditions</a></label>&nbsp;&nbsp;&nbsp;</div>
                        </p>
                        <div onClick={() => handleBeginActivation()} className="btn btn-red btn-large btn-onboarding-activate-screening"><span>Activate Resident Screening</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-search"></i>
                                <h3>Screening Reports</h3>
                                <ul>
                                    <li>Credit Report with ResidentScore</li>
                                    <li>Criminal Reports from State and National Database with over 370 million records</li>
                                    <li>Eviction Reports: Access to over 16 million eviction records nationally</li>
                                    {false && <li>Income Insights: identify which applicants need additional income verification</li>}
                                    <li className="btn-fees btn-onboard-pricing-screening"><a onClick={() => setShowingFees(true)}>View Pricing<sup>*</sup></a></li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-user-check"></i>
                                <h3>Better Residents</h3>
                                <ul>
                                    <li>Use the nations strongest reports to make more accurate leasing decisions</li>
                                    <li>ResidentScore 2.0: Predicts evictions 15% more often than typical credit score</li>
                                    <li>Reduced Bad Debit</li>
                                    <li>Increase NOI</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-screening.jpg"/>
                    </div>

                </div>


            </div>}

            {showingTerms &&
                <Modal extraClassName="overlay-box-full-height" closeModal={() => setShowingTerms(false)}>
                    <ScreeningTermsView />
                </Modal>
            }

            {showingFees &&
                <Modal closeModal={() => setShowingFees(false)}>
                    <h2>Screening Report Pricing</h2>
                    <h3 className="text-center">You choose if Renter or Landlord pays</h3>

                    <div className="choose-package">

                        <div className="package-choices">
                            {currentCompany.screening_packages.map((screeningPackage, i) => (
                                <ScreeningPackageBlock key={i} screeningPackage={screeningPackage} />
                            ))}
                        </div>
                        <div className="disclaimer"><sup>*</sup>The Criminal Report is subject to federal, state, and local laws which may limit or restrict Renter Insight's ability to return some records.</div>
                    </div>


                    <div className="form-nav">
                        <div className="btn btn-red" onClick={() => setShowingFees(false)}><span>Close</span></div>
                    </div>
                </Modal>
            }

        </>

    )}

export default ScreeningOnboardingLandingView;

