import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import insightUtils from "../../app/insightUtils";
import RenterStatusBlock from "./RenterStatusBlock";
import {useParams} from "react-router-dom";
import store from "../../app/store";
import {loadLease} from "../../slices/leaseSlice";
import {requestElectronicPayments, requestFullAccess, searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import {displayAlertMessage} from "../../slices/dashboardSlice";

const RenterPaymentStartView = ({setIsPayingNow}) => {

    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany } = useSelector((state) => state.company)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)

    useEffect(async() => {

        /*
           Load Lease
         */
        if (currentUser && !lease) {
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
            const response = results.data

            if (response.success) {
                setLease(response.lease)

                const leaseResidentResults = await store.dispatch(searchForLeaseResidents({})).unwrap()
                const currentLeaseResident = leaseResidentResults.data.lease_residents.find((leaseResident) => {
                    return leaseResident.lease.hash_id == params.leaseId
                })

                setLeaseResident(currentLeaseResident)

            }
        }

    }, [currentUser]);

    async function handleRequestElectronicPayments(e) {
        const originalHTML = e.target.innerHTML

        e.target.innerHTML = "Sending..."

        try {
            const results = await store.dispatch(requestElectronicPayments({leaseResidentId: leaseResident.hash_id})).unwrap()

            if (results.data.success) {
                store.dispatch(displayAlertMessage({message: "We have emailed your property manager."}))
            }
            else {
                store.dispatch(displayAlertMessage({message: "Could not send email."}))
            }
        }
        catch(err) {
            store.dispatch(displayAlertMessage({message: "Could not send email due to an unexpected error."}))
        }

        e.target.innerHTML = originalHTML
    }


    return (
        <>
            {lease && leaseResident && <>
                <div className="circle-bg"></div>

                <RenterStatusBlock lease={lease} leaseResident={leaseResident} />

                <div className="onboarding onboarding-wrap">

                    <div className="column column-img-mobile">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-payments-header.jpg"/>
                    </div>

                    <div className="column">
                        <h2>Ready to pay your rent electronically?</h2>

                        {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key ?
                            <>
                                <p>Easily create one time or recurring payments.  Set payments on your schedule and make sure you are not late.  Pay weekly, monthly or bi-monthly, it's up to you.</p>
                                <div className="btn btn-red btn-large" onClick={() => setIsPayingNow(true)}><span>Pay Now</span></div>
                            </>
                            :
                            <>
                                <p>Your property manager hasn't activated this service yet. Would you like to request that they activate electronic payments?</p>
                                <div className="btn btn-red btn-large" onClick={(e) => handleRequestElectronicPayments(e)}><span>Send Request Now</span></div>
                            </>
                        }
                        <div className="column-split-wrap">
                            <div className="column-split">
                                <i className="icon-red far fa-credit-card"></i>
                                <h3>Payment Types</h3>
                                <ul>
                                    <li>Bank Account (ACH)</li>
                                    <li>Debit Card</li>
                                    <li>Credit Card</li>
                                </ul>
                            </div>

                            <div className="column-split">
                                <i className="icon-red icon-vert far fa-clipboard-list-check"></i>
                                <h3>Cards Accepted</h3>
                                <ul>
                                    <li>Visa</li>
                                    <li>Master Card</li>
                                    <li>American Express</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="column column-img-desktop">
                        <img className="img-responsive img-rounded-corners" src="/images/marketing-products-payments.jpg"/>
                    </div>
                </div>
            </>}
        </>
    )}

export default RenterPaymentStartView;

