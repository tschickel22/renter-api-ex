import React, {useEffect, useRef, useState} from 'react';
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {Form, Formik, setIn} from "formik";
import {finalizeAccountReconciliation, loadAccountEntriesForReconciliation, loadAccountReconciliation, saveAccountReconciliation} from "../../../slices/accountReconciliationSlice";
import {Link, useNavigate, useParams} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import AccountReconciliationItemListRow from "./AccountReconciliationItemListRow";
import FormItem from "../../shared/FormItem";
import DatePicker from "react-datepicker";
import ToolTip from "../../shared/ToolTip";


const AccountReconciliationEditPage = ({}) => {
    let navigate = useNavigate()
    let params = useParams();
    let formRef = useRef()

    const {currentUser} = useSelector((state) => state.user)
    const {constants} = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [accountReconciliation, setAccountReconciliation] = useState(null)
    const [accountEntries, setAccountEntries] = useState(null)

    const [debitLabel, setDebitLabel] = useState("")
    const [creditLabel, setCreditLabel] = useState("")

    const [inEditMode, setInEditMode] = useState(false)
    const [inCongratulationsMode, setInCongratulationsMode] = useState(false)
    const [calculationsComplete, setCalculationsComplete] = useState(false)
    const [clearedItems, setClearedItems] = useState([])

    const [difference, setDifference] = useState(0)
    const [clearedBalance, setClearedBalance] = useState(0)
    const [debitAmount, setDebitAmount] = useState(0)
    const [creditAmount, setCreditAmount] = useState(0)

    const [debitCount, setDebitCount] = useState(0)
    const [creditCount, setCreditCount] = useState(0)

    const [itemsMode, setItemsMode] = useState("all")

    useEffect(async () => {
        // Load eligible accounts
        const result = await store.dispatch(loadAccountReconciliation({accountReconciliationId: params.accountReconciliationId})).unwrap()
        handleSetAccountReconciliation(result.data.account_reconciliation)

    }, [])

    useEffect( () => {

        if (accountEntries) {
            updateClearedBalance()
        }
    }, [accountEntries])

    function handleSetAccountReconciliation(account_reconciliation) {
        let newAccountReconciliation = Object.assign({}, account_reconciliation)

        newAccountReconciliation.begin_on = insightUtils.parseDate(newAccountReconciliation.begin_on)
        newAccountReconciliation.end_on = insightUtils.parseDate(newAccountReconciliation.end_on)

        if (newAccountReconciliation.bank_account_type == constants.bank_account_types.credit_card.key) {
            setDebitLabel("Charge")
            setCreditLabel("Payment")
        }
        else {
            setDebitLabel("Payment")
            setCreditLabel("Deposit")
        }

        setAccountReconciliation(newAccountReconciliation)
    }

    async function handleFormikSubmit(values, {setSubmitting, setErrors}) {
        setBaseErrorMessage("")

        const results = await store.dispatch(saveAccountReconciliation({accountReconciliation: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            if (inEditMode) {

                // Update the ending balance with the parsed version
                handleSetAccountReconciliation(response.account_reconciliation)

                setInEditMode(false)
            }
        } else if (response.errors) {

            // Make sure errors show up on the in-page edit

            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }
    async function handleFinalizeReconciliation(values) {
        setBaseErrorMessage("")

        const results = await store.dispatch(finalizeAccountReconciliation({accountReconciliation: values})).unwrap()
        const response = results.data

        if (response.success) {
            setInCongratulationsMode(true)
        }
        else if (response.errors) {

            // Make sure errors show up on the in-page edit
            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    async function runSearch(_text, _page) {
        const results = await store.dispatch(loadAccountEntriesForReconciliation({accountReconciliationId: params.accountReconciliationId})).unwrap()
        console.log("AE", results)
        setAccountEntries(results.data.account_entries)

        return {total: results.data.total, objects: results.data.account_entries}
    }

    function generateTableRow(accountEntry, key) {
        return (<AccountReconciliationItemListRow key={key} itemsMode={itemsMode} accountReconciliation={accountReconciliation} accountEntry={accountEntry} updateClearedBalance={updateClearedBalance} />)
    }

    function updateClearedBalance() {
        // Wait a moment... let the values settle
        setTimeout(() => {
            if (formRef && formRef.current && formRef.current.values.account_entry_object_ids) {

                const newClearedItems = accountEntries.filter((ae) => formRef.current.values.account_entry_object_ids.indexOf(ae.related_object_type_and_id) >= 0)
                const newClearedItemsIds = newClearedItems.map((ae) => ae.related_object_type_and_id)

                // Calculate new totals
                let newCreditAmount = 0
                let newDebitAmount = 0
                let newCreditCount = 0
                let newDebitCount = 0

                newClearedItems.forEach((ae) => {
                    if (ae.amount < 0) {
                        newCreditCount = newCreditCount + 1
                        newCreditAmount = newCreditAmount - parseFloat(ae.amount)
                    }
                    else {
                        newDebitCount = newDebitCount + 1
                        newDebitAmount = newDebitAmount + parseFloat(ae.amount)
                    }
                })

                const newClearedBalance = (parseFloat(formRef.current.values.beginning_balance) - newDebitAmount) + newCreditAmount

                setClearedBalance(newClearedBalance)
                setCreditAmount(newCreditAmount)
                setDebitAmount(newDebitAmount)
                setCreditCount(newCreditCount)
                setDebitCount(newDebitCount)
                setClearedItems(newClearedItems)
                setDifference(parseFloat(parseFloat(formRef.current.values.ending_balance) - newClearedBalance).toFixed(2))

                // Push back to the server to save state
                let newAccountReconciliation = Object.assign({}, accountReconciliation)

                // But don't bother if nothing has changed
                if (newAccountReconciliation.account_entry_object_ids.length != newClearedItems.length || !newAccountReconciliation.account_entry_object_ids.every((aeId) => newClearedItemsIds.indexOf(aeId) >= 0)) {
                    newAccountReconciliation.account_entry_object_ids = newClearedItemsIds
                    store.dispatch(saveAccountReconciliation({accountReconciliation: newAccountReconciliation}))
                }

                setCalculationsComplete(true)
            }
        }, 100)
    }

    function checkAll() {

        let allAccountEntryIds = []

        // Are all already checked?
        if (formRef.current.values.account_entry_object_ids.length != accountEntries.length) {
            allAccountEntryIds = accountEntries.map((ae) => ae.related_object_type_and_id)
        }

        formRef.current.setFieldValue("account_entry_object_ids", allAccountEntryIds)

        updateClearedBalance()

    }

    function closeView() {
        navigate(insightRoutes.accountReconciliationList())
    }

    return (
        <>
            <div className="section">
                {accountReconciliation && currentUser.accounting_edit && <>
                    <Formik
                        initialValues={accountReconciliation}
                        enableReinitialize={true}
                        onSubmit={handleFormikSubmit}
                        innerRef={formRef}
                    >
                        {({isSubmitting, values, setFieldValue, submitForm, resetForm}) => (
                            <Form>
                                <div className="title-block">
                                    <h1>Reconcile<span className="hidden-sm"> | {accountReconciliation.bank_account_name}</span></h1>
                                    <h2 className="visible-sm">{accountReconciliation.bank_account_name}</h2>

                                        {inEditMode ?
                                            <div style={{width: "25%", margin: "20px auto 0", padding: "20px", minWidth: "250px", background: "#EEE", borderRadius: "5px"}}>
                                                <FormItem label="Ending Date" name="end_on">
                                                    <DatePicker className="form-input form-input-white" selected={values.end_on} onChange={(date) => setFieldValue("end_on", date)} />
                                                </FormItem>
                                                <br/>
                                                <FormItem label="Ending Balance" name="ending_balance" mask={insightUtils.currencyMask(true)} />
                                                <br/>
                                                <a onClick={() => {resetForm() ; setInEditMode(false)}} className="btn btn-sm btn-gray">Cancel</a>
                                                &nbsp;
                                                <a onClick={() => {submitForm()}} className="btn btn-sm btn-red">Save</a>
                                            </div>
                                            :
                                            <></>
                                        }

                                        {!inEditMode && <h2>
                                            Statement Ending Date: {insightUtils.formatDate(values.end_on)}
                                            {accountReconciliation.status == constants.account_reconciliation_status_options.closed.key ?
                                                <div className="text-red">Account Reconciled on {insightUtils.formatDate(accountReconciliation.closed_at)}</div>
                                                :
                                                <>{!inCongratulationsMode && <a onClick={() => {setInEditMode(true)}} className="text-red text-small">&nbsp;&nbsp;<i className="fa fa-pencil"></i></a>}</>
                                            }
                                        </h2>}
                                </div>

                                {!inCongratulationsMode && <>
                                    {!inEditMode && calculationsComplete && <div className="form-row no-column" style={{marginBottom: "10px"}}>
                                        <div className="form-item">
                                            <div className="text-large">
                                                <strong>{insightUtils.numberToCurrency(values.ending_balance, 2)}</strong>
                                            </div>
                                            Statement Ending Balance
                                        </div>
                                        <div className="text-red hidden-sm" style={{width: "50px", fontSize: "50px"}}>-</div>
                                        <div className="form-item">
                                            <div className="text-large"><strong>{insightUtils.numberToCurrency(clearedBalance, 2)}</strong></div>
                                            Cleared Balance

                                            <div className="equation-bracket-leader hidden-sm"/>
                                            <div className="equation-bracket  hidden-sm">
                                                <div className="form-row no-column">
                                                    <div className="st-col-33">
                                                        <div className="text-large"><strong>{insightUtils.numberToCurrency(values.beginning_balance, 2)}</strong></div>
                                                        Beginning<br/>Balance
                                                    </div>
                                                    <div className="text-red" style={{width: "50px", fontSize: "40px"}}>-</div>
                                                    <div className="st-col-33">
                                                        <div className="text-large"><strong>{insightUtils.numberToCurrency(debitAmount, 2)}</strong></div>
                                                        {debitCount}<br/>{debitCount == 1 ? debitLabel : debitLabel + "s"}
                                                    </div>
                                                    <div className="text-red" style={{width: "50px", fontSize: "40px"}}>+</div>
                                                    <div className="st-col-33">
                                                        <div className="text-large"><strong>{insightUtils.numberToCurrency(creditAmount, 2)}</strong></div>
                                                        {creditCount}<br/>{creditCount == 1 ? creditLabel : creditLabel + "s"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-red hidden-sm" style={{width: "50px", fontSize: "50px"}}>=</div>
                                        <div className="form-item">
                                            <div>
                                                <div className="text-large"><strong>{insightUtils.numberToCurrency(difference, 2)}</strong></div>

                                                {difference == 0 ? null : <ToolTip icon={<i className="fa fa-exclamation-circle text-orange"></i>} explanation="Your selected transaction don't match your statement yet, when they match, you'll have a difference of $0."/>} Difference
                                            </div>

                                            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                            {accountReconciliation.status == constants.account_reconciliation_status_options.open.key && <a onClick={() => {handleFinalizeReconciliation(values)}} className={difference == 0 ? "btn btn-red" : "btn btn-gray"} style={{minWidth: "150px", width: "50%", margin: "20px auto 0"}}>Finish Now</a>}

                                        </div>
                                    </div>}

                                    {!inEditMode && <>
                                        <hr style={{marginBottom: "20px"}}/>

                                        <ListPage
                                            titleImage={<></>}
                                            runSearch={runSearch}
                                            hideSearch={true}
                                            hideNavCol={true}
                                            nav={
                                                <div className="horiz-nav">
                                                    <ul className="horiz-nav-list">
                                                        <li className="hn-item"><a className={"hn-item" + (itemsMode == "all" ? " active" : "")} onClick={() => setItemsMode("all")}>All</a></li>
                                                        <li className="hn-item"><a className={"hn-item" + (itemsMode == "debits" ? " active" : "")} onClick={() => setItemsMode("debits")}>{debitLabel}s</a></li>
                                                        <li className="hn-item"><a className={"hn-item" + (itemsMode == "credits" ? " active" : "")} onClick={() => setItemsMode("credits")}>{creditLabel}s</a></li>
                                                    </ul>
                                                    <ul className="horiz-nav-list">
                                                        <li className="hn-item"><Link to={insightRoutes.expenseNew()} state={{return_url: insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id)}}>Add Expense</Link></li>
                                                        <li className="hn-item"><Link to={insightRoutes.journalEntryNew()} state={{return_url: insightRoutes.accountReconciliationEdit(accountReconciliation.hash_id)}}>Add Journal Entry</Link></li>
                                                    </ul>
                                                </div>
                                            }
                                            reloadWhenChanges={values.end_on}
                                            columns={[
                                                {label: "Description", class: "st-col-md-75 visible-md", sort_by: "entry_on"},
                                                {label: "Amount", class: "st-col-15 st-col-md-20 text-right visible-md", sort_by: "amount", data_type: "float"},

                                                {label: "Date", class: "st-col-15 st-col-md-75 hidden-md", sort_by: "entry_on"},
                                                {label: "Property", class: "st-col-15 hidden-md", sort_by: "property_name"},
                                                {label: "Type", class: "st-col-15 hidden-md", sort_by: "transaction_type"},
                                                {label: "Memo", class: "st-col-30 st-col-lg-20 hidden-md", sort_by: "description"},
                                                {label: debitLabel, class: "st-col-15 st-col-md-25 text-right hidden-md", sort_by: "amount", data_type: "float"},
                                                {label: creditLabel, class: "st-col-15 st-col-md-25 text-right hidden-md", sort_by: "amount", data_type: "float"},
                                                {label: <div className="form-item  form-checkbox-standalone">
                                                            <label>
                                                                {accountReconciliation.status == constants.account_reconciliation_status_options.open.key && <i onClick={() => checkAll()} className={accountEntries && clearedItems.length == accountEntries.length ? "btn-checkbox fas fa-check-square active" : "btn-checkbox fal fa-square"}></i>}
                                                            </label>
                                                        </div>, hideSort: true, class: "st-col-05"
                                                },
                                            ]}
                                            defaultSortBy="entry_on"
                                            defaultSortDir="asc"
                                            noDataMessage="We could not find any matching transactions"
                                            numberPerPage={100000}
                                            generateTableRow={generateTableRow}
                                        />

                                        <div className="form-nav">
                                            <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                                <span>{accountReconciliation.status == constants.account_reconciliation_status_options.closed.key ? "Back" : "Save & Finish Later"}</span>
                                            </a>
                                        </div>
                                    </>}
                                </>}

                                {inCongratulationsMode &&
                                    <div className="full-page-message">
                                        <i className="fa fa-circle-check"/>
                                        <span>Congratulations, your account is reconciled</span>
                                        <a onClick={closeView} className="btn btn-red">Done</a>
                                    </div>
                                }
                            </Form>

                        )}
                    </Formik>
                </>}

            </div>
        </>
    )
}

export default AccountReconciliationEditPage;

