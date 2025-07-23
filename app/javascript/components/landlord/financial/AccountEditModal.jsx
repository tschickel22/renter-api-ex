import React, {useEffect, useState} from 'react';
import FinancialNav from "./FinancialNav";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import Modal from "../../shared/Modal";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import {loadAccount, saveAccount} from "../../../slices/accountSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import insightRoutes from "../../../app/insightRoutes";
import {loadBankAccount, loadBankAccountForAccountId} from "../../../slices/bankAccountSlice";

const AccountEditModal = ({}) => {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    const { accountCategories, constants } = useSelector((state) => state.company)

    const [account, setAccount] = useState(null)
    const [organizedCategories, setOrganizedCategories] = useState(null)
    const [deletingAccount, setDeletingAccount] = useState(false)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async () => {

        let newAccount = null;
        /*
           Load Account
         */
        if (params.accountCode) {
            const results = await store.dispatch(loadAccount({accountCode: params.accountCode})).unwrap()
            newAccount = results.data.account

            // If this is a bank account, go somewhere else
            if (newAccount.bank_account_hash_id) {
                navigate(insightRoutes.bankAccountEdit(newAccount.bank_account_hash_id))
            }
        }
        else {
            newAccount = insightUtils.emptyAccount()
        }


        /*
            Organize categories
         */
        let newOrganizedCategories = []

        accountCategories.forEach((category) => {
            // When you edit an account you cant change an income account to an expense account
            if (!newAccount.id || newAccount.account_type == category.account_type) {
                let newCategory = Object.assign({}, category)

                if (newCategory.parent_account_category) {
                    newCategory.name = newCategory.parent_account_category.name + ": "+ newCategory.name
                }

                newOrganizedCategories.push(newCategory)
            }
        })

        setOrganizedCategories(newOrganizedCategories)
        setAccount(newAccount)

    }, []);

    function closeView(newAccountId) {
        insightUtils.handleBackNavigation(insightRoutes.accountList(), location, navigate, newAccountId)
    }

    async function handleNavigationToBankAccounts() {
        // Should we go to edit a bank account or create one?
        if (account.id) {
            navigate(insightRoutes.bankAccountEdit(account.bank_account_hash_id))
        }
        else {
            navigate(insightRoutes.bankAccountNew())
        }
    }

    async function handleDeleteAccount() {
        closeView()
    }


    return (
        <>

            <div className="section">

                {account &&
                <Modal closeView={closeView}>

                    <h2>{params.accountCode ? "Edit" : "Create"} Account</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={account}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setBaseErrorMessage("")

                            try {
                                const result = await store.dispatch(saveAccount({account: values})).unwrap()
                                const response = result.data

                                console.log(response)

                                setSubmitting(false);

                                if (response.success) {
                                    closeView(response.account.id)
                                }
                                else if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            catch(err) {
                                console.log("UH-OH", err)
                                setBaseErrorMessage("Unable to save account")
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ values, isSubmitting }) => (
                            <Form>
                                <div className="add-property-wrap">

                                    <div className="form-row">
                                        <FormItem label="Category" name="account_category_id">
                                            {organizedCategories && <BasicDropdown name="account_category_id" options={organizedCategories} blankText="-- Select Category --" />}
                                        </FormItem>
                                    </div>
                                    {[1, 21].indexOf(parseInt(values.account_category_id)) >= 0 && (!account.id || account.bank_account_hash_id) ?
                                        <>
                                            <div className="form-row">
                                                <p>Please use the <a onClick={() => handleNavigationToBankAccounts()}>Bank Accounts</a> interface to {account.id ? "edit" : "add"} this type of account.</p>
                                            </div>
                                        </>
                                        :
                                        <>
                                            <div className="form-row">
                                                {account.id && constants && constants.account_protected_codes.find((code) => (parseFloat(code) == parseFloat(values.code || "0"))) ?
                                                    <FormItem label="Code" name="code">
                                                        <div>{values.code}</div>
                                                    </FormItem>
                                                    :
                                                    <FormItem label="Code" name="code" placeholder="Enter a numeric code for use on reports" />
                                                }
                                            </div>
                                            <div className="form-row">
                                                <FormItem label="Name" name="name" />
                                            </div>
                                            <div className="form-row">
                                                <FormItem label="Description" name="description" type="textarea" optional={true} />
                                            </div>

                                            <div className="form-row">
                                                &nbsp;
                                            </div>

                                            {!deletingAccount &&
                                            <div className="form-nav">
                                                <a onClick={() => closeView()} className="btn btn-gray"><span>Cancel</span></a>
                                                {false && account.id && <a onClick={() => (setDeletingAccount(true))} className="btn btn-gray"><span>Delete Account</span></a>}
                                                <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                            </div>
                                            }
                                            {deletingAccount &&
                                            <>
                                                <div className="form-nav">
                                                    Are you sure you want to delete this account?
                                                </div>
                                                <div className="form-nav">
                                                    <a onClick={() => (setDeletingAccount(false))} className="btn btn-gray"><span>No</span></a>
                                                    <a onClick={() => (handleDeleteAccount())} className="btn btn-red"><span>Yes</span></a>
                                                </div>
                                            </>
                                            }
                                    </>}
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Modal>
                }

            </div>

        </>

    )}

export default AccountEditModal;

