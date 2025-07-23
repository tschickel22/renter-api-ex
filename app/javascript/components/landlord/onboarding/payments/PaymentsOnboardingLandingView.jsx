import React, {useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";

const PaymentsOnboardingLandingView = ({}) => {

    const { currentCompany, constants, settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    const [showingFees, setShowingFees] = useState(false)

    async function handleStartOnboarding() {
        const newCompany = {id: currentCompany.id, payments_onboard_status: constants.payment_onboarding_statuses.started.key}
        await store.dispatch(saveCompany({company: newCompany})).unwrap()
    }

    return (
        <>
            {globalSettings && <div className="section">

                <div className="circle-bg"></div>


                <i className="far fa-circle-dollar section-icon section-icon-red"></i>

                <div className="title-block">
                    <h1>Get Started Now</h1>

                </div>

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-payments-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>Accept and Track all Payment Types</h2>
                        <p>Start accepting electronic payments at no cost to you. Residents can set up one time, monthly or weekly payments using ACH, Credit and Debit Cards. Our flexible payment solutions allow your residents to pay on their schedule ensuring rent is paid on time. Easily set your policy to charge fees for late payments to encourage on time payments.</p>

                        <div className="btn btn-red btn-large" onClick={() => handleStartOnboarding()}><span>Activate Payments</span></div>

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-credit-card"></i>
                                <h3>Payment Types</h3>
                                <ul>
                                    <li>Accept ACH, Credit and Debit Cards</li>
                                    <li>No Cost to Landlord</li>
                                    <li>Flexible Payment Options</li>
                                    <li>Set Automatic Late Fees</li>
                                    <li className="btn-fees btn-onboard-pricing-payments"><a onClick={() => setShowingFees(true)} >View Fees<sup>*</sup></a></li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-clipboard-list-check"></i>
                                <h3>Get Organized</h3>
                                <ul>
                                    <li>Track & report on all income types in one central location</li>
                                    <li>Payment and late payment reminders via email & text</li>
                                    <li>Eliminate the need for paper payments</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-payments.jpg"/>
                    </div>

                </div>

                <div className="onboarding-disclaimer"><p>*No set up fees or additional monthly fees for Renter Insight Payments</p></div>


            </div>}

            {globalSettings && showingFees && <div className="overlay-container" id="overlay-onboard-payments">

                <div className="overlay-box overlay-box-large">
                    <div className="btn-close-overlay" onClick={() => setShowingFees(false)}>
                        <i className="fal fa-times-circle"></i>
                    </div>

                    <div className="overlay-box-content">
                        <h2>Payment Fees</h2>

                        <div className="flex-table flex-table-4col">
                            <div className="flex-row">
                                <div className="flex-cell leftcorner-cell title-cell-vert"></div>
                                <div className="flex-cell title-cell cell-top cell-left">Payment Method</div>
                                <div className="flex-cell title-cell cell-top">Fee</div>
                            </div>

                            <div className="flex-row row-gray">
                                <div className="flex-cell title-cell cell-left cell-top title-cell-vert"><span>Landlord Pays</span></div>
                                <div className="flex-cell-group">
                                    <div className="flex-cell cell-align-left">Bank Account (ACH)</div>
                                    <div className="flex-cell cell-align-left">Credit Card</div>
                                    <div className="flex-cell cell-align-left">Debit Card</div>
                                </div>
                                <div className="flex-cell-group">
                                    <div className="flex-cell ">{insightUtils.numberToCurrency(globalSettings.payment_fee_ach_property, 2)}</div>
                                    <div className="flex-cell">{insightUtils.numberWithCommas(globalSettings.payment_fee_credit_card_property, 2)}% + {insightUtils.numberToCurrency(globalSettings.payment_fee_ach_resident, 2)}</div>
                                    <div className="flex-cell">{insightUtils.numberToCurrency(globalSettings.payment_fee_debit_card_property, 2)}</div>
                                </div>
                            </div>


                            <div className="flex-row">
                                <div className="flex-cell title-cell cell-left cell-bottom title-cell-vert"><span>Resident Pays</span></div>
                                <div className="flex-cell-group">
                                    <div className="flex-cell cell-align-left">Bank Account (ACH)</div>
                                    <div className="flex-cell cell-align-left">Credit Card</div>
                                    <div className="flex-cell cell-align-left cell-bottom">Debit Card</div>
                                </div>
                                <div className="flex-cell-group">
                                    <div className="flex-cell">{insightUtils.numberToCurrency(globalSettings.payment_fee_ach_resident, 2)}</div>
                                    <div className="flex-cell">{insightUtils.numberWithCommas(globalSettings.payment_fee_credit_card_resident, 2)}%  + {insightUtils.numberToCurrency(globalSettings.payment_fee_ach_resident, 2)}</div>
                                    <div className="flex-cell cell-bottom">{insightUtils.numberToCurrency(globalSettings.payment_fee_debit_card_resident, 2)}</div>
                                </div>
                            </div>


                        </div>


                        <div className="form-nav">
                            <div onClick={() => setShowingFees(false)} className="btn btn-red"><span>Close</span></div>
                        </div>
                    </div>
                </div>
            </div>}
        </>

    )}

export default PaymentsOnboardingLandingView;

