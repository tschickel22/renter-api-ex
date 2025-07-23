import React, {useEffect, useState} from 'react';
import {searchForExpenses} from "../../../slices/expenseSlice";
import store from "../../../app/store";

import {Link} from "react-router-dom";
import ExpenseListRow from "./ExpenseListRow";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import FinancialNav from "../financial/FinancialNav";
import BasicDropdown from "../../shared/BasicDropdown";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import CriteriaDateRange from "../reports/CriteriaDateRange";

const ExpenseListPage = ({type}) => {

    const { currentUser }= useSelector((state) => state.user)
    const { properties, settings }= useSelector((state) => state.company)

    const [propertyId, setPropertyId] = useState(null)
    const [currentSettings, setCurrentSettings] = useState(null)

    const [startDate, setStartDate] = useState(insightUtils.allTimeRange.startDate)
    const [endDate, setEndDate] = useState(insightUtils.allTimeRange.endDate)

    useEffect(async () => {
        if (settings) {
            setCurrentSettings(insightUtils.getSettings(settings, propertyId))
        }
    }, [settings, propertyId])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForExpenses({type: type, searchText: text, propertyId: propertyId, startDate: startDate, endDate: endDate})).unwrap()
        return {total: results.data.total, objects: results.data.expenses}
    }

    function handlePropertyChange(e) {
        setPropertyId(e.target.value)
    }

    function generateTableRow(expense, key) {
        return (<ExpenseListRow key={key} expense={expense} />)
    }

    function handleDateRangeChange(reportParams) {
        setStartDate(insightUtils.parseDate(reportParams.start_date))
        setEndDate(insightUtils.parseDate(reportParams.end_date))
    }

    function generateReportParams() {
        return {start_date: insightUtils.formatDate(startDate), end_date: insightUtils.formatDate(endDate), property_id: (propertyId ? propertyId : -1)}
    }

    return (
        <>
            {currentUser.expenses_view && <ListPage
                title={type == ExpenseListPage.TYPE_BILL ? "Billing" : "Expenses"}
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                nav={<FinancialNav />}
                runSearch={runSearch}
                addButton={
                    <div>
                        {type == ExpenseListPage.TYPE_BILL ?
                            <>
                                {currentUser.expenses_edit && <Link to={insightRoutes.billNew()} className="btn btn-red"><span>Record Bill <i className="fas fa-plus"></i></span></Link>}
                                &nbsp;
                                {currentUser.expenses_edit && <Link to={insightRoutes.billPayment()} className="btn btn-gray"><span>Record Payments <i className="fas fa-plus"></i></span></Link>}
                                {currentSettings && currentSettings.check_printing_enabled && currentUser.expenses_edit && <>
                                    &nbsp;
                                    <Link to={insightRoutes.billCheckPrinting()} className="btn btn-gray"><span>Print Checks <i className="fas fa-print"></i></span></Link>
                                </>}
                            </>
                            :
                            <>
                                {currentUser.expenses_edit && <Link to={insightRoutes.expenseNew()} className="btn btn-red"><span>Add Expense <i className="fas fa-plus"></i></span></Link>}
                                &nbsp;
                                {currentUser.expenses_edit && <Link to={insightRoutes.mileageNew()} className="btn btn-red"><span>Add Mileage <i className="fas fa-plus"></i></span></Link>}
                                &nbsp;
                                {currentUser.reports_view && <Link to={insightRoutes.reportRun("expenses", generateReportParams())} className="btn btn-red"><span>Export Expenses <i className="fa fa-file-export"></i></span></Link>}
                            </>
                        }
                    </div>}
                secondaryNav={
                    properties ? <Formik initialValues={{property_id: null}}>
                        {({  }) => (
                            <div className="st-nav">
                                <Form>
                                    <div className="form-item">
                                        <BasicDropdown blankText="All Properties" name="property_id" options={properties} onChange={handlePropertyChange}/>
                                    </div>
                                </Form>
                                <div className="flex flex-row" style={{marginTop: "8px"}}>
                                    {currentUser.reports_view && <>
                                        <Link to={insightRoutes.reportRun("expense_payments", generateReportParams())}>View Paid Bills</Link>
                                        &nbsp;&nbsp;&nbsp;|
                                    </>}
                                    <CriteriaDateRange report={{params: {start_date: startDate, end_date: endDate}}} labelPrefix="Date Range: " handleRerunReport={handleDateRangeChange}/>
                                </div>
                            </div>
                        )}
                    </Formik> : null
                }
                columns={
                    type == ExpenseListPage.TYPE_BILL ?
                        [
                            {label: "Description", class: "st-col-15 st-col-md-25", sort_by: "description"},
                            {label: "Vendor", class: "st-col-15 hidden-md", sort_by: "vendor_name"},
                            {label: "Property", class: "st-col-15 st-col-md-25", sort_by: "property_name"},
                            {label: "Amount Due", class: "st-col-15 st-col-md-25", sort_by: "amount"},
                            {label: "Due Date", class: "st-col-10 st-col-md-25", sort_by: "due_on"},
                            {label: "Status", class: "st-col-15 hidden-md", sort_by: "payment_status_sort"}
                        ]
                        :
                        [
                            {label: "Description", class: "st-col-15 st-col-md-25", sort_by: "description"},
                            {label: "Vendor", class: "st-col-15 hidden-md", sort_by: "vendor_name"},
                            {label: "Location", class: "st-col-15 st-col-md-25", sort_by: "property_name"},
                            {label: "Category", class: "st-col-15 hidden-md", sort_by: "account_name"},
                            {label: "Amount", class: "st-col-15 st-col-md-25", sort_by: "amount", data_type: "float"},
                            {label: "Date", class: "st-col-10 st-col-md-25", sort_by: "due_on"}
                        ]
                }
                defaultSortBy={type == ExpenseListPage.TYPE_BILL ? "payment_status_sort" : "paid_on"}
                defaultSortDir={type == ExpenseListPage.TYPE_BILL ? "asc" : "desc"}
                reloadWhenChanges={[startDate, endDate, type, propertyId]}
                noDataMessage={type == ExpenseListPage.TYPE_BILL ? "There are no unpaid bills" : "No expenses have been entered"}
                generateTableRow={generateTableRow}
            />}
        </>

    )}

ExpenseListPage.TYPE_BILL = "Bill"
ExpenseListPage.TYPE_EXPENSE = "Expense"

export default ExpenseListPage;

