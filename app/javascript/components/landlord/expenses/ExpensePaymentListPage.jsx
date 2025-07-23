import React, {useEffect, useState} from 'react';
import {saveExpensePayments, searchForExpenses} from "../../../slices/expenseSlice";
import store from "../../../app/store";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import FinancialNav from "../financial/FinancialNav";
import ExpenseListPage from "./ExpenseListPage";
import ExpensePaymentListRow from "./ExpensePaymentListRow";
import insightUtils from "../../../app/insightUtils";
import {Form, Formik} from "formik";
import {searchForBankAccounts} from "../../../slices/bankAccountSlice";
import {searchForAccounts} from "../../../slices/accountSlice";
import {useNavigate} from "react-router-dom";

const ExpensePaymentListPage = () => {

    let navigate = useNavigate()

    const { currentUser }= useSelector((state) => state.user)
    const { currentCompany, settings, constants }= useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [unpaidExpensePayments, setUnpaidExpensePayments] = useState(null)
    const [paymentAccounts, setPaymentAccounts] = useState([])

    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(async () => {
        if (settings) {
            setCurrentSettings(insightUtils.getSettings(settings))
        }
    }, [settings])

    useEffect(async() => {

        if (currentCompany) {
            // Load Bank Accounts
            const bankAccountResults = await store.dispatch(searchForBankAccounts({})).unwrap()

            // Load Accounts
            const accountResults = await store.dispatch(searchForAccounts({})).unwrap()
            const newPaymentAccounts = accountResults.data.accounts.filter((account) => {
                // Only include accounts that are linked to bank accounts
                const matchingBankAccount = bankAccountResults.data.bank_accounts.find((bankAccount) => bankAccount.account_id == account.id)
                return !!matchingBankAccount
            })

            setPaymentAccounts(insightUtils.sortByName(newPaymentAccounts))

        }
    }, [currentCompany])

    useEffect(() => {
        runSearch()
    }, [])

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForExpenses({type: ExpenseListPage.TYPE_BILL, mode: "unpaid", searchText: text, page: page})).unwrap()

        let emptyPayments = {}

        results.data.expenses.forEach((expense) => {
            let payment = insightUtils.emptyPayment()
            payment.amount = expense.amount_due
            payment.due_on = expense.due_on
            payment.expense_hash_id = expense.hash_id
            payment.invoice_number = expense.invoice_number
            payment.vendor_name = expense.vendor_name
            payment.description = expense.description
            payment.from_account_id = ""
            payment.expense_payment_status = ""

            emptyPayments["l" + payment.expense_hash_id] = payment
        })

        setUnpaidExpensePayments(emptyPayments)

        return {total: Object.values(emptyPayments).length, objects: Object.values(emptyPayments)}
    }

    function generateTableRow(payment, key) {
        return (<ExpensePaymentListRow key={key} payment={payment} paymentAccounts={paymentAccounts} printingEnabled={currentSettings && currentSettings.check_printing_enabled} />)
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        try {
            // Set the payment date
            let newPayments = Object.values(values.payments)

            const result = await store.dispatch(saveExpensePayments({payments: newPayments})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                // Were any queued for printing? If so, jump straight there
                const queued = newPayments.find((payment) => (payment.expense_payment_status == constants.expense_payment_statuses.paper_check_queued.key))

                if (queued) {
                    navigate(insightRoutes.billCheckPrinting())
                }
                else {
                    navigate(insightRoutes.billList())
                }
            }
            else if (response.errors) {

                let newErrors = {}

                // Need to turn errors back into hash form
                if (response.errors.payments) {
                    Object.keys(response.errors.payments).forEach((index) => {
                        const paymentErrors = response.errors.payments[index]
                        if (Object.values(paymentErrors).length > 0) {
                            newErrors['l' + newPayments[index].expense_hash_id] = paymentErrors
                        }
                    })

                    setErrors({payments: newErrors})
                }

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }

                insightUtils.scrollTo('errors')
            }
        }
        catch(err) {
            console.log("UH-OH", err)
            setBaseErrorMessage("Unable to save payments")
            setSubmitting(false);
        }
    }

    return (
        <>
            {currentUser.expenses_edit && unpaidExpensePayments && <div className="section">

                <Formik
                    initialValues={{payments: unpaidExpensePayments}}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <>
                            <Form>
                                <ListPage
                                    title="Record Payments"
                                    titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                                    hideSearch={true}
                                    runSearch={runSearch}
                                    addButton={baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}
                                    generateTableRow={generateTableRow}
                                    nav={<FinancialNav/>}
                                    defaultSortBy="due_on"
                                    defaultSortDir="asc"
                                    noDataMessage="No unpaid bills found"
                                    columns={
                                        [
                                            {label: "Description", class: "st-col-25 st-col-md-50", sort_by: "description"},
                                            {label: "Pay From", class: "st-col-25 st-col-md-50", sort_by: "payment_account"},
                                            {label: "Amount", class: "st-col-10 hidden-md", sort_by: "dummy"},
                                            {label: "Payment Method", class: "st-col-25 hidden-md", sort_by: "dummy"},
                                            {label: "Handwritten Check #", class: "st-col-15 hidden-md", sort_by: "dummy"},
                                        ]
                                    }
                                />

                                <div className="form-row">
                                    <div className="st-col-100 form-nav">
                                        <a className="btn btn-gray" onClick={() => navigate(insightRoutes.billList())}>&lt; Back</a>

                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <span>Submitting...</span>}
                                            {!isSubmitting && <span>Save</span>}
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        </>
                    )}
                </Formik>
              </div>}
        </>

    )}

export default ExpensePaymentListPage;

