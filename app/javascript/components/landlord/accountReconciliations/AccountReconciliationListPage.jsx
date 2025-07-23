import React, {useEffect, useState} from 'react';
import store from "../../../app/store";

import {Link} from "react-router-dom";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import FinancialNav from "../financial/FinancialNav";
import {searchForAccountReconciliations} from "../../../slices/accountReconciliationSlice";
import AccountReconciliationListRow from "./AccountReconciliationListRow";
import {Form, Formik} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import {loadReconcilableAccounts} from "../../../slices/bankAccountSlice";
import insightUtils from "../../../app/insightUtils";
import CriteriaDateRange from "../reports/CriteriaDateRange";
import moment from "moment";

const AccountReconciliationListPage = ({}) => {

    const { currentUser }= useSelector((state) => state.user)

    const [startDate, setStartDate] = useState(insightUtils.yearToDateRange.startDate)
    const [endDate, setEndDate] = useState(insightUtils.yearToDateRange.endDate)

    const [reconcilableAccounts, setReconcilableAccounts] = useState(null)
    const [searchByBankAccountId, setSearchByBankAccountId] = useState(null)

    useEffect(async() => {
        // Load eligible accounts
        const result = await store.dispatch(loadReconcilableAccounts()).unwrap()

        setReconcilableAccounts(insightUtils.sortByName(result.data.bank_accounts))

    }, [])

    async function runSearch(text, _page) {
        const results = await store.dispatch(searchForAccountReconciliations({searchText: text, bankAccountId: searchByBankAccountId, startDate: startDate, endDate: endDate})).unwrap()
        return {total: results.data.total, objects: results.data.account_reconciliations}
    }

    function generateTableRow(accountReconciliation, key) {
        return (<AccountReconciliationListRow key={key} accountReconciliation={accountReconciliation} />)
    }

    function handleBankAccountChange(e) {
        setSearchByBankAccountId(e.target.value)
    }

    function handleDateRangeChange(reportParams) {
        setStartDate(insightUtils.parseDate(reportParams.start_date))
        setEndDate(insightUtils.parseDate(reportParams.end_date))
    }

    return (
        <>
            {currentUser.accounting_view && <ListPage
                title="Account Reconciliations"
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                nav={<FinancialNav />}
                runSearch={runSearch}
                addButton={currentUser.accounting_edit ? <Link to={insightRoutes.accountReconciliationNew()} className="btn btn-red"><span>Reconcile Account <i className="fas fa-plus"></i></span></Link> : null}
                reloadWhenChanges={[startDate, endDate, searchByBankAccountId]}
                secondaryNav={
                    reconcilableAccounts ? <Formik initialValues={{bank_account_id: searchByBankAccountId}}>
                        {({  }) => (
                            <Form>
                                <div className="st-nav st-nav-md-margin-20">
                                    <div className="form-item flex-nowrap">
                                        <BasicDropdown name="bank_account_id" options={reconcilableAccounts} onChange={(e) => handleBankAccountChange(e)} extraClass="form-select-wide" blankText="-- Select Account --" />
                                    </div>
                                    <div style={{marginTop: "8px"}}>
                                        <CriteriaDateRange report={{params: {start_date: startDate, end_date: endDate}}} handleRerunReport={handleDateRangeChange} />
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik> : null
                }
                columns={[
                    {label: "Account", class: "st-col-25 st-col-lg-20", sort_by: "bank_account_name"},
                    {label: "Type", class: "st-col-15 hidden-md", sort_by: "bank_account_type_pretty"},
                    {label: "Ending On", class: "st-col-15", sort_by: "end_on"},
                    {label: "Reconciled On", class: "st-col-15 hidden-md", sort_by: "closed_at"},
                    {label: "Ending Balance", class: "st-col-15", sort_by: "ending_balance"},
                    {label: "Changes", class: "st-col-15 hidden-md", sort_by: "difference"},
                ]}
                defaultSortBy="end_on"
                defaultSortDir="desc"
                noDataMessage="No reconciliations have been entered"
                generateTableRow={generateTableRow}
            />}
        </>

    )}

export default AccountReconciliationListPage;

