import React, {useEffect, useState} from 'react';
import {useStripe} from '@stripe/react-stripe-js';
import store from "../../../app/store";
import {saveAccountMapping, saveAccountUnlinking, startFinancialConnectionSession, storeFinancialConnectionSession} from "../../../slices/financialConnectionSlice";
import FinancialNav from "../financial/FinancialNav";
import {loadReconcilableAccounts} from "../../../slices/bankAccountSlice";
import Modal from "../../shared/Modal";
import BasicDropdown from "../../shared/BasicDropdown";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import {Link, useNavigate} from "react-router-dom";
import BankAccountBlock from "./BankAccountBlock";
import insightRoutes from "../../../app/insightRoutes";


const FinancialConnectionListPage = ({}) => {

    const navigate = useNavigate()
    const stripe = useStripe();

    const [mode, setMode] = useState(null)
    const [bankAccounts, setBankAccounts] = useState(null)
    const [stripeBankAccounts, setStripeBankAccounts] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState(null)

    useEffect(() => {
        loadBankAccounts()
    }, [])


    const loadBankAccounts = async() => {
        const result = await store.dispatch(loadReconcilableAccounts()).unwrap()

        // Sort linked accounts to the top... and then by name
        const newBankAccounts = result.data.bank_accounts.sort((a, b) => {
            return (`${a.external_stripe_id ? '0' : '1'} ${a.name}` > `${b.external_stripe_id ? '0' : '1'} ${b.name}`)
        })

        setBankAccounts(newBankAccounts)
    }

    function buildStripeBankAccountOptions(key, values){
        const existingMappings = bankAccounts.map((bankAccount) => bankAccount.external_stripe_id)

        // Remove any already-mapped options
        let availableOptions = stripeBankAccounts.filter((stripeBankAccount) => {
            return !existingMappings.includes(stripeBankAccount.id)
        })

        if (values && values.stripe_account_id) {
            availableOptions = availableOptions.filter((stripeBankAccount) => {
                return values.stripe_account_id[key] == stripeBankAccount.id || !Object.values(values.stripe_account_id).includes(stripeBankAccount.id)
            })
        }

        return availableOptions.map((ba) => ({"id": ba.id, "name": ba.display_name}))
    }

    async function startConnectionProcess() {
        const results = await store.dispatch(startFinancialConnectionSession()).unwrap()


        if (results.data.success) {
            const financialConnectionsSessionResult = await stripe.collectFinancialConnectionsAccounts({clientSecret: results.data.client_secret});

            await store.dispatch(storeFinancialConnectionSession({financialConnectionSession: financialConnectionsSessionResult})).unwrap()

            console.log("financialConnectionsSessionResult", financialConnectionsSessionResult)

            if (financialConnectionsSessionResult.financialConnectionsSession?.accounts && financialConnectionsSessionResult.financialConnectionsSession.accounts.length > 0) {
                await setStripeBankAccounts(financialConnectionsSessionResult.financialConnectionsSession.accounts)
                setMode("map-to-bank-accounts")
            }
            else {
                setBaseErrorMessage("No accounts selected via Stripe")
            }
        }
        else {
            setBaseErrorMessage("Unable to begin Stripe process")
        }
    }

    async function handleSaveAccountMapping(values, { setSubmitting }) {

        // Organize the values for relaying back to the server
        let bankAccountData = {}
        Object.keys(values.stripe_account_id).forEach((key) => {
            bankAccountData[key.replace('b','')] = values.stripe_account_id[key]
        })

        await store.dispatch(saveAccountMapping({bankAccountMapping: bankAccountData})).unwrap()

        await loadBankAccounts()
        setMode(null)
        setSubmitting(false)
    }

    async function handleSaveAccountUnlinking(values, { setSubmitting }) {

        console.log("values", values)
        // Organize the values for relaying back to the server
        let bankAccountIds = []
        Object.keys(values.unlinked_account_id).forEach((key) => {
            bankAccountIds.push(key.replace('b',''))
        })

        await store.dispatch(saveAccountUnlinking({bankAccountIds: bankAccountIds})).unwrap()

        await loadBankAccounts()
        setMode(null)
        setSubmitting(false)
    }


    return (
        <>
            <div className="section">
                <img className="section-img" src="/images/photo-bank-transactions.jpg"/>
                <div className="title-block"><h1>Bank Transactions</h1></div>

                <div className="section-table-wrap">
                    <FinancialNav/>

                    {bankAccounts && bankAccounts.length > 0 &&
                        <div className="st-nav">
                            <div></div>

                            <div>
                                {bankAccounts.filter((bankAccount) => (!bankAccount.external_stripe_id)).length > 0 &&
                                    <a onClick={() => startConnectionProcess()} className="btn btn-red">Link Accounts</a>
                                }
                                {bankAccounts.filter((bankAccount) => (!bankAccount.external_stripe_id)).length > 0 && bankAccounts.filter((bankAccount) => (bankAccount.external_stripe_id)).length > 0 &&
                                    <>&nbsp;</>
                                }
                                {bankAccounts.filter((bankAccount) => (bankAccount.external_stripe_id)).length > 0 &&
                                    <a onClick={() => setMode("unlink-bank-accounts")} className="btn btn-gray">Unlink Accounts</a>
                                }
                            </div>

                            <div></div>
                        </div>
                    }

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}<br/><br/></div>}

                    {bankAccounts && <>
                        {bankAccounts.length > 0 ?
                            <div className="section dashboard">
                                <div className="flex-row">
                                {bankAccounts.map((bankAccount, i) => {
                                    return (<BankAccountBlock key={i} bankAccount={bankAccount} />)
                                })}
                                </div>
                            </div>
                            :
                            <>
                                You have no bank accounts set up within Renter Insight. <br/>
                                <br/>
                                <Link to={insightRoutes.bankAccountNew()} state={{return_url: location.pathname + (window.location.search || '')}}>Add Bank Account</Link>
                            </>
                        }
                    </>}
                </div>
            </div>

            {mode == "map-to-bank-accounts" && <Modal closeModal={() => setMode(null)}>
                <Formik initialValues={{}} onSubmit={handleSaveAccountMapping}>
                    {({ handleSubmit, isSubmitting, setSubmitting, values  }) => (
                        <Form>
                            <div className="form-nav flex-column">
                                <h2>Link Accounts</h2>
                                <p>Your un-mapped Renter Insight bank accounts are listed on the left. Map these to the accounts listed on the right.</p>
                            </div>
                            <div className="flex-column">
                                <table className="flex-center">
                                    <tbody>
                                    {bankAccounts.filter((bankAccount) => (!bankAccount.external_stripe_id)).map((bankAccount, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{bankAccount.name}</td>
                                                <td>
                                                    <FormItem name={`stripe_account_id.b${bankAccount.id}`} label="" optional={true}>
                                                        <BasicDropdown name={`stripe_account_id.b${bankAccount.id}`} options={buildStripeBankAccountOptions(`b${bankAccount.id}`, values)} />
                                                    </FormItem>
                                                </td>
                                            </tr>)
                                    })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="form-nav">
                                <a onClick={() => (setMode(null))} className="btn btn-gray"><span>Cancel</span></a>
                                <a onClick={(e) => {setSubmitting(true); handleSubmit(e)}} className="btn btn-red"><span>{isSubmitting ? "Saving..." : "Save"}</span></a>
                            </div>
                        </Form>
                    )}
                </Formik>
            </Modal>}

            {mode == "unlink-bank-accounts" && <Modal closeModal={() => setMode(null)} extraClassName="overlay-box-medium">
                <Formik initialValues={{}} onSubmit={handleSaveAccountUnlinking}>
                    {({ handleSubmit, isSubmitting, setSubmitting, values  }) => (
                        <Form>
                            <div className="form-nav flex-column">
                                <h2>Unlink Accounts</h2>
                                <p>Select the bank accounts you want to unlink and click Unlink.</p>
                            </div>
                            <div className="flex-column">
                                <table className="flex-center">
                                    <tbody>
                                    {bankAccounts.filter((bankAccount) => (bankAccount.external_stripe_id)).map((bankAccount, i) => {
                                        return (
                                            <tr key={i}>
                                                <td><FormItem name={`unlinked_account_id.b${bankAccount.id}`} label={bankAccount.name} type="checkbox" optional={true} /></td>
                                            </tr>)
                                    })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="form-nav">
                                <a onClick={() => (setMode(null))} className="btn btn-gray"><span>Cancel</span></a>
                                <a onClick={(e) => {setSubmitting(true); handleSubmit(e)}} className="btn btn-red"><span>{isSubmitting ? "Unlinking..." : "Unlink"}</span></a>
                            </div>
                        </Form>
                    )}
                </Formik>
            </Modal>}
        </>

    )
}


export default FinancialConnectionListPage;

