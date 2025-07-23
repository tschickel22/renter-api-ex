import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import Modal from "../../shared/Modal";
import store from "../../../app/store";
import {deletePayment} from "../../../slices/paymentSlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";


const BulkChargeListRow = ({bulkCharge, setDeletingBulkCharge}) => {

    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-10 st-first-col">
                        {bulkCharge.created_at_pretty}
                    </div>
                    <span className="st-col-20" title="Next Due Date">
                        {insightUtils.formatDate(bulkCharge.due_on)}
                    </span>
                    <span className="st-col-25" title="Description">
                        {bulkCharge.description}
                    </span>
                    <span className="st-col-20" title="Frequency">
                        {bulkCharge.frequency_pretty}
                    </span>
                    <span className="st-col-25" title="Status">
                        {bulkCharge.status_pretty}
                    </span>
                    <span className="st-nav-col">
                        {currentUser.accounting_edit &&
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.bulkChargeEdit(bulkCharge.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                                {bulkCharge.status_pretty == "Scheduled" && <li onClick={() => setDeletingBulkCharge(bulkCharge)}><i className="fal fa-trash-alt"></i> Delete</li>}
                            </RowMenu>
                        }
                    </span>
                </div>
            </div>
        </>

    )
}

export default BulkChargeListRow;

