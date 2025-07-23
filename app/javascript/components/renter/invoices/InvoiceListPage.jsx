import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";

import {searchForInvoices} from "../../../slices/invoiceSlice";
import store from "../../../app/store";
import InvoiceListRow from "./InvoiceListRow";

import ListPage from "../../shared/ListPage";
import StatusBlock from "../../landlord/leases/blocks/StatusBlock";
import LeaseNav from "../../landlord/leases/LeaseNav";
import {loadLease} from "../../../slices/leaseSlice";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import RenterStatusBlock from "../RenterStatusBlock";
import {searchForLeaseResidents} from "../../../slices/leaseResidentSlice";

const InvoiceListPage = ({}) => {
    let params = useParams();

    const { currentUser } = useSelector((state) => state.user)

    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)

    async function loadData() {
        /*
           Load Lease
         */
        const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

        if (results.data.success) {
            setLease(results.data.lease)

            const leaseResidentResults = await store.dispatch(searchForLeaseResidents({})).unwrap()
            const currentLeaseResident = leaseResidentResults.data.lease_residents.find((leaseResident) => {
                return leaseResident.lease.hash_id == params.leaseId
            })

            setLeaseResident(currentLeaseResident)
        }
        else {
            setBaseErrors("Unable to load lease.")
        }
    }

    useEffect(() => {
        loadData()
    }, []);


    async function runSearch(text, page) {
        const results = await store.dispatch(searchForInvoices({leaseId: params.leaseId, searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.invoices}
    }

    function generateTableRow(invoice, key) {
        return (<InvoiceListRow key={key} invoice={invoice} />)
    }

    return (
        <div className="section">
            {lease && <>
                {insightUtils.isResident(currentUser) ? <>
                        {leaseResident && <RenterStatusBlock lease={lease} leaseResident={leaseResident} title="Invoices" />}
                    </>
                    :
                    <>
                        <StatusBlock lease={lease} title="Invoices" />
                        <LeaseNav lease={lease} />
                    </>
                }
            </>}

            {lease && <>
                <ListPage
                    hideSearch={true}
                    titleImage={<></>}
                    runSearch={runSearch}
                    columns={[
                        {label: "Invoice", class: "st-col-50", sort_by: "invoice_on"},
                        {label: "Amount", class: "st-col-50 text-right", sort_by: "amount", data_type: "float"},
                    ]}
                    defaultSortBy="invoice_on"
                    defaultSortDir="asc"
                    generateTableRow={generateTableRow}
                    noDataMessage="No invoices generated yet"
                />
            </>}
        </div>

    )}

export default InvoiceListPage;

