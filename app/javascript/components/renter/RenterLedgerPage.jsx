import React, {useEffect, useState} from 'react';
import {Link, Outlet, useNavigate, useParams} from 'react-router-dom'
import insightUtils from "../../app/insightUtils";
import store from "../../app/store";
import {searchForLeaseResidents} from "../../slices/leaseResidentSlice";
import insightRoutes from "../../app/insightRoutes";
import ListPage from "../shared/ListPage";
import LedgerRow from "../landlord/financial/LedgerRow";
import {loadLease} from "../../slices/leaseSlice";
import {loadChargesAndLedgerItems} from "../../slices/chargeSlice";
import {useSelector} from "react-redux";
import RenterStatusBlock from "./RenterStatusBlock";

const RenterLedgerPage = ({}) => {

    let navigate = useNavigate()

    let params = useParams();
    const { currentUser } = useSelector((state) => state.user)
    const [ledgerItems, setLedgerItems] = useState(null)
    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

    const [chargesTotal, setChargesTotal] = useState(null)
    const [paymentsTotal, setPaymentsTotal] = useState(null)

    useEffect(async() => {

        /*
           Load Lease
         */
        if (currentUser) {
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
            else {
                setBaseErrors("Unable to edit lease. Please try again.")
            }
        }

        const chargeResults = await store.dispatch(loadChargesAndLedgerItems({leaseId: params.leaseId})).unwrap()

        let newChargesTotal = 0
        let newPaymentsTotal = 0

        chargeResults.data.ledger_items.forEach((ledgerItem) => {
            if (ledgerItem.type == "Charge") {
                newChargesTotal = newChargesTotal + parseFloat(ledgerItem.amount)
            }
            else {
                newPaymentsTotal = newPaymentsTotal + (parseFloat(ledgerItem.amount) * -1)
            }
        })
        setChargesTotal(newChargesTotal)
        setPaymentsTotal(newPaymentsTotal)
        setLedgerItems(chargeResults.data.ledger_items.reverse())
    }, [params.leaseId]);

    function runSearch(text, page) {
        return {total: ledgerItems.length, objects: ledgerItems}
    }

    function generateTableRow(ledgerItem, key) {
        return (<LedgerRow key={key} index={key} ledgerItem={ledgerItem} showActionLink={insightRoutes.renterLedgerDetail(params.leaseId, ledgerItem.hash_id)} />)
    }

    function closeModal() {
        navigate(insightRoutes.renterLeaseShow(params.leaseId))
    }

    return (
        <>
        {ledgerItems && <div className="section">
            {lease && leaseResident &&
                <RenterStatusBlock lease={lease} leaseResident={leaseResident} title="Ledger Details" />
            }

            <ListPage
                hideSearch={true}
                titleImage={<></>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                noDataMessage="No ledger items exist"
                reloadWhenChanges={ledgerItems}
                columns={
                    [
                        {label: "Description", class: "st-col-35", sort_by: "transaction_at"},
                        {label: "Charge", class: "st-col-15 text-right", sort_by: "amount", data_type: "float"},
                        {label: "Payment", class: "st-col-15 text-right", sort_by: "amount", data_type: "float"},
                        {label: "Balance", class: "st-col-15 text-right"},
                    ]
                }
                footerRow={
                    ledgerItems.length > 0 &&
                    <div className="st-row-wrap">
                        <div className="st-row">
                            <span className="st-col-35"><strong>Totals:</strong></span>
                            <span className="st-col-15 text-right">{insightUtils.numberToCurrency(chargesTotal, 2)}</span>
                            <span className="st-col-15 text-right">{insightUtils.numberToCurrency(paymentsTotal, 2)}</span>
                            <span className="st-col-15 text-right">{insightUtils.numberToCurrency(ledgerItems[0].balance, 2)}</span>
                            <span className="st-nav-col">&nbsp;</span>
                        </div>
                    </div>

                }
            />

            <div className="form-nav">
                <a onClick={closeModal} className="btn btn-gray"><span>Back</span></a>
                {lease?.previous_lease_hash_id && <Link to={insightRoutes.renterLedger(lease.previous_lease_hash_id)} className="btn btn-red">View Previous Ledger</Link>}
                {lease?.next_lease_hash_id && <Link to={insightRoutes.renterLedger(lease.next_lease_hash_id)} className="btn btn-red">View Next Ledger</Link>}
            </div>

            <Outlet />
        </div>
        }
        </>
    )}

export default RenterLedgerPage;

