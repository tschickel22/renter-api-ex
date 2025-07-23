import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany, updateCurrentCompanyFields} from "../../../../slices/companySlice";
import StepsHeader from "../../../shared/StepsHeader";
import insightUtils from "../../../../app/insightUtils";
import {Form, Formik} from "formik";
import FormItem from "../../../shared/FormItem";
import StateDropdown from "../../../shared/StateDropdown";
import BasicDropdown from "../../../shared/BasicDropdown";
import PaymentsActivationDocumentsView from "../../companies/PaymentsActivationDocumentsView";

const PaymentsOnboardingCompanyInfoView = ({steps}) => {

    const { currentCompany, constants } = useSelector((state) => state.company)

    const [company, setCompany] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [missingUploadMessage, setMissingUploadMessage] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState([])

    useEffect(() => {
        insightUtils.scrollTo('top')
    }, []);

    useEffect(() => {
        if (currentCompany && !company) {
            let newCompany = Object.assign({}, currentCompany)

            if (!newCompany.bank_accounts || newCompany.bank_accounts.length == 0) newCompany.bank_accounts = [insightUtils.emptyBankAccount("operating"), insightUtils.emptyBankAccount("deposit")]

            setCompany(newCompany)
        }

    }, [currentCompany]);

    function handleBack() {
        store.dispatch(updateCurrentCompanyFields({payments_onboard_status: constants.payment_onboarding_statuses.new.key}))
    }


    return (
        <>
            <div className="section" id="ll-section-resident-screening">

                <StepsHeader steps={steps} currentStep={currentCompany.payments_onboard_status} setCurrentStep={() => {}}/>


                {company &&
                <div className="section-table-wrap">

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={company}
                        onSubmit={async (values, {setSubmitting, setErrors}) => {

                            /*
                               SAVE COMPANY
                             */
                            if (uploadedFiles && uploadedFiles.length == 0) {
                                setMissingUploadMessage("Please upload the documents for identity verification")
                            }
                            else {
                                setBaseErrorMessage("")

                                let valuesToSave = Object.assign({}, values)

                                valuesToSave.payments_onboard_status = constants.payment_onboarding_statuses.agreement.key
                                valuesToSave.company_action = 'payments-onboarding'

                                // Don't push two bank accounts
                                if (valuesToSave.use_same_bank_account_for_deposits) {
                                    valuesToSave.bank_accounts = [valuesToSave.bank_accounts[0]]
                                }

                                try {
                                    const result = await store.dispatch(saveCompany({company: valuesToSave})).unwrap()
                                    const response = result.data

                                    console.log(response)

                                    setSubmitting(false);

                                    if (response.success) {


                                    } else if (response.errors) {
                                        setErrors(response.errors)

                                        if (response.errors.base) {
                                            setBaseErrorMessage(response.errors.base)
                                        }

                                        insightUtils.scrollTo('errors')
                                    }
                                } catch (err) {
                                    setBaseErrorMessage("Unable to save company. " + (err || ""))
                                    setSubmitting(false);
                                }
                            }
                        }}
                    >
                        {({isSubmitting, values}) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Company Information</h3>
                                    <p>To activate electronic payments, you will need to provide information for our payment processor, PayLease (Zego) to complete legally required Know-Your-Customer (KYC) review.</p>

                                    <div className="form-row">
                                        <FormItem label="Legal Business Name" name="legal_business_name" />
                                        <FormItem label="DBA (if different than Legal Name)" name="legal_business_dba" optional={true} />
                                        <FormItem label="Year Formed" name="year_formed" />
                                        <FormItem label="# of Units Managed" name="units_managed" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Address (Physical location required)" name="street" />
                                        <FormItem label="City" name="city" />
                                        <FormItem label="State" name={`state`}>
                                            <StateDropdown name={`state`}/>
                                        </FormItem>
                                        <FormItem label="Zip" name="zip" mask={insightUtils.zipMask()} />
                                    </div>

                                    <h3>Primary Contact (Signing Agreement)</h3>

                                    <div className="form-row">
                                        <FormItem label="First Name" name="primary_contact_first_name" />
                                        <FormItem label="Last Name" name="primary_contact_last_name" />
                                        <FormItem label="Title" name="primary_contact_title" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Phone" name="primary_contact_phone" mask={insightUtils.phoneNumberMask()} />
                                        <FormItem label="Email" name="primary_contact_email" />
                                    </div>

                                    <h3>Know-Your-Customer Contact (If different)</h3>

                                    <div className="form-row">
                                        <FormItem label="First Name" name="secondary_contact_first_name" optional={true} />
                                        <FormItem label="Last Name" name="secondary_contact_last_name" optional={true} />
                                        <FormItem label="Title" name="secondary_contact_title" optional={true}  />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Phone" name="secondary_contact_phone" mask={insightUtils.phoneNumberMask()} optional={true}  />
                                        <FormItem label="Email" name="secondary_contact_email" optional={true}  />
                                    </div>

                                    <h3>Bank Account</h3>
                                    <p>Please enter the account to receive rent payments, fees and to pay any applicable processing fees.  Note, you will be able to add additional accounts in the future for specific properties.</p>

                                    <div className="form-row">
                                        <FormItem label={values.use_same_bank_account_for_deposits ? "Bank Account Type" : "Operating Bank Account Type"} name="bank_accounts.0.account_type">
                                            <BasicDropdown name="bank_accounts.0.account_type" options={[{id: "checking", name: "Checking"}, {id: "savings", name: "Savings"}]} />
                                        </FormItem>
                                        <FormItem label="Routing Number" name="bank_accounts.0.routing_number" />
                                        <FormItem label="Account Number" name="bank_accounts.0.account_number" />
                                        <FormItem label="Account Number Confirmation" name="bank_accounts.0.account_number_confirmation" />
                                    </div>

                                    <FormItem label="Use Same Bank Account for Deposits" name="use_same_bank_account_for_deposits" type="checkbox" optional={true} />

                                    {!values.use_same_bank_account_for_deposits && <>
                                        <div className="form-row">
                                            <FormItem label="Security Deposit Bank Account Type" name="bank_accounts.1.account_type">
                                                <BasicDropdown name="bank_accounts.1.account_type" options={[{id: "checking", name: "Checking"}, {id: "savings", name: "Savings"}]} />
                                            </FormItem>
                                            <FormItem label="Routing Number" name="bank_accounts.1.routing_number" />
                                            <FormItem label="Account Number" name="bank_accounts.1.account_number" />
                                            <FormItem label="Account Number Confirmation" name="bank_accounts.1.account_number_confirmation" />
                                        </div>
                                    </>}

                                    <h3 className="required">Documents Required for Identity Verification</h3>

                                    <div className="text-left">
                                        <ol>
                                            <li>Utility Bill for Primary Contact dated within the past 3 months, lease/mortgage statement or tax document</li>
                                            <li>Driver's License, must be current, Passport or State ID</li>
                                            <li>If you’re enrolling as an individual, not business, upload proof of property ownership.  Mortgage Statement, Tax Statement, or Title.</li>
                                        </ol>
                                    </div>

                                    {missingUploadMessage && <div className="text-error">{missingUploadMessage}</div>}

                                    <PaymentsActivationDocumentsView uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />

                                    <div className="form-nav" style={{paddingBottom: "80px"}}>
                                        <a className="btn btn-gray" onClick={() => handleBack()}>&lt; Back</a>

                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? <>Next &gt;</> : "Submitting..."}</span>
                                        </button>

                                    </div>
                                </div>

                            </Form>
                        )}
                    </Formik>


                </div>
                }
            </div>
        </>

    )}

export default PaymentsOnboardingCompanyInfoView;

