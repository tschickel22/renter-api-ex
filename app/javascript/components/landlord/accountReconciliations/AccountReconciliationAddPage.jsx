import React, {useEffect, useState} from 'react';
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import {findMostRecentReconciliation, saveAccountReconciliation} from "../../../slices/accountReconciliationSlice";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {loadReconcilableAccounts} from "../../../slices/bankAccountSlice";
import DatePicker from "react-datepicker";
import moment from "moment";


const AccountReconciliationAddPage = ({}) => {
    let navigate = useNavigate()
    let location = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const {constants} = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [reconcilableAccounts, setReconcilableAccounts] = useState(null)
    const [accountReconciliation, setAccountReconciliation] = useState(null)
    const [bankAccount, setBankAccount] = useState(null)
    const [lastAccountReconciliation, setLastAccountReconciliation] = useState(null)


    useEffect(async() => {
        // Load eligible accounts
        const result = await store.dispatch(loadReconcilableAccounts()).unwrap()

        setReconcilableAccounts(insightUtils.sortByName(result.data.bank_accounts))

        // Are we coming back from something?
        if (location.state && location.state.values && !location.state.return_url) {

            let newAccountReconciliation = Object.assign({}, location.state.values)

            // We are likely coming back from updating the bank account
            if (newAccountReconciliation.bank_account_id) {
                const newBankAccount = result.data.bank_accounts.find((a) => a.id == newAccountReconciliation.bank_account_id)
                newAccountReconciliation.beginning_balance =  newBankAccount.opening_balance
                newAccountReconciliation.begin_on =  moment(newBankAccount.opened_on).toDate()
                setBankAccount(newBankAccount)
            }

            setAccountReconciliation(newAccountReconciliation)

        }
        else {
            setAccountReconciliation(insightUtils.emptyAccountReconciliation())
        }


    }, [])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        const results = await store.dispatch(saveAccountReconciliation({accountReconciliation: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            navigate(insightRoutes.accountReconciliationEdit(response.account_reconciliation.hash_id))
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    async function handleBankAccountChange(e, setFieldValue) {
        const bankAccountId = e.target.value

        let newBankAccount = null

        if (bankAccountId) {
            newBankAccount = reconcilableAccounts.find((a) => a.id == bankAccountId)

            // Find the most recent account reconciliation and base this one off of that
            const results = await store.dispatch(findMostRecentReconciliation({bankAccountId: bankAccountId})).unwrap()

            console.log(results)

            if (results.data.account_reconciliation) {
                // If this is still open... go edit it
                if (results.data.account_reconciliation.status == constants.account_reconciliation_status_options.open.key) {
                    navigate(insightRoutes.accountReconciliationEdit(results.data.account_reconciliation.hash_id))
                }
                else {
                    setLastAccountReconciliation(results.data.account_reconciliation)
                    setFieldValue("beginning_balance", results.data.account_reconciliation.ending_balance)
                    setFieldValue("begin_on", moment(results.data.account_reconciliation.end_on).add(1,'days').toDate())
                }
            }
            else {
                setFieldValue("beginning_balance", newBankAccount.opening_balance)
                setFieldValue("begin_on", moment(newBankAccount.opened_on).toDate())
            }
        }

        setBankAccount(newBankAccount)
    }

    function closeView() {
        navigate(insightRoutes.accountReconciliationList())
    }

    function handleNavigateToAccountEdit(values) {
        navigate(insightRoutes.bankAccountEdit(bankAccount.hash_id), {state: {return_url: location.pathname, values: values}})
    }

    return (
        <>
            <div className="section">
                {accountReconciliation && currentUser.accounting_edit && <>
                    <img className="section-img" src="/images/photo-accounting.jpg" />
                    <div className="title-block"><h1>Reconcile an Account</h1></div>

                    <p className="text-center">Open your statement and let's get started..</p>
                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={accountReconciliation}
                        onSubmit={handleFormikSubmit}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form>
                                <div className="form-row form-center">
                                    <FormItem label="Select account to reconcile" name="bank_account_id" formItemClass="form-item-50">
                                        <BasicDropdown name="bank_account_id" options={reconcilableAccounts} onChange={(e) => handleBankAccountChange(e, setFieldValue)} />
                                    </FormItem>
                                </div>

                                {!lastAccountReconciliation && bankAccount && !(bankAccount.opened_on && bankAccount.opening_balance) ?
                                    <div className="form-row form-center">
                                        <p>The chosen account does not have the Opening Date & Balance set.  Please <a onClick={() => handleNavigateToAccountEdit(values)}>update the account</a> before continuing.</p>
                                    </div>
                                    :
                                    <>
                                        {values.bank_account_id && <>
                                            <div className="form-row form-center">
                                                <FormItem label="Beginning Balance" name="beginning_balance" formItemClass="form-item-25">
                                                    <div className="form-value">{insightUtils.numberToCurrency(values.beginning_balance, 2)}</div>
                                                </FormItem>
                                                <FormItem label="Ending Balance" name="ending_balance" formItemClass="form-item-25" mask={insightUtils.currencyMask(true)} />
                                                <FormItem label="Ending Date" name="end_on" formItemClass="form-item-25">
                                                    <DatePicker className="form-input form-input-white" selected={values.end_on} onChange={(date) => setFieldValue("end_on", date)} />
                                                </FormItem>
                                            </div>
                                            {lastAccountReconciliation && lastAccountReconciliation.hash_id && <div className="form-row form-center">
                                                <Link to={insightRoutes.accountReconciliationEdit(lastAccountReconciliation.hash_id)} target="_blank">Last Statement Ending Date {insightUtils.formatDate(lastAccountReconciliation.end_on)}</Link>
                                            </div>}
                                        </>}

                                        <div className="form-nav">
                                            <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                                <span>Cancel</span>
                                            </a>
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                <span>{!isSubmitting ? "Start Reconciling" : "Saving..."}</span>
                                            </button>
                                        </div>
                                    </>}
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>
    )}

export default AccountReconciliationAddPage;

