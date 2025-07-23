import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {Link, useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadUnitListingsForDisplay, saveUnitListing} from "../../../slices/unitListingSlice";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import UnitListingMessagingView from "./UnitListingMessagingView";

const FraudNotice = ({setShowFraudNotice}) => {

    return (
        <div className="section well">

            <a className="text-red float-right" onClick={() => setShowFraudNotice(false)}><i className="fa fa-close"></i></a>

            <h1>Avoid Scams and Fraud</h1>

            <p>The convenience of shopping online brings with it a heightened risk of scams and fraud. You should always be mindful and vigilant before providing anyone your personal information or sending payment of any kind. We work hard to eliminate bad actors from our system, but fraudsters are also working to scam you out of your hard earned money. When we work together, we can take steps to make our online marketplaces the safest they can be.</p>
            <h2>What We Ask You to Do</h2>
            <p>
            <ul>
            <li>Look out for scams.&nbsp; Here are some of the most common red flags:
                <ol>
                    <li><i>Rent offered below market.</i> Scammers know that innocent renters will be less cautious if they are motivated to close quickly on a deal so they don't lose out on something too good to be true.</li>
                    <li><i>Request to wire money.</i> Legitimate landlords do not ask renters to wire money to any account, especially an account located abroad.&nbsp; Nor do they ask for money by Western Union, MoneyGram or other money transfer service.</li>
                    <li><i>Request to use another listing service or escrow account to transfer money.</i> Scammers may impersonate legitimate listings services, like AirBnB or HomeAway, or request that money is sent to an escrow account to make renters believe they are dealing with a legitimate entity.</li>
                    <li><i>Dramatic landlord story.&nbsp; The landlord has received a job assignment abroad and must rent the unit ASAP.</i> You are invited to drive by the building, but no one can show it to you because everyone is already living abroad.&nbsp; And you need to commit in the next 24 hours because dozens of people are waiting to sign the lease.&nbsp; A legitimate landlord will meet you in person and allow you to tour the property before asking for a deposit to secure the rental.</li>
                    <li><i>Can't or won't meet in person.</i> For whatever reason, the landlord/agent refuses to meet you in person at the property. They may even send you an access code to unlock an electronic lockbox to gain entry by yourself to the house, condo or apartment you are looking to rent.</li>
                    <li><i>Sent you an Electronic Application & Screening Request.</i> If a fraudster has created a fake account, they could send you a request to complete an application & screening.  Please follow the previous examples to make sure you are applying with an actual landlord, not a fraudster.</li>
                </ol>
            </li>
            <li>Report scams immediately and with as much detail as possible (including copies of the communications with the scammer and money transfer details) to:
                <ol>
                    <li>Us by marking the listing as Suspicious on the site and calling 888-658-7368 x2 or emailing <a href="mailto:support@renterinsight.com">support@renterinsight.com</a></li>
                    <li>Your local police department</li>
                    <li><a href="https://www.ic3.gov/default.aspx" target="_blank">The Internet Crime Complaint Center (IC3)</a></li>
                    <li><a href="https://www.ftc.gov/complaint" target="_blank">The Federal Trade Commission</a></li>
                    <li>If you sent money by Western Union or Money Gram, those vendors' customer service departments may be able to stop the transfer:
                        <ul>
                            <li><a href="https://www.westernunion.com/us/en/file-complaint.html" target="_blank">Western Union Complaint Procedure</a></li>
                            <li><a href="https://www.moneygram.com/wps/portal/moneygramonline/home/CustomerService/ComplaintProcedure/!ut/p/c4/04_SB8K8xLLM9MSSzPy8xBz9CP0os3h3Y3cPM3dHYwN3Q0czA09nIzdHF3cXIwMDU_2CbEdFANWkR0I!/" target="_blank">MoneyGram Complaint Procedure</a></li>
                        </ul>
                    </li>
                </ol>
            </li>
            <h2>Review these real life examples of rental listings scams<br/>to make sure it doesn't happen to you:</h2>
            <p>Rental scam is on the rise, and there are individuals who will say and do anything they can to get money from renters.</p>
                <p><strong>Examples Scammers may use to convince renters to wire deposits or rent payments:</strong></p>
                <ol>
                    <li>I contacted my attorney and told them I will be renting my house to you and your fiancé.</li>
                    <li>The tracking number for the FedEx package with the keys will be sent to you so that you know when to be expecting the parcel. We are giving you this based on trust, so please don't disappoint us. You will need to make payment for the security deposit to enable shipment of the keys and documents to the address you have provided us.</li>
                    <li>I have emailed the Leasing Document to you, so you'll have to make a down payment now so we can take the rental home off the market and ship the keys to your address.</li>
                    <li>Here are the tracking details for your package. Please make your deposit via Cash App, Zelle, Bitcoin, or Bank Wire Transfer.</li>
                    <li>Your package is on hold by Customs, demanding $1,850. How much can you sort out now? Note that any money paid will be put towards rent. If you can come up with the additional $1,600, you will have five months of payments that can be put towards rent.</li>
                    <li>I have contacted Renter Insight. They will contact you soon with the payment invoice.</li>
                </ol>
                <p><strong>Examples Scammers may use to avoid meeting with renters:</strong></p>
                <ol>
                    <li>I resided in the house with my family, my wife, and my only daughter before and I am currently in South Carolina to help save lives down here due to the whole pandemic going on now.</li>
                    <li>The condo you inquired about is still available for rent. My family and I traveled to Texas, GA and some other cities for a program for the Department of Defense Military Healthcare System, VA/DoD Healthcare Affairs health care in three major cities.</li>
                    <li>As I am not around to show the inside, you can go check out the house and the neighborhood from the outside and get back to me if you really like it for more information.</li>
                    <li>My wife has COVID-19 and I am currently in quarantine. You can check out the house from the outside and tell me what you think.</li>
                    <li>I am currently out of the country. I own many properties and I'm just looking for someone who will take care of my property and my things. Money is not a problem.</li>
                </ol>
            </ul>
            </p>
            <p>Note: Scammers will always try to request funds before granting access to the property. Beware of Scammers who sent you fake Renter Insight invoices and who request that you send funds to a third party via Cash App, Zelle, Bitcoin, and Bank Wire Transfers. When in doubt, contact Renter Insight Support by email at <a href="mailto:support@renterinsight.com">support@renterinsight.com</a> or by phone at 303-586-4420.</p>

            <a className="btn btn-red" onClick={() => setShowFraudNotice(false)}>Close</a>
        </div>
    )}

export default FraudNotice;

