import React, {useState} from 'react';
import store from "../../../app/store";

import {Link} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import FinancialNav from "./FinancialNav";
import {useSelector} from "react-redux";
import {deleteBulkCharge, searchForBulkCharges} from "../../../slices/chargeSlice";
import BulkChargeListRow from "./BulkChargeListRow";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import Modal from "../../shared/Modal";

const BulkChargeListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    const [deletingBulkCharge, setDeletingBulkCharge] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)
    const [reloadCount, setReloadCount] = useState(0)

    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deleteBulkCharge({bulkChargeId: deletingBulkCharge.hash_id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Bulk Charge Deleted"}))
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }

        setReloadCount(reloadCount + 1)
        setDeletingBulkCharge(null)

    }

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForBulkCharges({searchText: text})).unwrap()
        return {total: results.data.total, objects: results.data.bulk_charges}
    }

    function generateTableRow(bulkCharge, key) {
        return (<BulkChargeListRow key={key} bulkCharge={bulkCharge} setDeletingBulkCharge={setDeletingBulkCharge} />)
    }

    return (
        <>
            {currentUser.residents_view &&
                <ListPage
                    nav={<FinancialNav />}
                    titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                    title="Bulk Charges"
                    runSearch={runSearch}
                    defaultSortBy="created_at"
                    defaultSortDir="desc"
                    addButton={currentUser.residents_edit ? <Link to={insightRoutes.bulkChargeNew()} className="btn btn-red"><span>Add Bulk Charge <i className="fas fa-plus"></i></span></Link> : null}
                    columns={[
                        {label: "Created", class: "st-col-10", sort_by: "created_at_pretty"},
                        {label: "Next Due Date", class: "st-col-20", sort_by: "due_on"},
                        {label: "Description", class: "st-col-25", sort_by: "description"},
                        {label: "Frequency", class: "st-col-20", sort_by: "frequency_pretty"},
                        {label: "Status", class: "st-col-25", sort_by: "status_pretty"},
                        {sort_by: "created_at", hidden: true}
                    ]}
                    generateTableRow={generateTableRow}
                    noDataMessage="No Bulk Charges have been created"
                    reloadWhenChanges={reloadCount}
                />}

            {deletingBulkCharge && <Modal closeModal={() => setDeletingBulkCharge(null)}>
                <h2>Delete Bulk Charge?</h2>
                <p className="text-center">Are you sure you want to delete this bulk charge?</p>

                <div className="form-nav">
                    <div onClick={() => setDeletingBulkCharge(null)} className="btn btn-gray"><span>Cancel</span></div>
                    <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                </div>
            </Modal>}
        </>
    )}

export default BulkChargeListPage;
