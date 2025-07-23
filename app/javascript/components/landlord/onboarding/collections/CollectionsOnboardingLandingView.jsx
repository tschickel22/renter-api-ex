import React, {useState} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../../../app/insightUtils";

const CollectionsOnboardingLandingView = ({}) => {

    const { settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    const [showingFees, setShowingFees] = useState(false)

    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>


                <i className="far fa-house-building section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Get Started Now</h1>

                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-collections-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>Professional Collections When Residents Don't Pay</h2>
                        <p>Unfortunately, some residents don't fulfil their lease obligations and leave owing you money. With Renter Insight, you can easily pursue residents for reimbursement through our rental property collection partners. Our partners have decades of experience delivering the highest collection rates and world class service to renters & apartment owners.</p>

                        <div className="btn btn-red btn-large"onClick={() => alert('Oops... not yet.')}><span>Submit Past Resident Now</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-dollar-circle"></i>
                                <h3>Benefits</h3>
                                <ul>
                                    <li>Increase NOI with post residency collections</li>
                                    <li>Collect funds you historically write off</li>
                                    <li>Get paid faster when a debt collection agency is involved</li>
                                    <li className="btn-fees btn-onboard-pricing-collections"><a onClick={() => setShowingFees(true)}>View Pricing<sup>*</sup></a></li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-file-certificate"></i>
                                <h3>Program</h3>
                                <ul>
                                    <li>Available in all US States</li>
                                    <li>Licensed in all required States</li>
                                    <li>Legal Office ensures compliance to all applicable laws</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-collections.jpg"/>
                    </div>

                </div>


            </div>}

            {showingFees && <div className="overlay-container">

                <div className="overlay-box overlay-box-large">
                    <div className="btn-close-overlay" onClick={() => setShowingFees(false)}>
                        <i className="fal fa-times-circle"></i>
                    </div>

                    <div className="overlay-box-content">
                        <h2>Collections Pricing</h2>

                        <div className="flex-table flex-table-4col">
                            <div className="flex-row">
                                <div className="flex-cell leftcorner-cell"></div>
                                <div className="flex-cell title-cell cell-top cell-left">Standard Plan</div>
                                <div className="flex-cell title-cell cell-top cell-right">Professional Plan</div>
                            </div>

                            <div className="flex-row row-gray">
                                <div className="flex-cell title-cell cell-left cell-top">Per Lease Fee</div>
                                <div className="flex-cell">$4.95</div>
                                <div className="flex-cell cell-right">Included</div>
                            </div>


                            <div className="flex-row">
                                <div className="flex-cell title-cell cell-bottom cell-left">*Collection Fee</div>
                                <div className="flex-cell cell-bottom">40%</div>
                                <div className="flex-cell cell-bottom cell-right">40%</div>
                            </div>
                        </div>

                        <small>*Collection fee is the percentage our partner agency retains from any amount collected on your behalf.</small>

                        <div className="form-nav">
                            <div className="btn btn-red" onClick={() => setShowingFees(false)}><span>Close</span></div>
                        </div>
                    </div>
                </div>
            </div>}
        </>

    )}

export default CollectionsOnboardingLandingView;

