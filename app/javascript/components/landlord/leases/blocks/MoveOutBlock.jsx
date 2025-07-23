import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {Link} from "react-router-dom";
import ApplicationActionButton from "./ApplicationActionButton";
import {useSelector} from "react-redux";

const MoveOutBlock = ({lease}) => {

    return (
        <div className="flex-grid-item">
            <h3>Move-Out</h3>

            <div className="flex-line-block">Moved out {insightUtils.formatDate(lease.move_out_on)}</div>
            <div className="spacer"></div>
            <div className="flex-column flex-center btn-bottom">
                <Link to={insightRoutes.residentLedger(lease.hash_id)} className="btn btn-bottom btn-red"><span>View Final Statement</span></Link>
                {lease.ledger_balance > 0 &&
                <>
                    <div>&nbsp;</div>
                    <Link to={insightRoutes.financialPaymentNewChoose(lease.hash_id, lease.primary_resident.hash_id)} className="btn btn-red"><span>Make Payment  <i className="fal fa-dollar-circle"></i></span></Link>
                </>
                }
            </div>

        </div>
    )}

export default MoveOutBlock;

