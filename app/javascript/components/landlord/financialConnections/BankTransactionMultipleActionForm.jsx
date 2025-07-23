import React from 'react';
import store from "../../../app/store";
import {updateBankTransactionStatus} from "../../../slices/financialConnectionSlice";
import {Form, Formik} from "formik";
import {useSelector} from "react-redux";


const BankTransactionMultipleActionForm = ({mode, bankAccount, setReloadTable, bankTransactions, setBankTransactions}) => {

    const { constants } = useSelector((state) => state.company)

    async function handleSaveTransactions(values, { _setSubmitting, _setErrors }) {
        let statusUpdateValues = {bankAccountId: bankAccount.hash_id, bankTransactionIds: bankTransactions.map((t) => t.id)}

        if (mode == "exclude") {
            statusUpdateValues.status = constants.bank_transaction_status_options.excluded.key
        }
        else if (mode == "undo") {
            statusUpdateValues.status = constants.bank_transaction_status_options.new.key
        }
        else if (mode == "confirm") {
            statusUpdateValues.status = constants.bank_transaction_status_options.categorized.key

            // Push an object of the relationship between the bank transaction and related_object so that we don't have to re-run mapping
            // This will also allow us to add a dropdown in the future
            let bankTransactionMapping = {}

            bankTransactions.forEach((transaction) => {
                bankTransactionMapping[transaction.id] = `${transaction.related_object_type}:${transaction.related_object_hash_id}`
            })

            statusUpdateValues.bankTransactionMapping = bankTransactionMapping
        }

        if (statusUpdateValues.status) {
            const results = await store.dispatch(updateBankTransactionStatus(statusUpdateValues)).unwrap()

            setBankTransactions(null)

            if (results.data.success) {
                setReloadTable(true)
            }
            else if (results.data.errors?.base) {
                alert(results.data.errors?.base)
            }
        }
        else {
            alert(`Hi Tom, ${mode} is not wired up yet`)
        }
    }


    return (
        <>
            <Formik initialValues={{}} onSubmit={handleSaveTransactions}>
                {({ handleSubmit, isSubmitting, setSubmitting, setFieldValue  }) => (
                    <Form>

                        <div className="form-nav flex-column">
                            <h2>Bulk Apply</h2>
                            <p className="text-center">Are you sure you want to {mode} {bankTransactions.length} {bankTransactions.length == 1 ? 'transaction' : 'transactions'}?</p>
                        </div>

                        <div className="form-nav">
                            <a onClick={() => (setBankTransactions(null))} className="btn btn-gray"><span>No</span></a>
                            <a onClick={(e) => (handleSubmit(e))} className="btn btn-red"><span>Yes</span></a>
                        </div>
                    </Form>
                )}
            </Formik>

        </>

    )
}


export default BankTransactionMultipleActionForm;

