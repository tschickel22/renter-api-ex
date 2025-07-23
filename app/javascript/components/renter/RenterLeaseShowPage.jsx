import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";

import {useNavigate, useParams} from "react-router-dom";

import store from "../../app/store";
import {loadLease} from "../../slices/leaseSlice";
import CommunicationsBlock from "./blocks/CommunicationsBlock";
import ContactInfoBlock from "./blocks/ContactInfoBlock";
import MaintenanceRequestBlock from "./blocks/MaintenanceRequestBlock";
import LeaseDocumentsBlock from "./blocks/LeaseDocumentsBlock";
import RenterLeaseSummaryBlock from "./blocks/RenterLeaseSummaryBlock";
import RentersInsuranceBlock from "./blocks/RentersInsuranceBlock";
import CreditBuilderBlock from "./blocks/CreditBuilderBlock";
import RenterStatusBlock from "./RenterStatusBlock";
import {searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import RenterMoveOutBlock from "./blocks/RenterMoveOutBlock";

const RenterLeaseShowPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams();
    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany } = useSelector((state) => state.company)
    const { offerInsurance } = useSelector((state) => state.dashboard)
    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

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
            else if (response.errors) {
                setBaseErrors(response.errors.join(", "))
            }
            else {
                setBaseErrors("Unable to edit lease. Please try again.")
            }
        }

    }, [currentUser]);


    return (
        <>

            <div className="section">
                {baseErrors && <div className="text-error">{baseErrors}</div>}

                {lease && leaseResident && <>
                    <RenterStatusBlock lease={lease} leaseResident={leaseResident} hideBackButton={true} />

                    <div className="flex-grid flex-grid-gray flex-grid-three-col">

                        <MaintenanceRequestBlock lease={lease} />

                        <CommunicationsBlock lease={lease} leaseResident={leaseResident} />

                        <ContactInfoBlock lease={lease} leaseResidents={leaseResident ? [leaseResident] : []} />
                        <RenterLeaseSummaryBlock lease={lease} />

                        {[constants.lease_statuses.former.key].indexOf(lease.status) >= 0 ?
                            <>
                                <RenterMoveOutBlock lease={lease} leaseResident={leaseResident} />
                            </>
                            :
                            <>
                                {offerInsurance && <RentersInsuranceBlock lease={lease} leaseResident={leaseResident} />}
                                <CreditBuilderBlock lease={lease} leaseResident={leaseResident} />
                            </>
                        }

                        <LeaseDocumentsBlock lease={lease} />

                    </div>
                </>}
            </div>
        </>

    )}

export default RenterLeaseShowPage;

