import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {updateCurrentCompanyFields} from "../../../../slices/companySlice";
import insightUtils from "../../../../app/insightUtils";
import {FieldArray, Form, Formik} from "formik";
import FormItem from "../../../shared/FormItem";
import BasicDropdown from "../../../shared/BasicDropdown";
import insightRoutes from "../../../../app/insightRoutes";
import {Link, useLocation} from "react-router-dom";
import {displayAlertMessage} from "../../../../slices/dashboardSlice";
import {savePropertyBankAccounts} from "../../../../slices/bankAccountSlice";

function useQuery() {
    const { search } = useLocation();

    return React.useMemo(() => new URLSearchParams(search), [search]);
}

const PaymentsPropertyBankAccountsView = ({}) => {

    let query = useQuery()

    const { currentCompany, properties, constants } = useSelector((state) => state.company)

    const [company, setCompany] = useState(null)
    const [allAccountsSetup, setAllAccountsSetup] = useState(false)
    const [operatingBankAccounts, setOperatingBankAccounts] = useState(null)
    const [depositBankAccounts, setDepositBankAccounts] = useState(null)
    const [companyOperatingBankAccount, setCompanyOperatingBankAccount] = useState(null)
    const [companyDepositBankAccount, setCompanyDepositBankAccount] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(() => {
        if (currentCompany && properties && !company) {
            updateCompanyBankAccounts(currentCompany)
        }

    }, [currentCompany, properties])

    useEffect(() => {
        if (query.get('message') == "new-property") {
            store.dispatch(displayAlertMessage({message: "Your new property has been created.  Please complete the process by configuring its bank accounts."}))
        }
    }, [query])

    function updateCompanyBankAccounts(c) {
        let newCompany = Object.assign({}, c)

        const newOperatingBankAccounts = properties.filter((property) => property.status == "active").map((property) => {
            let account = newCompany.bank_accounts.find((bankAccount) => (bankAccount.property_id == property.id && bankAccount.account_purpose == "operating"))

            account ||= Object.assign(insightUtils.emptyBankAccount("operating"), {property_id: property.id})

            return account
        })

        const newDepositBankAccounts = properties.filter((property) => property.status == "active").map((property) => {
            let account = newCompany.bank_accounts.find((bankAccount) => (bankAccount.property_id == property.id && bankAccount.account_purpose == "deposit"))

            account ||= Object.assign(insightUtils.emptyBankAccount("deposit"), {property_id: property.id})

            return account
        })

        setOperatingBankAccounts(newOperatingBankAccounts)
        setDepositBankAccounts(newDepositBankAccounts)

        setCompanyOperatingBankAccount(currentCompany.bank_accounts[0])

        if (currentCompany.bank_accounts.length > 1) {
            setCompanyDepositBankAccount(currentCompany.bank_accounts[1])
        }
        else {
            setCompanyDepositBankAccount(currentCompany.bank_accounts[0])
        }

        // Are all accounts set up?
        const accountsRemaining = newOperatingBankAccounts.filter((bankAccount) => (!bankAccount.external_id)).concat(newDepositBankAccounts.filter((bankAccount) => (!bankAccount.external_id)))

        setAllAccountsSetup(accountsRemaining.length == 0 && document.location.href.indexOf("onboarding") >= 0)
        setCompany(newCompany)
    }

    function populateWithCompanyAccount(accountArrayName, setFieldValue) {
        let companyBankAccount = null

        if (accountArrayName == "deposit_bank_accounts") {
            companyBankAccount = companyDepositBankAccount
        }
        else {
            companyBankAccount = companyOperatingBankAccount
        }

        if (companyBankAccount) {
            properties.filter((property) => property.status == "active").forEach((_property, index) => {
                setFieldValue(accountArrayName + "." + index + ".account_type", companyBankAccount.account_type)
                setFieldValue(accountArrayName + "." + index + ".routing_number", companyBankAccount.routing_number)
                setFieldValue(accountArrayName + "." + index + ".account_number", companyBankAccount.account_number)
                setFieldValue(accountArrayName + "." + index + ".account_number_confirmation", companyBankAccount.account_number)
            })
        }
    }

    async function handleFormikSubmit(values, {setSubmitting, setErrors}) {

        /*
           SAVE Property Bank Accounts
         */

        setBaseErrorMessage("")

        try {
            const result = await store.dispatch(savePropertyBankAccounts({useSameBankAccountForDeposits: values.use_same_bank_account_for_deposits, operatingBankAccounts: values.operating_bank_accounts, depositBankAccounts: values.deposit_bank_accounts})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                store.dispatch(updateCurrentCompanyFields({payments_onboard_status: response.company.payments_onboard_status, bank_accounts: response.company.bank_accounts}))
                updateCompanyBankAccounts(response.company)

                store.dispatch(displayAlertMessage({message: "Bank Accounts Saved"}))
            }
            else if (response.errors) {
                setErrors(response.errors)

                if (response.errors.base) {
                    setBaseErrorMessage(response.errors.base)
                }

                insightUtils.scrollTo('errors')
            }
        } catch (err) {
            setBaseErrorMessage("Unable to save bank accounts. " + (err || ""))
            setSubmitting(false);
        }
    }

    return (
        <>
            <div className="section" id="ll-section-resident-screening">

                {company && properties &&
                <div className="section-table-wrap">

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={{use_same_bank_account_for_deposits: company.use_same_bank_account_for_deposits, operating_bank_accounts: operatingBankAccounts, deposit_bank_accounts: depositBankAccounts}}
                        enableReinitialize={true}
                        onSubmit={handleFormikSubmit}>
                        {({isSubmitting, values, setFieldValue}) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>{values.use_same_bank_account_for_deposits ? "Property" : "Operating"} Bank Accounts</h3>
                                    {allAccountsSetup ?
                                        <div className="form-nav">
                                            <p style={{textAlign: 'center'}}>
                                                Congrats! All of your accounts have been configured. You are ready to accept payments.
                                                <br/><br/>
                                                <Link className="btn btn-red" to={insightRoutes.financialSummary()}>Continue</Link>
                                            </p>
                                        </div>
                                        :
                                        <>
                                            <p style={{textAlign: "center"}}>We will need to assign bank accounts to each property so that payments can be properly distributed.</p>

                                            {companyOperatingBankAccount && <>
                                                <a className="btn btn-gray" onClick={() => { populateWithCompanyAccount('operating_bank_accounts', setFieldValue) }}>Populate with Company bank account (xxxx-{companyOperatingBankAccount.account_number.slice(-4)})</a><br/><br/>

                                                <div className="form-row">
                                                    <div className="form-item"><label>Property</label></div>
                                                    <div className="form-item"><label>Bank Account Type</label></div>
                                                    <div className="form-item"><label>Routing Number</label></div>
                                                    <div className="form-item"><label>Account Number</label></div>
                                                    <div className="form-item"><label>Confirm Account Number</label></div>
                                                </div>

                                                {<FieldArray
                                                    name="operating_bank_accounts"
                                                    render={() => (
                                                        <>
                                                            {operatingBankAccounts.map((operatingBankAccount, index) => {

                                                                const property = properties.find((property) => (property.id == operatingBankAccount.property_id))

                                                                return (
                                                                <div key={index} className="form-row">
                                                                    <FormItem labelClass="hidden" name="property">
                                                                        <div className="text-left">{property.name}</div>
                                                                    </FormItem>
                                                                    {
                                                                        operatingBankAccount.external_id ?
                                                                            <>
                                                                                <div className="form-item">
                                                                                    <div className="text-left">{insightUtils.getLabel(operatingBankAccount.account_type, constants.bank_account_types)}</div>
                                                                                </div>
                                                                                <div className="form-item">
                                                                                    <div className="text-left">xxxx-{operatingBankAccount.routing_number.slice(-4)}</div>
                                                                                </div>
                                                                                <div className="form-item">
                                                                                    <div className="text-left">xxxx-{operatingBankAccount.account_number.slice(-4)}</div>
                                                                                </div>
                                                                                <div className="form-item">
                                                                                    <div className="text-left"></div>
                                                                                </div>
                                                                            </>
                                                                            :
                                                                            <>
                                                                                <FormItem labelClass="hidden" name={`operating_bank_accounts.${index}.account_type`}>
                                                                                    <BasicDropdown name={`operating_bank_accounts.${index}.account_type`} options={[{id: "checking", name: "Checking"}, {id: "savings", name: "Savings"}]}/>
                                                                                </FormItem>
                                                                                <FormItem labelClass="hidden" name={`operating_bank_accounts.${index}.routing_number`}/>
                                                                                <FormItem labelClass="hidden" name={`operating_bank_accounts.${index}.account_number`}/>
                                                                                <FormItem labelClass="hidden" name={`operating_bank_accounts.${index}.account_number_confirmation`}/>
                                                                            </>
                                                                    }
                                                                </div>)
                                                            })
                                                            }

                                                        </>
                                                    )}
                                                />}

                                                <FormItem label="Use Same Bank Account for Security Deposits" name="use_same_bank_account_for_deposits" type="checkbox" optional={true} />
                                            </>}

                                            {!values.use_same_bank_account_for_deposits && <>
                                                <hr />
                                                <h3>Security Deposit Bank Accounts</h3>

                                                <a className="btn btn-gray" onClick={() => { populateWithCompanyAccount('deposit_bank_accounts', setFieldValue) }}>Populate with Company bank account (xxxx-{companyDepositBankAccount.account_number.slice(-4)})</a><br/><br/>

                                                <div className="form-row">
                                                    <div className="form-item"><label><strong>Property</strong></label></div>
                                                    <div className="form-item"><label><strong>Bank Account Type</strong></label></div>
                                                    <div className="form-item"><label><strong>Routing Number</strong></label></div>
                                                    <div className="form-item"><label><strong>Account Number</strong></label></div>
                                                    <div className="form-item"><label><strong>Confirm Account Number</strong></label></div>
                                                </div>

                                                {<FieldArray
                                                    name="deposit_bank_accounts"
                                                    render={() => (
                                                        <>
                                                            {depositBankAccounts.map((depositBankAccount, index) => {

                                                                const property = properties.find((property) => (property.id == depositBankAccount.property_id))

                                                                return (
                                                                    <div key={index} className="form-row">
                                                                        <FormItem labelClass="hidden" name="property">
                                                                            <div className="text-left">{property.name}</div>
                                                                        </FormItem>
                                                                        {
                                                                            depositBankAccount.external_id ?
                                                                                <>
                                                                                    <div className="form-item">
                                                                                        <div className="text-left">{insightUtils.getLabel(depositBankAccount.account_type, constants.bank_account_types)}</div>
                                                                                    </div>
                                                                                    <div className="form-item">
                                                                                        <div className="text-left">xxxx-{depositBankAccount.routing_number.slice(-4)}</div>
                                                                                    </div>
                                                                                    <div className="form-item">
                                                                                        <div className="text-left">xxxx-{depositBankAccount.account_number.slice(-4)}</div>
                                                                                    </div>
                                                                                    <div className="form-item">
                                                                                        <div className="text-left"></div>
                                                                                    </div>
                                                                                </>
                                                                                :
                                                                                <>
                                                                                    <FormItem labelClass="hidden" name={`deposit_bank_accounts.${index}.account_type`}>
                                                                                        <BasicDropdown name={`deposit_bank_accounts.${index}.account_type`} options={[{id: "checking", name: "Checking"}, {id: "savings", name: "Savings"}]}/>
                                                                                    </FormItem>
                                                                                    <FormItem labelClass="hidden" name={`deposit_bank_accounts.${index}.routing_number`}/>
                                                                                    <FormItem labelClass="hidden" name={`deposit_bank_accounts.${index}.account_number`}/>
                                                                                    <FormItem labelClass="hidden" name={`deposit_bank_accounts.${index}.account_number_confirmation`}/>
                                                                                </>
                                                                        }
                                                                    </div>)
                                                            })
                                                            }

                                                        </>
                                                    )}
                                                />}
                                            </>}

                                            {companyOperatingBankAccount && <div className="form-nav">
                                                <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Save" : "Submitting..."}</span>
                                                </button>
                                            </div>}

                                            <p>If you need to make bank account changes in the future, they must be made by Zego, Powered by PayLease, at (866) 729-5327 or <a href="mailto:help@support.paylease.com">help@support.paylease.com</a>.</p>
                                        </>
                                    }
                                </div>
                            </Form>
                        )}
                    </Formik>


                </div>
                }
            </div>
        </>

    )}

export default PaymentsPropertyBankAccountsView;

