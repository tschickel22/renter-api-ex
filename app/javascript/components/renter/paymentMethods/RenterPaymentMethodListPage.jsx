import React, {useEffect, useState} from 'react';
import store from "../../../app/store";

import ListPage from "../../shared/ListPage";
import RenterPaymentMethodListRow from "./RenterPaymentMethodListRow";
import {loadResidentPaymentMethods} from "../../../slices/paymentSlice";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";
import RenterStatusBlock from "../RenterStatusBlock";
import {loadLease} from "../../../slices/leaseSlice";
import {useSelector} from "react-redux";
import {Link, useParams} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";

const RenterPaymentMethodListPage = ({}) => {

    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)

    useEffect(async() => {

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

    }, []);

    async function runSearch(_text) {
        const results = await store.dispatch(loadResidentPaymentMethods({leaseResidentId: ""})).unwrap()
        return {total: results.data.total, objects: results.data.resident_payment_methods}
    }

    function generateTableRow(paymentMethod, key) {
        return (<RenterPaymentMethodListRow key={key} paymentMethod={paymentMethod} lease={lease} leaseResident={leaseResident} />)
    }

    return (
        <>
            {lease && leaseResident &&
                <ListPage
                    titleImage={<></>}
                    runSearch={runSearch}
                    addButton={
                        <div>
                            <Link to={insightRoutes.renterPaymentMethodNew(lease.hash_id)} className="btn btn-red"><span>Add Payment Method <i className="fas fa-plus"></i></span></Link>
                        </div>

                    }

                    hideSearch={true}
                    nav={<RenterStatusBlock title="Payment Methods" lease={lease} leaseResident={leaseResident} />}
                    tableHeaderClass="st-row st-header st-row-5-col-table"
                    noDataMessage={"You have no Payment Methods"}
                    columns={[
                        {label: "Nickname", class: "st-col-50", sort_by: "nickname"},
                        {label: "Type", class: "st-col-25", sort_by: "method_pretty"},
                        {label: "Used for Auto-Pay?", class: "st-col-25", sort_by: "status"},
                        {sort_by: "updated_at", hidden: true}
                    ]}
                    generateTableRow={generateTableRow}
                />
            }
        </>

    )}

export default RenterPaymentMethodListPage;

