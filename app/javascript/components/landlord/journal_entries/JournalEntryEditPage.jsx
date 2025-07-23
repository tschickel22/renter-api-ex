import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import {deleteJournalEntry, loadJournalEntry, saveJournalEntry} from "../../../slices/journalEntrySlice";
import store from "../../../app/store";

import {FieldArray, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import DatePicker from "react-datepicker";
import {searchForAccounts} from "../../../slices/accountSlice";

import JournalEntryDocumentsView from "./JournalEntryDocumentsView";
import AccountReconciliationWarningModal from "../accountReconciliations/AccountReconciliationWarningModal";
import Modal from "../../shared/Modal";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const JournalEntryEditPage = () => {

    const navigate = useNavigate()
    const params = useParams()
    const location = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentCompany, properties, constants } = useSelector((state) => state.company)

    const [journalEntry, setJournalEntry] = useState(null)
    const [accounts, setAccounts] = useState([])
    const [units, setUnits] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [isConfirmingSave, setIsConfirmingSave] = useState(false)
    const [isConfirmingRiskyDelete, setIsConfirmingRiskyDelete] = useState(false)
    const [deletingJournalEntry, setDeletingJournalEntry] = useState(null)

    const documentsBatchNumber = +new Date()

    useEffect(async() => {

        if (currentCompany && properties) {
            // Load Accounts
            const accountResults = await store.dispatch(searchForAccounts({})).unwrap()
            console.log("searchForAccounts", accountResults)
            setAccounts(insightUtils.sortByName(accountResults.data.accounts))

            // Load JournalEntry
            const results = await store.dispatch(loadJournalEntry({journalEntryId: params.journalEntryId || "new_journal_entry"})).unwrap()
            console.log("loadJournalEntry", results)
            let newJournalEntry = Object.assign({}, results.data.journal_entry)
            newJournalEntry.entry_on = insightUtils.parseDate(results.data.journal_entry.entry_on)
            if (results.data.journal_entry.end_on) newJournalEntry.end_on = insightUtils.parseDate(results.data.journal_entry.end_on)

            // Are we coming back from adding something? If so, use those values
            if (location.state && location.state.values && !location.state.return_url) {
                setJournalEntry(location.state.values)
            }
            else {

                // Is there a property ID and/or Unit ID we can grab?
                if (location.state && location.state.values && location.state.values.property_id) {
                    newJournalEntry.property_id = location.state.values.property_id
                    selectProperty(location.state.values.property_id)
                }

                if (location.state && location.state.values && location.state.values.unit_id) {
                    newJournalEntry.unit_id = location.state.values.unit_id
                }

                // If we are coming in with values and a return_url, use them to pre-populate
                if (location.state?.return_url && location.state?.values) {
                    if (location.state.values.description) newJournalEntry.memo = location.state.values.description
                    if (location.state.values.memo) newJournalEntry.memo = location.state.values.memo
                    if (location.state.values.paid_on) newJournalEntry.entry_on = insightUtils.parseDate(location.state.values.paid_on)
                    if (location.state.values.entry_on) newJournalEntry.entry_on = insightUtils.parseDate(location.state.values.entry_on)
                    if (location.state.values.payment_account_id) newJournalEntry.journal_entry_splits[0].account_id = location.state.values.payment_account_id
                    if (location.state.values.bank_transaction_id) newJournalEntry.bank_transaction_id = location.state.values.bank_transaction_id

                    // We may be coming back from adding an account:
                    if (location.state.values.journal_entry_splits)  {
                        newJournalEntry.journal_entry_splits = location.state.values.journal_entry_splits
                    }

                    if (location.state.values.amount > 0) {
                        newJournalEntry.journal_entry_splits[0].debit_amount = Math.abs(location.state.values.amount)
                        newJournalEntry.journal_entry_splits[1].credit_amount = Math.abs(location.state.values.amount)
                    }
                    if (location.state.values.amount < 0) {
                        newJournalEntry.journal_entry_splits[0].credit_amount = Math.abs(location.state.values.amount)
                        newJournalEntry.journal_entry_splits[1].debit_amount = Math.abs(location.state.values.amount)
                    }
                }

                setJournalEntry(newJournalEntry)
            }
        }
    }, [currentCompany, properties])

    function handlePropertySelected(newPropertyId) {
        selectProperty(newPropertyId)
    }

    function selectProperty(propertyId) {
        console.log("selectProperty", propertyId)
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))
        let newUnits = null

        if (property) {
            newUnits = property.units
        }

        setUnits(newUnits)
    }

    function handleConfirmedSave(values, { setSubmitting, setErrors }) {
        setIsConfirmingSave(false)
        handleFormikSubmit(values, { setSubmitting, setErrors }, true)
    }

    function handleDeleteRequest(values) {
        const reconciledSplit = (values.journal_entry_splits || []).find((split) => split.account_reconciliation_id)

        // Did we find a reconciled split?
        if (reconciledSplit) {
            console.log("so sorry")
            setIsConfirmingRiskyDelete(true)
            return
        }
        else {
            setDeletingJournalEntry(journalEntry)
        }
    }

    async function performDelete() {
        await store.dispatch(deleteJournalEntry({journalEntry: journalEntry})).unwrap()
        closeView()
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }, saveConfirmed) {
        setBaseErrorMessage("")

        values.documents_batch_number = documentsBatchNumber

        // Has this already been included in a reconciliation? If so, we should warn the users
        if (!saveConfirmed) {
            const reconciledSplit = (values.journal_entry_splits || []).find((split) => split.account_reconciliation_id)

            // Did we find a reconciled split?
            if (reconciledSplit) {

                const incomingTotal = totalAmounts(journalEntry.journal_entry_splits, "debit_amount")
                const newTotal = totalAmounts(values.journal_entry_splits, "debit_amount")

                const importantChanges = incomingTotal != newTotal

                if (importantChanges) {
                    setSubmitting(false);
                    setIsConfirmingSave(true)
                    return
                }
            }
        }

        const results = await store.dispatch(saveJournalEntry({journalEntry: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView(response.journal_entry.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    function totalAmounts(lineItems, field) {
        let total = 0

        lineItems.forEach((lineItem) => {
            if (lineItem && parseFloat(insightUtils.clearNonNumerics(lineItem[field]))) total += parseFloat(insightUtils.clearNonNumerics(lineItem[field]))
        })

        return total
    }

    function addAccountSplit(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyJournalEntrySplit())
    }

    function removeAccountSplit(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    function handleAccountSelected(accountId, fieldName, values) {
        if (accountId == -1) {
            navigate(insightRoutes.accountNew(), {state: {return_url: location.pathname, original_return_url: location.state?.return_url, field_to_update: fieldName, values: values}})
        }
    }

    function closeView(newJournalEntryId) {
        insightUtils.handleBackNavigation(insightRoutes.journalEntryList(), location, navigate, newJournalEntryId)
    }

    return (
        <>
            <div className="section">
            {journalEntry && <>
                <h2>{journalEntry.id ? "Edit Journal Entry" : "Add Journal Entry"}</h2>

                <p>Use this form to {journalEntry.id ? "edit" : "create"} a journal entry.</p>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={journalEntry}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, setSubmitting, setErrors, values, setFieldValue }) => (
                        <Form>
                            {!isConfirmingSave && <div className="add-property-wrap">
                                <div className="well well-white">
                                    <div className="form-row">
                                        <FormItem label="Frequency" name="frequency">
                                            <BasicDropdown name="frequency" blankText="-- Select Frequncy --" options={constants.journal_entry_frequencies} />
                                        </FormItem>
                                        <FormItem label={(!values.frequency || values.frequency == "one_time") ? "Date of Entry" : "Start Date"} name="entry_on">
                                            <DatePicker className="form-input form-input-white" selected={values.entry_on} onChange={(date) => setFieldValue("entry_on", date)} />
                                        </FormItem>
                                        {values.frequency && values.frequency != "one_time" && <FormItem label="End Date" name="end_on">
                                            <DatePicker className="form-input form-input-white" selected={values.end_on} onChange={(date) => setFieldValue("end_on", date)} />
                                        </FormItem>}
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Company / Property" name="property_id" >
                                            <AutocompleteDropdown name="property_id" blankText={currentCompany.name} options={properties} handleChange={(id) => {handlePropertySelected(id)}} />
                                        </FormItem>

                                        {units ?
                                            <FormItem label="Unit" name="unit_id" optional={true}>
                                                <AutocompleteDropdown name="unit_id" blankText="-- Select Unit --" options={units}/>
                                            </FormItem>
                                            :
                                            <div className="form-item" />
                                        }
                                    </div>
                                </div>

                                <div className="well">
                                    {<FieldArray
                                        name="journal_entry_splits"
                                        render={arrayHelpers => (
                                            <>
                                                {values.journal_entry_splits && values.journal_entry_splits.map((journal_entry_split, index) => (
                                                    <div key={index} className="form-row">
                                                        <FormItem label="Account" name={"journal_entry_splits." + index + ".account_id"}>
                                                            <AutocompleteDropdown name={`journal_entry_splits.${index}.account_id`} blankText="-- Select Account --" options={insightUtils.prepend(accounts, {id: -1, name: "Add New Account..."})} handleChange={(id) => handleAccountSelected(id, `journal_entry_splits.${index}.account_id`, values)}/>
                                                        </FormItem>

                                                        <FormItem label="Debits" name={"journal_entry_splits." + index + ".debit_amount"} mask={insightUtils.currencyMask()} />
                                                        <FormItem label="Credits" name={"journal_entry_splits." + index + ".credit_amount"} mask={insightUtils.currencyMask()} />
                                                        <FormItem label="Description" name={"journal_entry_splits." + index + ".description"} optional={true} />

                                                        <div className={isMobileDevice ? "form-item" : "form-item-remove"}>
                                                            {values.journal_entry_splits.length > 1 &&<a onClick={() => removeAccountSplit(arrayHelpers, index)}>{isMobileDevice ? "Remove Account Split" : <i className="fa fa-trash"></i>}</a>}
                                                        </div>
                                                    </div>))
                                                }
                                                <div className="form-row">
                                                    <div className="form-item">
                                                        <a onClick={() => addAccountSplit(arrayHelpers)}>Add Account Split</a>
                                                    </div>
                                                    <div className="form-item">
                                                        {values.journal_entry_splits.length > 1 &&
                                                        <div style={{textAlign: "right", paddingRight: "20px"}}>
                                                            <strong>{isMobileDevice ? "Debit Total" : "Total"}:</strong> {insightUtils.numberToCurrency(totalAmounts(values.journal_entry_splits, "debit_amount"), 2)}
                                                        </div>}
                                                    </div>
                                                    <div className="form-item">
                                                        {values.journal_entry_splits.length > 1 &&
                                                        <div style={{textAlign: "right", paddingRight: "20px"}}>
                                                            <strong>{isMobileDevice ? "Credit Total" : "Total"}:</strong> {insightUtils.numberToCurrency(totalAmounts(values.journal_entry_splits, "credit_amount"), 2)}
                                                        </div>}
                                                    </div>
                                                    <div className="form-item">
                                                    </div>
                                                    <div className="form-item-remove"></div>
                                                </div>
                                            </>
                                        )}
                                    />}
                                </div>

                                <div className="form-row">
                                    <FormItem label="Memo" name="memo" optional={true} />
                                </div>

                                <JournalEntryDocumentsView journalEntry={journalEntry} documentsBatchNumber={documentsBatchNumber} />

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    {journalEntry.id && currentUser.accounting_delete && <a onClick={() => (handleDeleteRequest(values))} className="btn btn-gray"><span>Delete</span></a>}
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>
                                </div>
                            </div>}

                            {isConfirmingSave && <AccountReconciliationWarningModal handleConfirmedSave={handleConfirmedSave} setIsConfirmingSave={setIsConfirmingSave} />}
                            {isConfirmingRiskyDelete && <AccountReconciliationWarningModal handleConfirmedSave={performDelete} setIsConfirmingSave={setIsConfirmingRiskyDelete} />}
                        </Form>
                    )}
                </Formik>
            </>}
            </div>

            {deletingJournalEntry && <Modal closeModal={() => setDeletingJournalEntry(null)}>
                <h2>Delete {deletingJournalEntry.type}?</h2>
                <p className="text-center">Are you sure you want to delete this Journal Entry?</p>

                <div className="form-nav">
                    <div onClick={() => setDeletingJournalEntry(null)} className="btn btn-gray"><span>Cancel</span></div>
                    <div onClick={() => performDelete()} className="btn btn-red"><span>Delete</span></div>
                </div>
            </Modal>}
        </>
    )}

export default JournalEntryEditPage;

