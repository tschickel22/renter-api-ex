import React from 'react';
import {Link, NavLink} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const FinancialNav = ({}) => {

    const { currentUser }= useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)

    return (
        <>
            <div className="horiz-nav">
                <div>&nbsp;</div>

                <ul className="horiz-nav-list">
                    <li className="hn-item">Accounting<i className="fas fa-caret-down"></i>
                        <ul className="nav-dropdown">
                            {currentUser.accounting_view && <li><NavLink to={insightRoutes.accountReconciliationList()} className="nav-item">Reconcile Accounts</NavLink></li>}
                            {currentUser.accounting_view && <li><NavLink to={insightRoutes.accountList()} className="nav-item">Chart of Accounts</NavLink></li>}
                            {currentUser.reports_view && <li><NavLink to={insightRoutes.financialSummary()}>Financial Summary</NavLink></li>}
                            {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key && <li><NavLink to={insightRoutes.propertyBankAccountList()}>Property Bank Accounts</NavLink></li>}
                            {currentUser.expenses_view && <li><NavLink to={insightRoutes.billList()}>Billing</NavLink></li>}
                            {currentUser.expenses_view && <li><NavLink to={insightRoutes.expenseList()}>Expenses</NavLink></li>}
                            {currentUser.accounting_view && <li><NavLink to={insightRoutes.journalEntryList()}>Journal Entries</NavLink></li>}
                            {currentUser.accounting_view && <li><NavLink to={insightRoutes.financialConnectionList()}>Bank Transactions</NavLink></li>}
                            {currentUser.accounting_view && <li><NavLink to={insightRoutes.taxReportingList()}>1099 Reporting</NavLink></li>}
                        </ul>
                    </li>
                    {((currentUser.payments_view && currentUser.reports_view) || currentUser.payments_edit) && <li className="hn-item">Resident Payments<i className="fas fa-caret-down"></i>
                        <ul className="nav-dropdown">
                            {currentUser.payments_edit && <li><NavLink to={insightRoutes.financialPaymentDueManual()}>Apply Payments</NavLink></li>}
                            {currentUser.payments_edit && currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key && <li><NavLink to={insightRoutes.financialPaymentDueAuto()}>Make Credit Card or ACH Payment</NavLink></li>}
                            {currentUser.reports_view && <li><NavLink to={insightRoutes.reportRun('manual_payments')}>View Applied Payments</NavLink></li>}
                        </ul>
                    </li>}

                    {currentUser.residents_edit && <li className="hn-item">Transactions<i className="fas fa-caret-down"></i>
                        <ul className="nav-dropdown">
                            <li><NavLink to={insightRoutes.financialChargeNew()}>Create Resident Charge</NavLink></li>
                            <li><NavLink to={insightRoutes.bulkChargeList()}>Bulk Charges</NavLink></li>
                        </ul>
                    </li>}

                    {currentUser.reports_view && <li className="hn-item btn-rd-ledger">Reports<i className="fas fa-caret-down"></i>
                        <ul className="nav-dropdown">
                            {Object.keys(insightUtils.reportList()).map((reportId) => (<li key={reportId}><NavLink to={insightRoutes.reportRun(reportId)}>{insightUtils.reportList()[reportId]}</NavLink></li>))}
                            <li><NavLink to={insightRoutes.companyHistory("my")}>Company History</NavLink></li>
                        </ul>
                    </li>}
                </ul>

                <div>&nbsp;</div>

            </div>
        </>

    )}

export default FinancialNav;


