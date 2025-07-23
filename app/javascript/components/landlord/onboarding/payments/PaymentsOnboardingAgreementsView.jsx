import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import store from "../../../../app/store";
import {saveCompany, updateCurrentCompanyFields} from "../../../../slices/companySlice";
import StepsHeader from "../../../shared/StepsHeader";
import insightUtils from "../../../../app/insightUtils";
import {Form, Formik} from "formik";
import FormItem from "../../../shared/FormItem";

const PaymentsOnboardingAgreementsView = ({steps}) => {

    const { currentCompany, constants, settings } = useSelector((state) => state.company)

    const [company, setCompany] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const globalSettings = insightUtils.getSettings(settings)

    function handleBack() {
        store.dispatch(updateCurrentCompanyFields({payments_onboard_status: constants.payment_onboarding_statuses.started.key}))
    }

    useEffect(() => {
        insightUtils.scrollTo('top')
    }, []);

    useEffect(() => {
        if (currentCompany && !company) {
            let newCompany = Object.assign({}, currentCompany)

            setCompany(newCompany)
        }

    }, [currentCompany]);


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

                            setBaseErrorMessage("")

                            values.payments_onboard_status = constants.payment_onboarding_statuses.taxpayer_info.key
                            values.company_action = 'payments-onboarding'

                            try {
                                const result = await store.dispatch(saveCompany({company: values})).unwrap()
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
                        }}
                    >
                        {({isSubmitting, values}) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <h3>Payments Agreement</h3>
                                    <p>To activate electronic payments, you will need to provide information for our payment processor, PayLease (Zego) to complete legally required Know-Your-Customer (KYC) review.</p>

                                    <div className="section zego-agreement">
                                        <p>I, the undersigned, the authorized representative of the Client identified below (the “Client”), in consideration of the services described hereunder, hereby appoint and authorize Renter Insight, LLC (“Renter Insight”) to act as my representative to provide payment services and facilitate payments from my residents or other payers (each a “Payer”) who initiate payment transactions through Renter Insight under the terms and conditions set forth below.</p>
                                        <ol>
                                            <li><u>General Authorization</u>. I hereby:
                                                <ol type="a">
                                                    <li>authorize Renter Insight to collect payments from all payers who register for the Renter Insight service.</li>
                                                    <li>authorize Renter Insight to credit such payments to my account(s) provided to Renter Insight, less any transaction fees, on a monthly basis.</li>
                                                    <li>acknowledge that Renter Insight utilizes a partner, PayLease LLC (dba Zego), in the fulfillment of the Renter Insight services, including receiving and settling payments to me.</li>
                                                    <li>authorize PayLease, LLC (DBA Zego), (“Renter Insight Agent”) to act as my limited agent for the purpose of receiving, holding, facilitating, and settling payments made by Payers to me. Renter Insight Agent will settle to me payments that are received by Renter Insight Agent less any fees or other obligations owed to Renter Insight Agent. I agree that a payment received by Renter Insight Agent, on my behalf, satisfies the Payer’s obligations to make the applicable payment to me, regardless of whether Renter Insight Agent actually settles such payment to me, and accordingly, such payment obligation is considered satisfied and extinguished upon receipt. Subject to applicable laws, government regulations and card association rules, in the event Renter Insight Agent does not make any such payment to me as described in these Terms, I will have recourse against Renter Insight Agent and not Payer, as such payment is deemed made by Payer to me upon receipt by Renter Insight Agent.</li>
                                                    <li>authorize Renter Insight Agent to create a Merchant ID account for the Client to process VISA, MasterCard, Discover and American Express payments (an executed American Express Addendum as applicable, is required and made a part of this Agreement).</li>
                                                    <li>authorize Renter Insight Agent to manage and collect VISA, MasterCard, Discover and American Express credit card payments through the Merchant ID for the Client. All payments will be credited to the Client’s existing bank account (s) on file with Renter Insight, less any transaction fees associated with such payment. Transactions processed via this Merchant ID will be exclusively on behalf of the Client.</li>
                                                    <li>I will make the Renter Insight Agent Terms of Use found at <a href="https://www.gozego.com/terms-of-use/" target="_blank">https://www.gozego.com/terms-of-use/</a> and the Renter Insight Agent Privacy Policy found at <a href="https://www.gozego.com/corp/privacy-policy/" target="_blank">https://www.gozego.com/corp/privacy-policy/</a>   available to all Payers.</li>
                                                    <li>I understand that this agreement is subject to the Client passing a standard due diligence review.</li>
                                                </ol>
                                            </li>
                                            <li><u>Representations and Warranties by Representative</u>. The Representative hereby warrants and represents to Renter Insight as follows:
                                                <ol type="a">
                                                    <li><u>Representation of Client</u>. I represent the Client and all properties owned or managed by the Client.</li>
                                                    <li><u>Authority to Bind Client</u>. I have full authority to enter into this Agreement and legally bind Client to this Agreement.</li>
                                                    <li><u>Consents and Approvals</u>. All consents and approvals necessary for the Client to enter into this Agreement have been obtained or waived.</li>
                                                </ol>
                                            </li>
                                            <li><u>Returns and Chargebacks</u>. In the event that a credit issued by Renter Insight or Renter Insight Agent on behalf of one of the Client’s Payers is returned by the account holder’s bank or credit card company for any reason, including, fraudulent activity, insufficient funds, chargeback dispute, or any returned item, the credit for the returned item issued will be reversed from the original deposit account by the account holder’s bank or credit card company. In this event, sufficient funds shall be available for reversal, and the Client shall be liable to the extent that such funds are not available. If Renter Insight or Renter Insight Agent is required to pursue any action for liability for such reversals or for the non-payment of any Client fees, Client agrees to pay all costs (including collection costs, court fees and attorneys’ fees) to secure payment of such funds. In the event that a credit issued by Renter Insight Agent is returned or reversed by the account holder’s bank for insufficient funds, Renter Insight Agent will also debit the account holder’s bank account a fee in an amount which is pursuant to applicable law. This fee is fully disclosed to the Payer through the Renter Insight Agent Terms of Use, referred to herein at item 1.g. above.</li>
                                            <li><u>Term and Termination of Agreement</u>. The initial term of this Agreement begins on the date set forth below and will continue for a period of one (1) year (the “Initial Term”).  Thereafter the Agreement will automatically renew for additional one (1) year periods, unless Client or Renter Insight Agent provides notice of non-renewal at least sixty (60) days prior to the renewal date (the “Renewal Term(s)”) (the Initial Term and any Renewal Term(s), collectively referred to as the “Term”).  Notwithstanding the above, this Agreement will terminate upon the termination or expiration of Client’s services agreement with Renter Insight.
                                                <br/><br/>
                                                Either Client or Renter Insight Agent may terminate this Agreement: 1) upon a material breach of the Agreement that is uncured within sixty (60) days of receiving written notice from the non-breaching party of such material breach; and/or 2) immediately upon (a) the institution by or against the other party of insolvency, receivership or bankruptcy proceedings or any other proceeding for the settlement of the other party’s debts, (b) upon the other party making an assignment for the benefit of creditors; or (c) upon the other party’s dissolution or ceasing to do business (collectively, a “Termination for Cause”). Renter Insight may also terminate this Agreement immediately if Renter Insight has a reasonable belief of fraud associated with the services provided by this Agreement, or for any breach by the Client of the terms of this Agreement. Additionally, Renter Insight Agent may suspend the provision of the payments services and/or terminate this Agreement if Renter Insight Agent, in its reasonable sole discretion, determines that: a) providing the payment services poses a security or integrity risk to Client, other customers, or to Renter Insight Agent; or b) there has been, or may be, a security breach, fraud, misrepresentation, and/or a violation of a Law, rule, or regulation in connection with the payment services.  In the event a chargeback or returned item processes to the Client after the termination date, sufficient funds shall be available for reversal, and the Client shall be liable to Renter Insight Agent the extent that such funds are not available.
                                            </li>
                                            <li><u>ACH Transactions</u>. The origination of Automated Clearing House (“ACH”) transactions to Client’s Account must comply with all applicable state and federal laws and the NACHA Operating Rules.</li>
                                            <li><u>Fees</u>. Client and/or Client’s Payers will be responsible for payment of the fees listed in the chart below. Such fees are determined by Renter Insight.  All payments will be credited to Client’s existing bank account(s) designated by Client less any fees payable to Renter Insight Pay Agent (pursuant to Renter Insight Pay Agent’s agreement with Renter Insight) and/or Renter Insight. Transactions processed through this Merchant ID will be exclusively for Client.</li>
                                        </ol>

                                        <div className="section-table">
                                            <div className="st-table-scroll">

                                                <div className="flex-row flex-center">
                                                    <div className="st-col-50 text-center bordered-header"><h3>Cash Pay Fees</h3></div>
                                                </div>

                                                <div className="flex-row flex-center">
                                                    <span className="st-col-50 ">
                                                        Cash Pay Fee: Incurred by Payer: {insightUtils.numberToCurrency(globalSettings.payment_fee_cash_resident, 2)}<br/>
                                                        <br/>
                                                        Cash Pay Services allow Payers to use walk-in payment services to make payments to Client at specified retail locations.
                                                    </span>
                                                </div>

                                                <div className="flex-row flex-center">
                                                    <div className="st-col-50 text-center bordered-header"><h3>ACH Transaction Fees (Select Preference)</h3></div>
                                                </div>


                                                <div className="flex-row flex-center">
                                                    <span className="st-col-50 ">
                                                        <FormItem name="default_resident_responsible_fee_ach" radioValue={false} type="radio" label={insightUtils.numberToCurrency(globalSettings.payment_fee_ach_property, 2) + " Per ACH Transaction*<br/>(Incurred by Client)"} />

                                                        <br/>
                                                          OR
                                                        <br/>
                                                        <br/>

                                                        <FormItem name="default_resident_responsible_fee_ach" radioValue={true} type="radio" label={insightUtils.numberToCurrency(globalSettings.payment_fee_ach_resident, 2) + " Per ACH Transaction*<br/>(Incurred by Payer)"} />
                                                        <br/>
                                                        *No fee with Renter Insight Professional Plan
                                                        <br/>
                                                        <br/>
                                                        <br/>
                                                    </span>
                                                </div>

                                                <div className="flex-row flex-center">
                                                    <div className="st-col-50 text-center bordered-header"><h3>Credit Card Transaction Fees (Select Preference)</h3></div>
                                                </div>

                                                <div className="flex-row flex-center">
                                                    <span className="st-col-50">
                                                        <FormItem name="default_resident_responsible_fee_credit_card" radioValue={false} type="radio" label={insightUtils.numberWithCommas(globalSettings.payment_fee_credit_card_property, 2) + "% Per MasterCard / Discover/ Visa / AMEX Transaction*<br/>(Incurred by Client)"} />

                                                        <br/>
                                                          OR
                                                        <br/>
                                                        <br/>

                                                        <FormItem name="default_resident_responsible_fee_credit_card" radioValue={true} type="radio" label={insightUtils.numberWithCommas(globalSettings.payment_fee_credit_card_resident, 2) + "% Per MasterCard / Discover/ Visa / AMEX Transaction*<br/>(Incurred by Payer)"} />
                                                        <br/>
                                                        *For all credit card transactions incurred by the Payer, a service fee equal to the ACH transaction fee and rounded up to the next $0.95 increment, will be charged in accordance with major card rules and regulations.

                                                    </span>
                                                </div>
                                                <div className="flex-row flex-center">
                                                    <div className="st-col-50 text-center bordered-header"><h3>Debit Card Transaction Fees (Select Preference)</h3></div>
                                                </div>
                                                <div className="flex-row flex-center">
                                                    <span className="st-col-50 ">
                                                          <FormItem name="default_resident_responsible_fee_debit_card" radioValue={false} type="radio" label={insightUtils.numberToCurrency(globalSettings.payment_fee_debit_card_property, 2) + " Per Debit Card Transaction*<br/>(Incurred by Client)"} />

                                                        <br/>
                                                          OR
                                                        <br/>
                                                        <br/>

                                                        <FormItem name="default_resident_responsible_fee_debit_card" radioValue={true} type="radio" label={insightUtils.numberToCurrency(globalSettings.payment_fee_debit_card_resident, 2) + " Per Debit Card Transaction*<br/>(Incurred by Payer)"} />
                                                        <br/>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-row flex-center">
                                                <div className="st-col-50 text-center bordered-header"><h3>Client's preferred 1099-K reporting<br/>(select one of the two options below)</h3></div>
                                            </div>
                                            <div className="flex-row flex-center">
                                                <span className="st-col-50">

                                                    <FormItem name="consolidated_1099" radioValue={true} type="radio" label="One consolidated 1099-K reported to Client's legal name and tax ID." />

                                                    <br/>
                                                    OR
                                                    <br/>
                                                    <br/>

                                                    <FormItem name="consolidated_1099" radioValue={false} type="radio" label="Individual 1099-Ks reported per bank account owner.  A completed W-9 is required for each entity." />
                                                </span>
                                            </div>


                                            <div className="flex-row flex-center">
                                                <div className="st-col-50 text-center"><h3>Client</h3></div>
                                            </div>
                                            <div className="flex-row flex-center">
                                                <span className="st-col-50">
                                                    <div className="form-row">
                                                        <div className="form-item"><label>Company Name</label>{currentCompany.legal_business_name}</div>
                                                        <div className="form-item"><label>Total Units Managed (Portfolio)</label>{currentCompany.units_managed}</div>
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="form-item"><label>Representative Name, Print</label>{currentCompany.primary_contact_first_name} {currentCompany.primary_contact_last_name}</div>
                                                        <div className="form-item"><label>Title</label>{currentCompany.primary_contact_title}</div>
                                                    </div>

                                                    <div className="form-row">
                                                        <FormItem label="Representative Signature" name="payments_agreement_signature" placeholder="Type your name as it appears above" />
                                                    </div>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-nav">
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

export default PaymentsOnboardingAgreementsView;

