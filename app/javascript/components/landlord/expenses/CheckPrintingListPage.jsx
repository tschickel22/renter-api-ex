import React, {useEffect, useState} from 'react';
import {reprintChecks, saveUnprintedChecks, deleteUnprintedChecks, searchForPrintedChecks, searchForUnprintedChecks} from "../../../slices/printedCheckSlice";
import store from "../../../app/store";

import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import FinancialNav from "../financial/FinancialNav";
import CheckPrintingListRow from "./CheckPrintingListRow";
import insightUtils from "../../../app/insightUtils";
import {Form, Formik} from "formik";
import {searchForBankAccounts} from "../../../slices/bankAccountSlice";
import {searchForAccounts} from "../../../slices/accountSlice";
import {useNavigate} from "react-router-dom";
import Modal from "../../shared/Modal";
import ExpenseListPage from "./ExpenseListPage";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const CheckPrintingListPage = ({mode}) => {

    let navigate = useNavigate()

    const { currentUser }= useSelector((state) => state.user)
    const { currentCompany }= useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [unprintedChecks, setUnprintedChecks] = useState(null)
    const [paymentAccounts, setPaymentAccounts] = useState([])
    const [checkPDFUrl, setCheckPDFUrl] = useState(null)
    const [numberOfPayments, setNumberOfPayments] = useState(0)
    const [deletingChecks, setDeletingChecks] = useState(false)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)

    useEffect(async() => {

        if (currentCompany) {
            // Load Bank Accounts
            const bankAccountResults = await store.dispatch(searchForBankAccounts({})).unwrap()

            // Load Accounts
            const accountResults = await store.dispatch(searchForAccounts({includeBalances: true})).unwrap()
            console.log("bankAccountResults", bankAccountResults)
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
        const results = mode =="print" ? await store.dispatch(searchForUnprintedChecks()).unwrap() : await store.dispatch(searchForPrintedChecks()).unwrap()

        let emptyPrintedChecks = {}

        results.data.printed_checks.forEach((printed_check) => {
            let newPrintedCheck = Object.assign({}, printed_check)

            if (mode == "reprint") newPrintedCheck.status = "" // Start with everything unchecked
            emptyPrintedChecks["l" + newPrintedCheck.hash_id] = newPrintedCheck
        })

        setUnprintedChecks(emptyPrintedChecks)

        return {total: Object.values(emptyPrintedChecks).length, objects: Object.values(emptyPrintedChecks)}
    }

    function generateTableRow(printedCheck, key) {
        return (<CheckPrintingListRow key={key} printedCheck={printedCheck} paymentAccounts={paymentAccounts} mode={mode} />)
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")
        setCheckPDFUrl(null)

        try {
            let newPrintedChecks = Object.values(values.printed_checks)
            setNumberOfPayments(newPrintedChecks.filter((p) => p.status).length)
            const result = mode =="print" ? await store.dispatch(saveUnprintedChecks({printedChecks: newPrintedChecks})).unwrap() : await store.dispatch(reprintChecks({printedChecks: newPrintedChecks})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                setCheckPDFUrl(response.redirect)
            }
            else if (response.errors) {

                let newErrors = {}

                // Need to turn errors back into hash form
                if (response.errors.printed_checks) {
                    Object.keys(response.errors.printed_checks).forEach((index) => {
                        const printedCheckErrors = response.errors.printed_checks[index]
                        if (Object.values(printedCheckErrors).length > 0) {
                            newErrors['l' + newPrintedChecks[index].hash_id] = printedCheckErrors
                        }
                    })

                    setErrors({printed_checks: newErrors})
                }

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }

                insightUtils.scrollTo('errors')
            }
        }
        catch(err) {
            console.log("UH-OH", err)
            setBaseErrorMessage("Unable to print checks")
            setSubmitting(false);
        }
    }

    async function handleDelete(values) {
        setBaseErrorMessage("")
        setDeletingSubmitted(true);

        try {
            let newPrintedChecks = Object.values(values.printed_checks)
            setNumberOfPayments(newPrintedChecks.filter((p) => p.status).length)
            const result = await store.dispatch(deleteUnprintedChecks({printedChecks: newPrintedChecks})).unwrap()
            const response = result.data

            console.log(response)

            setDeletingSubmitted(false);
            setDeletingChecks(false)

            if (response.success) {
                store.dispatch(displayAlertMessage({message: "The " + (Object.values(values.printed_checks).filter((p) => p.status).length == 1 ? "check has" : "checks have") + " been deleted"}))
                navigate(insightRoutes.billList())
            }
            else if (response.errors) {
                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }

                insightUtils.scrollTo('errors')
            }
        }
        catch(err) {
            console.log("UH-OH", err)
            setBaseErrorMessage("Unable to delete checks")
            setDeletingSubmitted(false);
            setDeletingChecks(false)
        }
    }

    return (
        <>
            {currentUser.expenses_edit && unprintedChecks && <div className="section">
                 <Formik
                        initialValues={{printed_checks: unprintedChecks}}
                        enableReinitialize={true}
                        onSubmit={handleFormikSubmit}
                    >
                        {({isSubmitting, values, setFieldValue}) => (
                            <>
                                <Form>
                                    <ListPage
                                        title={mode == "reprint" ? "Re-print Checks" : "Print Checks"}
                                        titleImage={<img className="section-img" src="/images/photo-accounting.jpg"/>}
                                        hideSearch={true}
                                        runSearch={runSearch}
                                        addButton={<>{mode =="print" && <a href={insightRoutes.billCheckReprinting()} className="btn btn-gray btn-sm"><span>Re-print Checks <i className="fas fa-print"></i></span></a>}</>}
                                        secondaryNav={baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}
                                        generateTableRow={generateTableRow}
                                        nav={<FinancialNav/>}
                                        defaultSortBy="due_on"
                                        defaultSortDir="asc"
                                        noDataMessage="No bills queued for printing"
                                        reloadWhenChanges={checkPDFUrl}
                                        columns={
                                            [
                                                {label: mode == "print" ? "Select to Print" : "Select to Re-print", class: "st-col-10", sort_by: "dummy"},
                                                {label: "Description", class: "st-col-25", sort_by: "description"},
                                                {label: "Amount", class: "st-col-15 hidden-md", sort_by: "amount", data_type: "float"},
                                                {label: "Paid Through", class: "st-col-25", sort_by: "payment_account"},
                                                {label: "Check #", class: "st-col-10 st-col-md-20", sort_by: 'check_number', data_type: "integer_or_string"},
                                                {label: mode == "print" ? "Balance" : "Date Printed", class: "st-col-15 hidden-md text-right", sort_by: "dummy"},
                                            ]
                                        }
                                    />

                                    <div className="form-row">
                                        <div className="st-col-100">
                                            <div className="form-nav">
                                                <a className="btn btn-gray" onClick={() => navigate(insightRoutes.billList())}>&lt; Back</a>
                                                {Object.keys(unprintedChecks).length > 0 && Object.values(values.printed_checks).filter((p) => p.status).length > 0 &&
                                                    <>
                                                        {mode == "print" && <a className="btn btn-red" disabled={isSubmitting} onClick={() => {setDeletingChecks(true)}}><span>Delete</span></a>}

                                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                            {isSubmitting && <span>Submitting...</span>}
                                                            {!isSubmitting && <span>{mode == "print" ? "Print" : "Re-print"}</span>}
                                                        </button>
                                                    </>
                                                }
                                            </div>
                                            {checkPDFUrl && !isSubmitting &&
                                                <>
                                                    <hr/>

                                                    <p className="text-center">Your {numberOfPayments == 1 ? "check is " : "checks are "} ready to print. Click the button below to open the PDF.</p>

                                                    <a href={checkPDFUrl} target="_blank" className="btn btn-red">View {numberOfPayments == 1 ? "Check" : "Checks"}</a>

                                                </>
                                            }
                                        </div>
                                    </div>
                                </Form>
                                {deletingChecks && <Modal closeModal={() => setDeletingChecks(false)}>
                                    <h2>Delete {Object.values(values.printed_checks).filter((p) => p.status).length == 1 ? "Check" : "Checks"}?</h2>
                                    <p className="text-center">Are you sure you want to delete {Object.values(values.printed_checks).filter((p) => p.status).length == 1 ? "this check" : " these checks"}?</p>

                                    <div className="form-nav">
                                        <div onClick={() => setDeletingChecks(false)} className="btn btn-gray"><span>Cancel</span></div>
                                        <div onClick={() => {if(!deletingSubmitted) handleDelete(values)}} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                                    </div>
                                </Modal>}
                            </>
                        )}
                    </Formik>
              </div>}
        </>

    )}

export default CheckPrintingListPage;

