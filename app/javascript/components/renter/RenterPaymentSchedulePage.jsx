import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import store from "../../app/store";
import PaymentScheduleView from "../landlord/financial/PaymentScheduleView";
import {loadLeaseResident} from "../../slices/leaseResidentSlice";
import RenterStatusBlock from "./RenterStatusBlock";
import {loadLease} from "../../slices/leaseSlice";

const RenterPaymentSchedulePage = ({}) => {

    let params = useParams()

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)

    useEffect(async () => {
        const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

        setLease(results.data.lease)
        setLeaseResident(results.data.lease.primary_resident)

    }, [])

    return (
        <>
            <div className="section">
                {leaseResident &&
                    <>
                        <RenterStatusBlock lease={lease} leaseResident={leaseResident} title="Payment Schedule" />

                        <div className="section">
                            <PaymentScheduleView leaseResident={leaseResident} leaseResidentHashId={leaseResident.hash_id} />
                        </div>
                    </>
                }
            </div>

            {false &&
                <div className="form-nav">
                    <a onClick={() => history.back()} className="btn btn-gray"><span>Back</span></a>
                </div>
            }
        </>

    )}

export default RenterPaymentSchedulePage;