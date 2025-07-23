import React, {useState, useEffect} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {saveCompany} from "../../../slices/companySlice";
import Modal from "../../shared/Modal";
import {upgradeUserSubscription} from "../../../slices/userSlice";


const SubscriptionPricingPage = ({mode, message}) => {

    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentUser } = useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)

    const [urlAdditions, setUrlAdditions] = useState([])
    const [subscriptionFrequency, setSubscriptionFrequency] = useState(null)

    const [confirmingNewPlanCode, setConfirmingNewPlanCode] = useState(null)
    const [upgradingAccount, setUpgradingAccount] = useState(false)

    useEffect(() => {
        if (currentCompany) {

            let newUrlAdditions = []

            // Prepare the email address for Zoho's acceptance (remove anything after the plus)
            const parts = currentUser.email.split('@')
            const emailName = parts[0].split('+')[0]
            const email = emailName + '@' + parts[1]

            newUrlAdditions.push("email="+encodeURIComponent(email))
            newUrlAdditions.push("company_name="+encodeURIComponent(currentCompany.name))

            setUrlAdditions(newUrlAdditions)
            setSubscriptionFrequency(currentCompany.subscription_frequency)

        }

    }, [currentCompany])

    async function changeSubscriptionFrequency(newSubscriptionFrequency) {
        await store.dispatch(saveCompany({company: {subscription_frequency: newSubscriptionFrequency}})).unwrap()
        setSubscriptionFrequency(newSubscriptionFrequency)
    }

    async function handleUpgrade(newPlanCode) {
        setConfirmingNewPlanCode(null)
        setUpgradingAccount(true)

        const results = await store.dispatch(upgradeUserSubscription({planCode: newPlanCode})).unwrap()

        setUpgradingAccount(false)

        if (results.data.success) {
            alert(results.data.message || "Account Upgraded")
            document.location.href = "/"
        }
        else {
            alert(results.data.errors.base)
        }
    }

    return (
       <div className="section">
           {currentCompany && <>
               {(!subscriptionFrequency || mode == "upgrade") && <>
                   <div className="section-container">

                       {mode == "setup" && <>
                           <h2 className="text-center">Select Your Billing Option</h2>

                           <div className="pricing-everyplan">
                               <div className="pricing-ep-title"><strong>Every plan includes:</strong></div>
                               <div><i className="fas fa-check"></i>Free Onboarding Support</div>
                               <div><i className="fas fa-check"></i>Live Phone Support</div>
                               <div><i className="fas fa-check"></i>Email Support</div>
                           </div>
                       </>}

                       {mode == "upgrade" && <>
                           <h2 className="text-green" style={{fontSize: "2.7em", textTransform: "none"}}>Upgrade Today!</h2>
                           <div className="text-error">
                               {message && message == "units" ?
                                   <>You need to upgrade to add over 10 units.</>
                                   :
                                   <>The feature you're trying to access is only available with upgraded plans.</>
                               }
                           </div>
                           <hr/>
                           <div className="text-green">Get the most of your subscription and access Professional Features to build and run your business.</div>
                       </>}

                       <div className="plan-group-wrap">
                           <div className="plan">
                               <div className="plan-top">
                                   <div className="plan-name">{constants.subscription_pricing[constants.subscription_frequencies.free.key].value}</div>

                                   <div className="pricing-info positive" style={{fontSize: "1.5em", padding: "10px 10px 0 10px", marginBottom: 0}}>
                                       Starter
                                   </div>

                                   <div className="pricing-info positive" style={{marginTop: 0}}>
                                       No cost ever!
                                   </div>

                                   <div className="text-center" style={{paddingBottom: "15px"}}>Up to 10 Units. Upgrade after 10 Units</div>

                                   <ul className="plan-info" style={{borderTop: "1px solid darkgray"}}>
                                       <li><i className="fas fa-check"></i>Property Management Software</li>
                                       <li><i className="fas fa-check"></i>Accounting</li>
                                       <li><i className="fas fa-check"></i>Income &amp; Expense Tracking</li>
                                       <li><i className="fas fa-check"></i>Financial Reports</li>
                                       <li><i className="fas fa-check"></i>Property Listings</li>
                                       <li><i className="fas fa-check"></i>Listing Syndication</li>
                                       <li><i className="fas fa-check"></i>Online Rental Applications</li>
                                       <li><i className="fas fa-check"></i>*Background Screening w/Resident Risk Score</li>
                                       <li><i className="fas fa-check"></i>Resident Portals</li>
                                       <li><i className="fas fa-check"></i>*Resident Rent Payments</li>
                                       <li><i className="fas fa-check"></i>Auto Pay for Renters</li>
                                       <li><i className="fas fa-check"></i>Rent Reminders</li>
                                       <li><i className="fas fa-check"></i>Auto Late Fees</li>
                                       <li><i className="fas fa-check"></i>Maintenance Requests</li>
                                       <li><i className="fas fa-check"></i>Vendor Tracking</li>
                                       <li><i className="fas fa-check"></i>*Renters Insurance</li>
                                       <li><i className="fas fa-check"></i>Portfolio and Property Settings</li>
                                       <li><i className="fas fa-check"></i>Marketplace</li>
                                       <li><i className="fas fa-check"></i>Email Support</li>
                                       <li><i className="fas fa-check"></i>Chat Support</li>
                                       <li><i className="fas fa-check"></i>One Company Level User</li>
                                   </ul>

                               </div>

                               {mode == "setup" &&
                                   <div className="form-nav">
                                       <button onClick={() => changeSubscriptionFrequency(constants.subscription_frequencies.free.key)} className="btn btn-red">Starter</button>
                                   </div>
                               }
                           </div>

                           <div className="plan">
                               <div className="plan-top">
                                   <div className="plan-name">{constants.subscription_pricing[constants.subscription_frequencies.monthly.key].value} Billed Monthly</div>

                                   <div className="pricing-info positive" style={{fontSize: "1.5em", padding: "10px 10px 0 10px", marginBottom: 0}}>
                                       Monthly
                                   </div>

                                   <div className="pricing-info positive" style={{marginTop: 0}}>
                                       No Term Agreement
                                   </div>

                                   <div className="text-center" style={{paddingBottom: "15px"}}>Up to 20 Units. $1 per unit/month after 20 Units</div>

                                   <ul className="plan-info" style={{borderTop: "1px solid darkgray"}}>
                                       <li><i className="fas fa-check"></i>Includes all Features of Starter Plan, Plus:</li>
                                       <li><i className="fas fa-check"></i>Property Communications Center</li>
                                       <li><i className="fas fa-check"></i>Chat, Text &amp; Email with Residents</li>
                                       <li><i className="fas fa-check"></i>Portfolio Announcements</li>
                                       <li><i className="fas fa-check"></i>Bill Tracking</li>
                                       <li><i className="fas fa-check"></i>Check Printing</li>
                                       <li><i className="fas fa-check"></i>*Financial Connections</li>
                                       <li><i className="fas fa-check"></i>*1099 Filing</li>
                                       <li><i className="fas fa-check"></i>Unlimited Custom User Roles</li>
                                       <li><i className="fas fa-check"></i>Unlimited Users</li>
                                       <li><i className="fas fa-check"></i>Owner Portals</li>
                                       <li><i className="fas fa-check"></i>Phone Support</li>
                                   </ul>

                               </div>

                               {mode == "setup" &&
                                   <div className="form-nav">
                                       <button onClick={() => changeSubscriptionFrequency(constants.subscription_frequencies.monthly.key)} className="btn btn-red">Monthly</button>
                                   </div>
                               }
                               {mode == "upgrade" &&
                                   <div className="form-nav">
                                       <button disabled={upgradingAccount} onClick={() => setConfirmingNewPlanCode(constants.zoho_upgrade_plan_codes.monthly)} className="btn btn-red">{upgradingAccount ? "Upgrading..." : "Upgrade Now"}</button>
                                   </div>
                               }
                           </div>

                           <div className="plan">
                               <div className="plan-top">
                                   <div className="plan-name">{constants.subscription_pricing[constants.subscription_frequencies.yearly.key].value} Billed Yearly</div>
                                   <div className="pricing-info positive" style={{fontSize: "1.5em", padding: "10px 10px 0 10px", marginBottom: 0}}>
                                       Yearly
                                   </div>
                                   <div className="pricing-info positive" style={{marginTop: 0}}>
                                       33% Savings
                                   </div>
                                   <div className="text-center" style={{paddingBottom: "15px"}}>Up to 20 Units. $0.75 per unit/month after 20 Units</div>

                                   <ul className="plan-info" style={{borderTop: "1px solid darkgray"}}>
                                       <li><i className="fas fa-check"></i>Includes all Features of Starter Plan, Plus:</li>
                                       <li><i className="fas fa-check"></i>Property Communications Center</li>
                                       <li><i className="fas fa-check"></i>Chat, Text &amp; Email with Residents</li>
                                       <li><i className="fas fa-check"></i>Portfolio Announcements</li>
                                       <li><i className="fas fa-check"></i>Bill Tracking</li>
                                       <li><i className="fas fa-check"></i>Check Printing</li>
                                       <li><i className="fas fa-check"></i>*Financial Connections</li>
                                       <li><i className="fas fa-check"></i>*1099 Filing</li>
                                       <li><i className="fas fa-check"></i>Unlimited Custom User Roles</li>
                                       <li><i className="fas fa-check"></i>Unlimited Users</li>
                                       <li><i className="fas fa-check"></i>Owner Portals</li>
                                       <li><i className="fas fa-check"></i>Phone Support</li>
                                   </ul>
                               </div>

                               {mode == "setup" &&
                                   <div className="form-nav">
                                       <button onClick={() => changeSubscriptionFrequency(constants.subscription_frequencies.yearly.key)} className="btn btn-red">Yearly</button>
                                   </div>
                               }
                               {mode == "upgrade" &&
                                   <div className="form-nav">
                                       <button disabled={upgradingAccount} onClick={() => setConfirmingNewPlanCode(constants.zoho_upgrade_plan_codes.yearly)} className="btn btn-red">{upgradingAccount ? "Upgrading..." : "Upgrade Now"}</button>
                                   </div>
                               }
                           </div>
                       </div>
                       {mode == "setup" &&<div className="text-center text-muted">Plan can be cancelled prior to the end of Free Trial</div>}
                       <div className="text-center text-muted">
                           <sup>*</sup> Transaction Fees Apply
                       </div>
                   </div>
               </>}

               {mode == "setup" && <>
                   {subscriptionFrequency == constants.subscription_frequencies.free.key &&
                       <iframe width={isMobileDevice ? "400" : "768"} height="2000" src={constants.env.zoho_registration_free_url + "?" + urlAdditions.join("&")} style={{border: "none"}}></iframe>
                   }

                   {subscriptionFrequency == constants.subscription_frequencies.monthly.key &&
                       <iframe width={isMobileDevice ? "400" : "768"} height="2000" src={constants.env.zoho_registration_monthly_url + "?" + urlAdditions.join("&")} style={{border: "none"}}></iframe>
                   }

                   {subscriptionFrequency == constants.subscription_frequencies.yearly.key &&
                       <iframe width={isMobileDevice ? "400" : "768"} height="2000" src={constants.env.zoho_registration_yearly_url + "?" + urlAdditions.join("&")} style={{border: "none"}}></iframe>
                   }
               </>}

               {confirmingNewPlanCode && <Modal extraClassName="overlay-box-small" closeModal={() => setConfirmingNewPlanCode(null)}>
                   <h2>Upgrade Account</h2>
                   <p className="text-center">
                       Are you sure you want to upgrade?
                   </p>

                   <div className="form-nav">
                       <div onClick={() => handleUpgrade(confirmingNewPlanCode)} className="btn btn-red"><span>Yes</span></div>
                       <div onClick={() => setConfirmingNewPlanCode(null)} className="btn btn-gray"><span>No</span></div>
                   </div>

               </Modal>}
           </>}
       </div>
    )
}

export default SubscriptionPricingPage;

