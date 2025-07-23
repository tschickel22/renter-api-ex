import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'

import {searchForVendors} from "../../../slices/vendorSlice";
import {deleteExpense, loadExpense, saveExpense} from "../../../slices/expenseSlice";
import store from "../../../app/store";

import {Field, FieldArray, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import DatePicker from "react-datepicker";
import {searchForAccounts} from "../../../slices/accountSlice";

import ExpenseReceiptsView from "./ExpenseReceiptsView";
import ExpenseListPage from "./ExpenseListPage";

import {searchForUsers} from "../../../slices/userSlice";
import Modal from "../../shared/Modal";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import {searchForBankAccounts} from "../../../slices/bankAccountSlice";
import AccountReconciliationWarningModal from "../accountReconciliations/AccountReconciliationWarningModal";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const ExpenseEditPage = ({type}) => {

    const navigate = useNavigate()
    const params = useParams()
    const location = useLocation()

    const { currentUser }= useSelector((state) => state.user)
    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentCompany, properties, settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [expense, setExpense] = useState(null)
    const [actualType, setActualType] = useState(null)
    const [accounts, setAccounts] = useState([])
    const [paymentAccounts, setPaymentAccounts] = useState([])
    const [units, setUnits] = useState({})
    const [vendors, setVendors] = useState([])
    const [users, setUsers] = useState([])
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [mileageMode, setMileageMode] = useState(false)
    const [deletingExpense, setDeletingExpense] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)
    const [isConfirmingSave, setIsConfirmingSave] = useState(false)
    const receiptsBatchNumber = +new Date()

    useEffect(async() => {

        if (currentCompany && properties) {
            // Load Bank Accounts
            const bankAccountResults = await store.dispatch(searchForBankAccounts({})).unwrap()

            // Load Accounts
            const accountResults = await store.dispatch(searchForAccounts({})).unwrap()
            console.log("searchForAccounts", accountResults)
            const newExpenseAccounts = [...accountResults.data.accounts]
            const newPaymentAccounts = accountResults.data.accounts.filter((account) => {
                // Only include accounts that are linked to bank accounts
                const matchingBankAccount = bankAccountResults.data.bank_accounts.find((bankAccount) => bankAccount.account_id == account.id)
                return !!matchingBankAccount
            })

            setAccounts(insightUtils.sortByName(newExpenseAccounts))
            setPaymentAccounts(insightUtils.sortByName(newPaymentAccounts))

            // Vendors
            const vendorResults = await store.dispatch(searchForVendors({})).unwrap()
            console.log("searchForVendors", vendorResults)
            setVendors(insightUtils.sortByName(vendorResults.data.vendors))

            // Users
            const userResults = await store.dispatch(searchForUsers({})).unwrap()
            console.log("searchForUsers", vendorResults)
            setUsers(insightUtils.sortByName(userResults.data.users))

            // Load Expense
            const results = await store.dispatch(loadExpense({expenseId: params.expenseId || "new_expense"})).unwrap()
            console.log("loadExpense", results)
            let newExpense = Object.assign({}, results.data.expense)
            newExpense.due_on = insightUtils.parseDate(results.data.expense.due_on)
            newExpense.paid_on = insightUtils.parseDate(results.data.expense.paid_on)

            setCurrentSettings(insightUtils.getSettings(settings))

            setActualType(newExpense.id ? newExpense.type : type)

            // Are we coming back from adding something? If so, use those values
            if (location.state && location.state.values && !location.state.return_url) {
                setExpense(location.state.values)
            }
            else {
                const mileageAccount = accountResults.data.accounts.find((account) => (account.code == "580"))

                if (location.pathname.indexOf("mileage") >= 0) {
                    // Go into Mileage actualType
                    setMileageMode(true)

                    if (newExpense.expense_account_splits && newExpense.expense_account_splits[0]) {
                        newExpense.expense_account_splits[0].account_id = mileageAccount.id
                    }
                }
                else if (newExpense.expense_account_splits && newExpense.expense_account_splits[0] && newExpense.expense_account_splits[0].account_id == mileageAccount.id) {
                    setMileageMode(true)
                }

                // Is there a property ID and/or Unit ID we can grab?
                if (location.state && location.state.values && location.state.values.property_id) {
                    newExpense.expense_property_splits[0].property_id = location.state.values.property_id
                    selectProperty(location.state.values.property_id, 0)
                }

                if (location.state && location.state.values && location.state.values.unit_id) {
                    newExpense.expense_property_splits[0].unit_id = location.state.values.unit_id
                }
                else if (newExpense.expense_property_splits && newExpense.expense_property_splits.length > 0) {
                    setupUnits(newExpense.expense_property_splits)
                }

                // If we are coming in with values and a return_url, use them to pre-populate
                if (location.state?.return_url && location.state?.values) {
                    if (location.state.values.description) newExpense.description = location.state.values.description
                    if (location.state.values.paid_on) newExpense.paid_on = insightUtils.parseDate(location.state.values.paid_on)
                    if (location.state.values.amount) newExpense.expense_account_splits[0].amount = location.state.values.amount
                    if (location.state.values.payment_account_id) newExpense.payment_account_id = location.state.values.payment_account_id
                    if (location.state.values.bank_transaction_id) newExpense.bank_transaction_id = location.state.values.bank_transaction_id

                    // We may be coming back from adding a vendor:
                    if (location.state.values.vendor_id)  {
                        newExpense.vendor_id = location.state.values.vendor_id
                    }
                    else {
                        // Try to select the vendor by using the description
                        const newVendor = vendorResults.data.vendors.find((v) => v.name == location.state.values.description)
                        if (newVendor) newExpense.vendor_id = newVendor.id
                    }

                    // We may be coming back from adding an account:
                    if (location.state.values.expense_account_splits)  {
                        newExpense.expense_account_splits = location.state.values.expense_account_splits
                    }
                }

                setExpense(newExpense)
            }
        }
    }, [currentCompany, properties])

    function handlePropertySelected(newPropertyId, index) {
        selectProperty(newPropertyId, index)
    }

    function setupUnits(expense_property_splits) {
        let newUnits = {...units}

        expense_property_splits.forEach((propertySplit, index) => {
            const property = (properties || []).find((property) => property.id == propertySplit.property_id)

            if (property) {
                newUnits[index] = insightUtils.sortNumberOrString([...property.units], 'name')
            }
        })

        setUnits(newUnits)
    }

    function selectProperty(propertyId, index) {
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))
        let newUnits = {...units}

        if (property) {
            const newSettings = insightUtils.getSettings(settings, property.id)

            setCurrentSettings(newSettings)
            newUnits[index] = insightUtils.sortNumberOrString([...property.units], 'name')
        }
        else {
            newUnits[index] = null
        }

        setUnits(newUnits)
    }

    function handleVendorSelected(vendorId, values) {
        if (vendorId == -1 && currentUser.vendors_edit) {
            navigate(insightRoutes.vendorNew(), {state: {return_url: location.pathname, original_return_url: location.state?.return_url, field_to_update: "vendor_id", values: values}})
        }
    }

    function handlePaymentAccountSelected(paymentAccountId, values) {
        if (paymentAccountId == -1) {
            navigate(insightRoutes.bankAccountNew(), {state: {return_url: location.pathname, original_return_url: location.state?.return_url, field_to_update: "payment_account_id", values: values}})
        }
    }

    function handleAccountSelected(accountId, fieldName, values) {
        if (accountId == -1) {
            navigate(insightRoutes.accountNew(), {state: {return_url: location.pathname, original_return_url: location.state?.return_url, field_to_update: fieldName, values: values}})
        }
    }

    function handleConfirmedSave(values, { setSubmitting, setErrors }) {
        setIsConfirmingSave(false)
        handleFormikSubmit(values, { setSubmitting, setErrors }, true)
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }, saveConfirmed) {
        setBaseErrorMessage("")

        if (location.state && location.state.from_maintenance_request_id) values.maintenance_request_id = location.state.from_maintenance_request_id
        values.receipts_batch_number = receiptsBatchNumber

        // Has this already been included in a reconciliation? If so, we should warn the users
        if (!saveConfirmed) {
            // Have we reconciled this expense?  If so, has something changed that we care about?
            if (expense.account_reconciliation_id) {

                let importantChanges = expense.payment_account_id != values.payment_account_id

                if (!importantChanges) {
                    const incomingTotal = totalAmounts(expense.expense_account_splits)
                    const newTotal = totalAmounts(values.expense_account_splits)

                    importantChanges = incomingTotal != newTotal
                }

                if (importantChanges) {
                    setSubmitting(false);
                    setIsConfirmingSave(true)
                    return
                }
            }
        }

        // Make sure the amounts match
        const accountSplitsTotal = totalAmounts(values.expense_account_splits)
        const propertySplitsTotal = totalAmounts(values.expense_property_splits)

        if (values.expense_property_splits.length > 1 && Math.abs(propertySplitsTotal - accountSplitsTotal) >= 0.009) {
            alert("The split totals do not match")
            return
        }


        if (values.id) {
            // Mark any splits set to remove
            const propertySplitsToDestroy = expense.expense_property_splits.filter((eps) => {
                if (values.expense_property_splits.find((veps) => veps.id == eps.id)) {
                    return false
                }
                else {
                    return true
                }
            })

            if (propertySplitsToDestroy.length > 0) {
                propertySplitsToDestroy.forEach((pds) => {
                    values.expense_property_splits.push({"id": pds.id, "_destroy": true})
                })
            }

            const accountSplitsToDestroy = expense.expense_account_splits.filter((eps) => {
                if (values.expense_account_splits.find((veps) => veps.id == eps.id)) {
                    return false
                }
                else {
                    return true
                }
            })

            if (accountSplitsToDestroy.length > 0) {
                accountSplitsToDestroy.forEach((pds) => {
                    values.expense_account_splits.push({"id": pds.id, "_destroy": true})
                })
            }
        }
        else {
            values.type = type
        }

        const results = await store.dispatch(saveExpense({expense: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView(response.expense.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    function totalAmounts(lineItems) {
        let total = 0

        lineItems.forEach((lineItem) => {
            if (lineItem && parseFloat(insightUtils.clearNonNumerics(lineItem.amount))) total += parseFloat(insightUtils.clearNonNumerics(lineItem.amount))
        })

        return total
    }

    function addAccountSplit(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyExpenseAccountSplit())
    }

    function removeAccountSplit(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    function addPropertySplit(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyExpensePropertySplit())
    }

    function removePropertySplit(values, arrayHelpers, index) {

        // Tell Formik what we want to do
        arrayHelpers.remove(index)

        // Now update the unit data to match
        let newSplits = [...values.expense_property_splits]
        newSplits.splice(index, 1)
        setupUnits(newSplits)
    }

    function updateMiles(e, handleChange, setFieldValue) {
        const miles = parseFloat(insightUtils.clearNonNumerics(e.target.value))

        if (currentSettings) {
            setFieldValue("expense_account_splits.0.amount", miles * currentSettings.rate_per_mile / 100.0)
        }
        handleChange(e)
    }

    function closeView(newExpenseId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a vendor, send it back to the calling form
            if (newExpenseId && location.state.field_to_update) newValues[location.state.field_to_update] = newExpenseId

            navigate(location.state.return_url, {state: {values: newValues}})

        }
        else {
            if (actualType == ExpenseListPage.TYPE_BILL) {
                navigate(insightRoutes.billList())
            }
            else {
                navigate(insightRoutes.expenseList())
            }
        }
    }

    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deleteExpense({expenseId: deletingExpense.hash_id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: (actualType == ExpenseListPage.TYPE_BILL ? "Bill Deleted" : "Expense Deleted")}))

            if (actualType == ExpenseListPage.TYPE_BILL) {
                navigate(insightRoutes.billList())
            }
            else {
                navigate(insightRoutes.expenseList())
            }
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }
    }

    function cancelDelete() {
        setDeletingExpense(null)
        setDeletingSubmitted(false)
    }

    return (
        <>
            <div className="section">
            {expense && <>
                <h2>{expense.id ? "Edit " + (mileageMode ? "Mileage" : expense.description) : (actualType == ExpenseListPage.TYPE_BILL ? "Record " : "Add ") + (mileageMode ? "Mileage" : (actualType == ExpenseListPage.TYPE_BILL ? "Bill" : "Expense"))}</h2>
                {mileageMode ?
                    <p>Use this form to {expense.id ? "edit" : "create"} a mileage entry.</p>
                    :
                    <p>Use this form to {expense.id ? "edit" : "create"} {actualType == ExpenseListPage.TYPE_BILL ? "a bill" : "an expense"}. Use splits to attribute amounts to the proper accounts and properties.</p>

                }

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={expense}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue, handleChange, handleBlur }) => (
                        <Form>
                            {!deletingExpense && !isConfirmingSave && <div className="add-property-wrap">
                                <div className="well well-white">
                                    <div className="form-row">
                                        {actualType == ExpenseListPage.TYPE_BILL ?
                                            <>
                                                <FormItem label="Date Due" name="due_on">
                                                    <DatePicker className="form-input form-input-white" selected={values.due_on} onChange={(date) => setFieldValue("due_on", date)} />
                                                </FormItem>
                                            </> :
                                            <>
                                                <FormItem label="Date of Expense" name="paid_on">
                                                    <DatePicker className="form-input form-input-white" selected={values.paid_on} onChange={(date) => setFieldValue("paid_on", date)} />
                                                </FormItem>
                                            </>}

                                        {mileageMode &&
                                        <>
                                            {currentSettings && currentSettings.rate_per_mile > 0 ?
                                                <>
                                                    <FormItem label="Miles" name="expense_account_splits.0.miles" >
                                                        <Field
                                                            type="text"
                                                            name="expense_account_splits.0.miles"
                                                            value={insightUtils.getValue(values, "expense_account_splits.0.miles")}
                                                            className="form-input form-input-white"
                                                            onChange={(e) => updateMiles(e, handleChange, setFieldValue)}
                                                            onBlur={handleBlur}
                                                        />
                                                    </FormItem>
                                                    <FormItem label="Amount" name="expense_account_splits.0.amount" mask={insightUtils.currencyMask()} disabled={true} />
                                                </>
                                                :
                                                <>
                                                    Please ensure you have set a Rate Per Mile in <Link to={insightRoutes.settingList()}>Settings</Link>.
                                                </>
                                            }
                                        </>
                                        }

                                        <FormItem label={mileageMode ? "Notes" : "Description"} name="description" />
                                    </div>


                                    <div className="form-row">
                                        {mileageMode ?
                                            <FormItem label="Employee" name="employee_user_id">
                                                <AutocompleteDropdown name="employee_user_id" blankText="-- Select Employee --" options={users} />
                                            </FormItem>
                                            :
                                            <FormItem label="Vendor" name="vendor_id">
                                                <AutocompleteDropdown name="vendor_id" blankText="-- Select Vendor --" options={insightUtils.prepend(vendors, {id: -1, name: "Add New Vendor..."})} handleChange={(id) => handleVendorSelected(id, values)}/>
                                            </FormItem>
                                        }

                                        {actualType == ExpenseListPage.TYPE_BILL ?
                                            <FormItem label="Invoice Number" name="invoice_number" optional={true} />
                                            :
                                            <FormItem label="Payment Account" name="payment_account_id">
                                                <AutocompleteDropdown name="payment_account_id" blankText="-- Select Payment Account --" options={insightUtils.prepend(paymentAccounts, {id: -1, name: "Add New Account..."})} handleChange={(id) => handlePaymentAccountSelected(id, values)}/>
                                            </FormItem>
                                        }
                                    </div>

                                </div>

                                <div className="well">
                                    {!mileageMode &&
                                    <>
                                        {<FieldArray
                                            name="expense_account_splits"
                                            render={arrayHelpers => (
                                                <>
                                                    {values.expense_account_splits && values.expense_account_splits.map((expense_account_split, index) => (
                                                        <div key={index} className="form-row">
                                                            <FormItem label={"Category"} name={"expense_account_splits." + index + ".account_id"}>
                                                                <AutocompleteDropdown name={`expense_account_splits.${index}.account_id`} blankText="-- Select Account --" options={insightUtils.prepend(accounts, {id: -1, name: "Add New Account..."})} handleChange={(accountId) => handleAccountSelected(accountId, `expense_account_splits.${index}.account_id`, values)}/>
                                                            </FormItem>

                                                            <FormItem label={"Amount"} name={"expense_account_splits." + index + ".amount"} mask={insightUtils.currencyMask()} />

                                                            <div className={isMobileDevice ? "form-item" : "form-item-remove"}>
                                                                {values.expense_account_splits.length > 1 &&<a onClick={() => removeAccountSplit(arrayHelpers, index)}>{isMobileDevice ? "Remove Account Split" : <i className="fa fa-trash"></i>}</a>}
                                                            </div>
                                                        </div>))
                                                    }
                                                    <div className="form-row">
                                                        <div className="form-item">
                                                            <a onClick={() => addAccountSplit(arrayHelpers)}>Add Account Split</a>
                                                        </div>
                                                        <div className="form-item">
                                                            {values.expense_account_splits.length > 1 &&
                                                                <div style={{textAlign: "right", paddingRight: "20px"}}>
                                                                    <strong>Total:</strong> {insightUtils.numberToCurrency(totalAmounts(values.expense_account_splits), 2)}
                                                            </div>}
                                                        </div>
                                                        <div className="form-item-remove"></div>
                                                    </div>
                                                </>
                                            )}
                                        />}
                                    </>}

                                    {<FieldArray
                                        name="expense_property_splits"
                                        render={arrayHelpers => (
                                            <>
                                                {values.expense_property_splits && values.expense_property_splits.map((expense_property_split, index) => (
                                                    <div key={index} className="form-row">
                                                        <FormItem label={values.expense_property_splits.length == 1 ? "Company / Property" : "Property"} name={"expense_property_splits." + index + ".property_id"} >
                                                            <AutocompleteDropdown name={"expense_property_splits." + index + ".property_id"} blankText={currentCompany.name} options={properties} handleChange={(id) => {handlePropertySelected(id, index)}} />
                                                        </FormItem>
                                                        {units[index] ?
                                                            <FormItem label={"Unit"} name={"expense_property_splits." + index + ".unit_id"} optional={true}>
                                                                <AutocompleteDropdown name={"expense_property_splits." + index + ".unit_id"} blankText="-- Select Unit --" options={units[index]}/>
                                                            </FormItem>
                                                            :
                                                            <div className="form-item" />
                                                        }

                                                        {values.expense_property_splits.length > 1 && <FormItem label={"Amount"} name={"expense_property_splits." + index + ".amount"} mask={insightUtils.currencyMask()}  />}

                                                        <div className={isMobileDevice ? "form-item" : "form-item-remove"}>
                                                            {values.expense_property_splits.length > 1 && <a onClick={() => removePropertySplit(values, arrayHelpers, index)}>{isMobileDevice ? "Remove Property or Unit Split" : <i className="fa fa-trash"></i>}</a>}
                                                        </div>
                                                    </div>))
                                                }


                                                {!mileageMode &&
                                                    <div className="form-row">
                                                        <div className="form-item">
                                                            <a onClick={() => addPropertySplit(arrayHelpers)}>Add Property or Unit Split</a>
                                                        </div>

                                                        <div className="form-item">
                                                        </div>

                                                        {values.expense_property_splits.length > 1 &&
                                                        <div className="form-item">

                                                            <div style={{textAlign: "right", paddingRight: "20px"}}>
                                                                <strong>Total:</strong> {insightUtils.numberToCurrency(totalAmounts(values.expense_property_splits), 2)}
                                                            </div>
                                                        </div>
                                                        }

                                                        <div className="form-item-remove"></div>

                                                    </div>
                                                }
                                            </>
                                        )}
                                    />}
                                </div>

                                <ExpenseReceiptsView type={actualType} expense={expense} receiptsBatchNumber={receiptsBatchNumber} preventUpload={!currentUser.expenses_edit} preventDelete={!currentUser.expenses_delete || expense.account_reconciliation_id} />

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    {expense.id && currentUser.expenses_delete && !expense.account_reconciliation_id && <a onClick={()=>setDeletingExpense(expense)} className="btn btn-gray"><span>Delete</span></a>}
                                    {currentUser.expenses_edit && <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>}
                                </div>
                            </div>}

                            {deletingExpense && <Modal closeModal={() => cancelDelete()}>
                                <h2>Delete {mileageMode ? "Mileage" : (actualType == ExpenseListPage.TYPE_BILL ? "Bill" : "Expense")}?</h2>
                                <p className="text-center">Are you sure you want to delete this {mileageMode ? "mileage" : (actualType == ExpenseListPage.TYPE_BILL ? "bill" : "expense")}?</p>

                                <div className="form-nav">
                                    <div onClick={() => cancelDelete()} className="btn btn-gray"><span>Cancel</span></div>
                                    <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                                </div>
                            </Modal>}

                            {isConfirmingSave && <AccountReconciliationWarningModal handleConfirmedSave={handleConfirmedSave} setIsConfirmingSave={setIsConfirmingSave} />}
                        </Form>
                    )}
                </Formik>
            </>}
            </div>
        </>
    )}

export default ExpenseEditPage;

