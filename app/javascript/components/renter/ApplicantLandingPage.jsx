import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";

import store from "../../app/store";
import {requestFullAccess, searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import ListPage from "../shared/ListPage";
import ApplicationListRow from "./ApplicationListRow";
import ContactInfoBlock from "./blocks/ContactInfoBlock";
import CommunicationsBlock from "./blocks/CommunicationsBlock";
import {displayAlertMessage} from "../../slices/dashboardSlice";
import insightUtils from "../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../app/insightRoutes";

const ApplicantLandingPage = ({}) => {

    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    const [leaseResidents, setLeaseResidents] = useState(null)
    const [futureLeaseResident, setFutureLeaseResident] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

    useEffect(async() => {

        /*
           Load Lease
         */
        if (currentUser && !leaseResidents) {
            const results = await store.dispatch(searchForLeaseResidents({})).unwrap()
            console.log(results.data)
            setLeaseResidents(results.data.lease_residents)

            const openApplicationLeaseResident = results.data.lease_residents.find((leaseResident) => {
                return insightUtils.isApplicationOpen(leaseResident, constants)
            })

            // Do we have an open application? If so, jump there
            if (openApplicationLeaseResident) {
                navigate(insightRoutes.renterApplicationEdit(openApplicationLeaseResident.hash_id))
            }
            else {

                const currentLeaseResidents = results.data.lease_residents.filter((leaseResident) => {
                    return leaseResident.lease.status == constants.lease_statuses.current.key
                })

                const currentOrFutureLeaseResidents = results.data.lease_residents.filter((leaseResident) => {
                    return (leaseResident.lease.lease_start_on && leaseResident.lease.status == constants.lease_statuses.future.key) || leaseResident.lease.status == constants.lease_statuses.current.key || leaseResident.lease.status == constants.lease_statuses.former.key
                })

                // If this resident is on a Current lease, send them there
                if (currentLeaseResidents.length > 0) {
                    navigate(insightRoutes.renterLeaseShow(currentLeaseResidents[currentLeaseResidents.length - 1].lease.hash_id))
                }
                // Otherwise, send them to the next best thing (either a future or former lease)
                else if (currentOrFutureLeaseResidents.length > 0) {
                    navigate(insightRoutes.renterLeaseShow(currentOrFutureLeaseResidents[currentOrFutureLeaseResidents.length - 1].lease.hash_id))
                }
                else {

                    const newFutureLeaseResident = results.data.lease_residents.find((leaseResident) => {
                        return leaseResident.lease.status == constants.lease_statuses.future.key && !leaseResident.lease.lease_start_on
                    })

                    setFutureLeaseResident(newFutureLeaseResident)
                }
            }
        }

    }, [currentUser]);

    function runSearch(_text, _page) {
        return {total: leaseResidents.length, objects: leaseResidents}
    }

    function generateTableRow(leaseResident, key) {
        return (<ApplicationListRow key={key} leaseResident={leaseResident} handleRequestFullAccess={handleRequestFullAccess} />)
    }

    async function handleRequestFullAccess(e) {
        const originalHTML = e.target.innerHTML

        e.target.innerHTML = "Sending..."

        try {
            const results = await store.dispatch(requestFullAccess({leaseResidentId: futureLeaseResident.hash_id})).unwrap()

            if (results.data.success) {
                store.dispatch(displayAlertMessage({message: "We have emailed your landlord."}))
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

            <div className="section">
                {baseErrors && <div className="text-error">{baseErrors}</div>}

                {leaseResidents && <>
                    {futureLeaseResident && <div className="title-block well">
                        <h1><span>Applicant Details for</span><span className="mobile-br"></span> {currentUser.first_name} {currentUser.last_name}</h1>

                        <p>You are currently an applicant.  If are going to rent this home and would like access to the full portal for Renters Insurance, Rent Payments & more, your landlord must set a move in date.  Press REQUEST FULL ACCESS and we will send your landlord a reminder to set your move-in date.  You will be notified by email when full access is available.</p>

                        <a onClick={(e) => handleRequestFullAccess(e)} className="btn btn-red btn-lg">Request Full Access</a>
                    </div>}

                    <ListPage
                        title="Applications List"
                        titleImage={<React.Fragment />}
                        runSearch={runSearch}
                        hideSearch={true}
                        hideNavCol={true}
                        columns={[
                            {label: "Property", class: "st-col-25 st-col-md-50", sort_by: "property_name"},
                            {label: "Resident Score", class: "st-col-15 hidden-md", sort_by: "credit_score"},
                            {label: "Status", class: "st-col-20 hidden-md", sort_by: "current_step"},
                            {label: "Date Requested", class: "st-col-20 st-col-md-50", sort_by: "created_at"},
                            {label: "Action", class: "st-col-20"}
                        ]}
                        defaultSortBy="invitation_sent_at"
                        defaultSortDir="desc"
                        generateTableRow={generateTableRow}
                    />

                    <br />

                    <div className="flex-grid flex-grid-gray flex-grid-three-col flex-center">
                        {(leaseResidents && leaseResidents.length > 0) && <CommunicationsBlock lease={leaseResidents[0].lease} leaseResident={leaseResidents[0]} />}
                        <ContactInfoBlock leaseResidents={leaseResidents} />
                    </div>

                </>}

            </div>

        </>

    )}

export default ApplicantLandingPage;

