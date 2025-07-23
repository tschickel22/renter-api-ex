import React, {useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const AccountReconciliationListRow = ({accountReconciliation}) => {
    let navigate = useNavigate()

    const { currentUser }= useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-col-lg-20 st-first-col">
                        <Link to={insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id)}>{accountReconciliation.bank_account_name}</Link>
                    </div>
                    <div className="st-col-15 hidden-md">
                        {accountReconciliation.bank_account_type_pretty}
                    </div>
                    <div className="st-col-15">
                        {insightUtils.formatDate(accountReconciliation.end_on)}
                    </div>
                    <div className="st-col-15 hidden-md">
                        {insightUtils.formatDate(accountReconciliation.closed_at) }
                    </div>
                    <div className="st-col-15">
                        {insightUtils.numberToCurrency(accountReconciliation.ending_balance, 2)}
                    </div>
                    <div className="st-col-15 hidden-md">
                        {insightUtils.numberToCurrency(accountReconciliation.difference, 2)}
                    </div>
                    <span className="st-nav-col hidden-sm">
                        <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <li onClick={()=>navigateAndClose(insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id))}><i className="fal fa-pencil"></i> {currentUser.accounting_edit ? "Edit" : "View"}</li>
                            {accountReconciliation.status == constants.account_reconciliation_status_options.closed.key && <li onClick={()=>navigateAndClose(insightRoutes.reportRun('reconciliation') + "?account_reconciliation_id=" + accountReconciliation.hash_id)}><i className="fal fa-pencil"></i> View Report</li>}
                        </RowMenu>
                    </span>
                </div>
            </div>

        </>

    )}

export default AccountReconciliationListRow;

