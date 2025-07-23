import React, {useState, useEffect} from 'react';
import {Link, Outlet, useNavigate, useParams} from 'react-router-dom'

import insightRoutes from "../../../app/insightRoutes";

import LedgerRow from "./LedgerRow";
import {loadLease} from "../../../slices/leaseSlice";
import {useSelector} from "react-redux";

import StatusBlock from "../leases/blocks/StatusBlock";
import ListPage from "../../shared/ListPage";
import insightUtils from "../../../app/insightUtils";

import {deleteCharge, loadChargesAndLedgerItems} from "../../../slices/chargeSlice";
import store from "../../../app/store";
import Modal from "../../shared/Modal";
import {deletePayment, refundPayment} from "../../../slices/paymentSlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const ResidentLedgerPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { currentUser, currentActualUser } = useSelector((state) => state.user)

    const [ledgerItems, setLedgerItems] = useState(null)
    const [lease, setLease] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

    const [refundingLedgerItem, setRefundingLedgerItem] = useState(null)
    const [refundingSubmitted, setRefundingSubmitted] = useState(false)
    const [deletingLedgerItem, setDeletingLedgerItem] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)
    const [reloadLedger, setReloadLedger] = useState(false)

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

    }, [reloadLedger, params.leaseId]);

    function runSearch(text, page) {
        return {total: ledgerItems.length, objects: ledgerItems}
    }

    function confirmRefund(ledgerItem) {

        if (ledgerItem.payment_id) {
            setRefundingLedgerItem(ledgerItem)
        }
    }

    async function handleRefund() {
        setRefundingSubmitted(true)
        const results = await store.dispatch(refundPayment({paymentId: refundingLedgerItem.payment_id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Refund Submitted"}))
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }

        setReloadLedger(true)
        cancelRefund()

    }

    function cancelRefund() {
        setRefundingLedgerItem(null)
        setRefundingSubmitted(false)
    }

    function confirmDelete(ledgerItem) {
        setDeletingLedgerItem(ledgerItem)
    }

    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deletePayment({paymentId: deletingLedgerItem.payment_id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: deletingLedgerItem.type + " Deleted"}))
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }

        setReloadLedger(true)
        cancelDelete()

    }

    function cancelDelete() {
        setDeletingLedgerItem(null)
        setDeletingSubmitted(false)
    }

    function handleEdit(ledgerItem) {
        if (ledgerItem.type == "Charge") {
            if (currentActualUser && (currentActualUser.user_type == "admin" || currentUser.payments_delete)) {
                navigate(insightRoutes.residentLedgerEdit(lease.hash_id, ledgerItem.hash_id))
            }
            else {
                navigate(insightRoutes.financialChargeEdit(ledgerItem.charge_id))
            }

        }
        else {
            navigate(insightRoutes.financialPaymentEdit(ledgerItem.payment_id))
        }
    }

    function generateTableRow(ledgerItem, key) {

        let newLedgerItem = Object.assign({}, ledgerItem)
        let newActionLink = insightRoutes.residentLedgerDetail(params.leaseId, ledgerItem.hash_id)

        // If this is a roll-over, grab it and update the details/link
        if (ledgerItem && ledgerItem.description.indexOf("rolled from old lease") > 0 && lease.previous_lease_hash_id) {
            newLedgerItem.description = newLedgerItem.description.replace("Fees: ", "") + " - View"
            newActionLink = insightRoutes.residentLedger(lease.previous_lease_hash_id)
        }
        else if (ledgerItem && ledgerItem.description.indexOf("rolled to new lease") > 0 && lease.next_lease_hash_id) {
            newLedgerItem.description = newLedgerItem.description.replace("Fees: ", "") + " - View"
            newActionLink = insightRoutes.residentLedger(lease.next_lease_hash_id)
        }

        return (<LedgerRow key={key} index={key}
                                  ledgerItem={newLedgerItem}
                                  showActionLink={newActionLink}
                                  confirmRefund={confirmRefund}
                                  confirmDelete={confirmDelete}
                                  handleEdit={handleEdit}
        />)
    }

    function closeModal() {
        navigate(insightRoutes.leaseShow(params.leaseId))
    }

    return (
        <>
            <div className="section">
                {lease &&
                    <StatusBlock lease={lease} title="Ledger" />
                }

                {lease && ledgerItems &&
                    <>
                        <div className="section-table-wrap">
                            <div className="section-table">
                                <div className="st-table-scroll">
                                    <div className="st-row-wrap">
                                        <div className="st-row hidden-print" style={{justifyContent: "center"}}>
                                            <Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id)} className="btn btn-red">Add Charge</Link>&nbsp;&nbsp;
                                            <Link to={insightRoutes.financialPaymentNewChoose(lease.hash_id, lease.primary_resident.hash_id)} state={{return_url: location.pathname}} className="btn btn-green">Record Payment</Link>&nbsp;&nbsp;
                                            <a className="btn btn-gray" onClick={() => window.print()}>&nbsp;Print <i className="fa fa-print"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ListPage
                            hideSearch={true}
                            titleImage={<></>}
                            runSearch={runSearch}
                            generateTableRow={generateTableRow}
                            noDataMessage="No ledger items exist"
                            reloadWhenChanges={ledgerItems}
                            numberPerPage={100000}
                            columns={
                                [
                                    {label: "Description", class: "st-col-35", sort_by: "transaction_at"},
                                    {label: "Charge", class: "st-col-15 text-right", sort_by: "amount", data_type: "float"},
                                    {label: "Payment", class: "st-col-15 text-right", sort_by: "amount", data_type: "float"},
                                    {label: "Balance", class: "st-col-15 text-right"},
                                    {label: "Action", class: "st-col-20 hidden-md hidden-print text-right"},
                                    {label: "", class: "text-right"},
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
                                        <span className="st-col-20 hidden-md hidden-print"></span>
                                        <span className="st-nav-col">&nbsp;</span>
                                    </div>
                                </div>

                            }
                        />
                    </>
                }

                {!lease && !ledgerItems && <div className="loading">Loading...</div>}

                <div className="form-nav">
                    <a onClick={closeModal} className="btn btn-gray"><span>Back</span></a>
                    {lease?.previous_lease_hash_id && <Link to={insightRoutes.residentLedger(lease.previous_lease_hash_id)} className="btn btn-red">View Previous Ledger</Link>}
                    {lease?.next_lease_hash_id && <Link to={insightRoutes.residentLedger(lease.next_lease_hash_id)} className="btn btn-red">View Next Ledger</Link>}
                </div>

                <Outlet />
            </div>

            {refundingLedgerItem && <Modal closeModal={() => cancelRefund()}>
                <h2>Refund Payment?</h2>
                <p className="text-center">Are you sure you want to refund {insightUtils.numberToCurrency(Math.abs(refundingLedgerItem.amount) , 2)}? Once confirmed, the funds will be returned in approximately 3 business days.</p>

                <div className="form-nav">
                    <div onClick={() => cancelRefund()} className="btn btn-gray"><span>Cancel</span></div>
                    <div onClick={() => handleRefund()} className="btn btn-red"><span>{refundingSubmitted ? "Processing..." : "Refund"}</span></div>
                </div>
            </Modal>}

            {deletingLedgerItem && <Modal closeModal={() => cancelDelete()}>
                <h2>Delete {deletingLedgerItem.type}?</h2>
                <p className="text-center">Are you sure you want to delete this {deletingLedgerItem.type} of {insightUtils.numberToCurrency(Math.abs(deletingLedgerItem.amount) , 2)}?</p>

                <div className="form-nav">
                    <div onClick={() => cancelDelete()} className="btn btn-gray"><span>Cancel</span></div>
                    <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                </div>
            </Modal>}
        </>
    )}

export default ResidentLedgerPage;

