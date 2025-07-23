import React from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const ListingsOnboardingLandingView = ({}) => {

    let navigate = useNavigate()

    const { currentCompany, constants, settings } = useSelector((state) => state.company)
    const globalSettings = insightUtils.getSettings(settings)

    async function handleStartOnboarding() {

        const newCompany = {id: currentCompany.id, listings_onboard_status: constants.payment_onboarding_statuses.completed.key}
        await store.dispatch(saveCompany({company: newCompany})).unwrap()

        navigate(insightRoutes.propertyListingList())

    }

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
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-listing-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>List Properties and Reach Millions of Renters</h2>
                        <p>Create professional listings that are syndicated to dozens of leading rental sites automatically for free. Applicants can easily apply online, or send you inquiries directly from your new listings.</p>

                        {currentCompany && currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key ?
                            <div className="btn btn-red btn-large" onClick={() => handleStartOnboarding()}><span>Create Listing</span></div>
                            :
                            <p>You must be fully onboarded for <Link to={insightRoutes.onboardingPayments()}>Payments</Link> before using Listings.<br/><br/></p>
                        }

                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-apartment"></i>
                                <h3>Listings</h3>
                                <ul>
                                    <li>Create listings in minutes</li>
                                    <li>Share on social media</li>
                                    <li>Applicants can apply online</li>
                                    <li>Easily find & qualify residents</li>
                                </ul>

                            </div>

                            <div className="column-split">
                                <i className="icon-red far fa-rotate"></i>
                                <h3>Syndication</h3>
                                <ul>
                                    <li>Listings are posted on the top apartment sites:</li>
                                    <ul>
                                        <li>Apartment List</li>
                                        <li>Dwellsy</li>
                                        <li>Rent.com & more</li>
                                    </ul>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners img-screenshot" src="/images/marketing-products-listing.jpg"/>
                    </div>

                </div>


            </div>}
        </>

    )}

export default ListingsOnboardingLandingView;

