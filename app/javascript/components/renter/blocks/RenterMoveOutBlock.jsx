import React, {useEffect, useState} from 'react';
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {getMoveOutDocuments} from "../../../slices/leaseSlice";
import DocumentListView from "../../landlord/leases/DocumentListView";

const RenterMoveOutBlock = ({lease, leaseResident}) => {

    const [uploadedFiles, setUploadedFiles] = useState([])

    useEffect(async() => {

        if (lease) {
            // Load existing attachments
            const results = await store.dispatch(getMoveOutDocuments({leaseId: lease.hash_id})).unwrap()

            if (results.data.move_out_documents) {
                setUploadedFiles(results.data.move_out_documents)
            }

        }
    }, [lease]);

    return (
        <div className="flex-grid-item">
            <h3>Move-Out</h3>

            <div className="flex-line-block">Moved out {insightUtils.formatDate(lease.move_out_on)}</div>
            <DocumentListView label="Move Out Documents" uploadedFiles={uploadedFiles} />

            <div className="spacer"></div>
            <div className="flex-column flex-center btn-bottom">
                <Link to={insightRoutes.renterLedger(lease.hash_id)} className="btn btn-red"><span>View Final Statement</span></Link>
                {lease.ledger_balance > 0 &&
                <>
                    <div>&nbsp;</div>
                    <Link to={insightRoutes.renterPaymentNew(lease.hash_id, leaseResident.hash_id)} className="btn btn-red"><span>Make Payment <i className="fal fa-dollar-circle"></i></span></Link>
                </>
                }
            </div>


            <div className="flex-line-block"></div>
        </div>
    )}

export default RenterMoveOutBlock;

