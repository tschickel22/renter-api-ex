import React, {useEffect, useState} from 'react';

import {useLocation, useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import {loadBankAccount, saveBankAccount} from "../../../slices/bankAccountSlice";
import DatePicker from "react-datepicker";
import SettingSubGroupListRow from "../settings/SettingSubGroupListRow";
import ResidentFormRow from "../leases/ResidentFormRow";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const BankAccountEditPage = ({}) => {
    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { constants, settings, settingsConfig, properties } = useSelector((state) => state.company)
    const settingGroup = settingsConfig["check_printing"]

    const [bankAccount, setBankAccount] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [currentSettings, setCurrentSettings] = useState(null)

    useEffect(async () => {
        if (settings) {
            setCurrentSettings(insightUtils.getSettings(settings))
        }
    }, [settings])

    useEffect(async () => {

        let newBankAccount = null;
        /*
           Load Account
         */
        if (params.bankAccountId) {
            const results = await store.dispatch(loadBankAccount({bankAccountId: params.bankAccountId})).unwrap()

            newBankAccount = results.data.bank_account
            newBankAccount.opened_on = insightUtils.parseDate(newBankAccount.opened_on)
        }
        else {
            newBankAccount = insightUtils.emptyBankAccount("expenses")
        }

        setBankAccount(newBankAccount)

    }, []);

    function closeView(newBankAccountAccountId) {
        insightUtils.handleBackNavigation(insightRoutes.accountList(), location, navigate, newBankAccountAccountId)
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        try {
            values.in_account_setup = true

            const result = await store.dispatch(saveBankAccount({bankAccount: values})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                closeView(response.bank_account.account_id)
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
            setBaseErrorMessage("Unable to save bank account")
            setSubmitting(false);
        }
    }

    return (
        <>

            <div className="section">

                {bankAccount && properties &&
                    <>
                    <h2>{params.bankAccountId ? "Edit" : "Create"} Account</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={bankAccount}
                        onSubmit={handleFormikSubmit}
                    >
                        {({ isSubmitting , values, setFieldValue}) => (
                            <Form>
                                <div className="add-property-wrap">

                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-50" label="Account Type" name="account_type">
                                            <BasicDropdown name="account_type" options={constants.bank_account_types}/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-50" label="Name" name="name"/>
                                    </div>

                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-50" label="Company / Property" name="property_id">
                                            {bankAccount.id ?
                                                <div className="form-value">
                                                    {bankAccount.property_id ? properties.find((p) => p.id == bankAccount.property_id)?.name : 'Company-Level Account'}
                                                </div>
                                                :
                                                <BasicDropdown name="property_id" blankText="Company-Level Account" options={properties} />
                                            }
                                        </FormItem>
                                    </div>

                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-50" label="Starting Date" name="opened_on">
                                            <DatePicker className="form-input form-input-white" selected={values.opened_on} onChange={(date) => setFieldValue("opened_on", date)} disabled={bankAccount.reconciled_until}/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row form-center">
                                        <FormItem formItemClass="form-item-50" label="Opening Balance" name="opening_balance" mask={insightUtils.currencyMask(true)} disabled={bankAccount.reconciled_until}/>
                                    </div>


                                    {currentSettings && currentSettings.check_printing_enabled && <div style={{maxWidth: "550px", margin: "0 auto", textAlign: "left"}}>
                                        <hr/>
                                        {settingGroup && settingGroup.sub_groups.map((settingSubGroup, index) => (
                                            <SettingSubGroupListRow key={index} settingGroup={settingGroup} settingSubGroup={settingSubGroup}/>
                                        ))}
                                    </div>}

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray"><span>Cancel</span></a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                    </div>

                                </div>


                            </Form>
                        )}
                    </Formik>
                    </>
                }

            </div>

        </>

    )
}

export default BankAccountEditPage;

