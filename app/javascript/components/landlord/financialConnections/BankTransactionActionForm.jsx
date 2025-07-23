import React from 'react';
import store from "../../../app/store";
import {updateBankTransactionStatus} from "../../../slices/financialConnectionSlice";
import {Form, Formik} from "formik";
import {useNavigate, useParams} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";


const BankTransactionActionForm = ({mode, bankAccount, reloadTable, setReloadTable, bankTransaction, setBankTransaction}) => {

    const navigate = useNavigate()
    const params = useParams()

    const { constants } = useSelector((state) => state.company)

    const isConfirmable = (mode == "review" && bankTransaction.related_object_hash_id)

    async function handleSaveTransaction(values, { _setSubmitting, _setErrors }) {
        if (values.action == "create_expense") {

            // Remove the negativity from the amount before sending it off
            let newValues = {...values}
            newValues.amount = Math.abs(newValues.amount)
            navigate(insightRoutes.expenseNew(), {state: {return_url: location.pathname, values: newValues, from_bank_transaction_id: bankTransaction.id}})
        }
        else if (values.action == "create_journal_entry") {
            navigate(insightRoutes.journalEntryNew(), {state: {return_url: location.pathname, values: values, from_bank_transaction_id: bankTransaction.id}})
        }
        else if (values.action == "exclude") {
            const results = await store.dispatch(updateBankTransactionStatus({bankAccountId: bankAccount.hash_id, bankTransactionId: bankTransaction.id, status: constants.bank_transaction_status_options.excluded.key})).unwrap()

            setBankTransaction(null)

            if (results.data.success) {
                setReloadTable(reloadTable + 1)
            }
            else if (results.data.errors?.base) {
                alert(results.data.errors?.base)
            }
        }
        else if (values.action == "undo") {
            const results = await store.dispatch(updateBankTransactionStatus({bankAccountId: bankAccount.hash_id, bankTransactionId: bankTransaction.id, status: constants.bank_transaction_status_options.new.key})).unwrap()

            setBankTransaction(null)

            if (results.data.success) {
                setReloadTable(reloadTable + 1)
            }
            else if (results.data.errors?.base) {
                alert(results.data.errors?.base)
            }
        }
        else if (values.action == "match") {
            navigate(insightRoutes.financialConnectionTransactionMatch(params.bankAccountId, bankTransaction.id), {state: {return_url: location.pathname, values: values, from_bank_transaction_id: bankTransaction.id}})
        }
        else if (values.action == "confirm") {

            // Push an object of the relationship between the bank transaction and related_object so that we don't have to re-run mapping
            // This will also allow us to add a dropdown in the future
            let bankTransactionMapping = {}
            bankTransactionMapping[bankTransaction.id] = `${bankTransaction.related_object_type}:${bankTransaction.related_object_hash_id}`

            const results = await store.dispatch(updateBankTransactionStatus({bankAccountId: bankAccount.hash_id, bankTransactionId: bankTransaction.id, bankTransactionMapping: bankTransactionMapping, status: constants.bank_transaction_status_options.categorized.key})).unwrap()

            setBankTransaction(null)

            if (results.data.success) {
                setReloadTable(reloadTable + 1)
            }
            else if (results.data.errors?.base) {
                alert(results.data.errors?.base)
            }
        }
        else {
            alert(`Hi Tom, ${values.action} is not wired up yet`)
        }
    }

    function getOptions() {
        let options = []

        if (bankTransaction.amount < 0) {
            options.push({id: "create_expense", name: "Create Expense"})
        }

        options.push({id: "create_journal_entry", name: "Create Journal Entry"})

        if (mode != "match") {
            options.push({id: "match", name: "Match"})
        }

        options.push({id: "exclude", name: "Exclude"})

        return options
    }


    return (
        <>
            <Formik initialValues={{action: "", description: bankTransaction.description, amount: bankTransaction.amount, paid_on: bankTransaction.transacted_at, payment_account_id: bankAccount.account_id, bank_transaction_id: bankTransaction.id }} onSubmit={handleSaveTransaction}>
                {({ handleSubmit, isSubmitting, setSubmitting, setFieldValue  }) => (
                    <Form>
                        {mode != "match" &&
                            <div className="form-nav flex-column">
                                <h2>{bankTransaction.description}</h2>
                                <div className="text-center"><strong>{insightUtils.formatDate(bankTransaction.transacted_at)}:</strong> {insightUtils.numberToCurrency(bankTransaction.amount, 2)}</div>
                            </div>
                        }
                        {isConfirmable &&
                            <div className="form-nav flex-column well">

                                <div className="text-center">
                                    <h3>Confirm Auto-match:</h3>

                                    <strong>{insightUtils.humanize(bankTransaction.related_object_type)}</strong>:
                                    {bankTransaction.related_object_type != "Deposit" &&
                                        <>
                                            {bankTransaction.related_object_assignment} / {bankTransaction.related_object_description}
                                        </>
                                    }
                                    <br/>
                                    <strong>{insightUtils.formatDate(bankTransaction.related_object_date)}:</strong> {insightUtils.numberToCurrency(bankTransaction.related_object_amount, 2)}<br/>
                                    <br/>
                                    <a onClick={(e) => {
                                        setFieldValue('action', 'confirm')
                                        setSubmitting(true);
                                        handleSubmit(e)
                                    }} className="btn btn-red"><span>{isSubmitting ? "Saving..." : "Confirm"}</span></a>
                                </div>
                            </div>
                        }
                        {["match", "review"].includes(mode) &&
                            <div className="form-nav">
                                <a onClick={() => (setBankTransaction(null))} className="btn btn-gray"><span>Cancel</span></a>
                                {getOptions().map((option, index) => {
                                    return (
                                        <a key={index} onClick={(e) => {
                                           setFieldValue('action', option.id)
                                           setSubmitting(true);
                                           handleSubmit(e)
                                        }} className={`btn ${isConfirmable ? "btn-dark-gray" : "btn-red"}`}><span>{isSubmitting ? "Saving..." : option.name}</span></a>
                                    )
                                })}
                            </div>
                        }
                        {mode == "undo" &&
                            <>
                                <div className="flex-column" style={{paddingTop: "20px"}}>
                                    {bankTransaction.status == constants.bank_transaction_status_options.categorized.key && <>
                                        {bankTransaction.related_object_type == "Deposit" ?
                                            <p className="text-center">Are you sure you want to remove this {insightUtils.humanize(bankTransaction.related_object_type)}?</p>
                                            :
                                            <p className="text-center">Are you sure you want to delete this {insightUtils.humanize(bankTransaction.related_object_type)}?</p>
                                        }
                                    </>}
                                    {bankTransaction.status == constants.bank_transaction_status_options.excluded.key && <>
                                        <div className="flex-column" style={{paddingTop: "20px"}}>
                                            <p className="text-center">Are you sure you want to undo this exclusion?</p>
                                        </div>
                                    </>}
                                </div>
                                <div className="form-nav">
                                    <a onClick={() => (setBankTransaction(null))} className="btn btn-gray"><span>No</span></a>
                                    <a onClick={(e) => {
                                        setFieldValue('action', 'undo');
                                        setSubmitting(true);
                                        handleSubmit(e)
                                    }} className="btn btn-red"><span>{isSubmitting ? "Saving..." : "Yes"}</span></a>
                                </div>
                            </>
                        }
                    </Form>
                )}
            </Formik>

        </>

    )
}


export default BankTransactionActionForm;

