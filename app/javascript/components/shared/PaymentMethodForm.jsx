import React, {useEffect, useState} from 'react';
import {Field, useFormikContext} from "formik";
import insightUtils from "../../app/insightUtils";
import FormItem from "./FormItem";
import BasicDropdown from "./BasicDropdown";
import StateDropdown from "./StateDropdown";
import {useSelector} from "react-redux";

const PaymentMethodForm = ({title, existingPaymentMethods, excludeDebitCards, excludeCash, methodTypeLabel, prefix, paymentMethodIdName, property, showFees}) => {
    const formikProps = useFormikContext()
    const valuesPrefix = prefix || ""

    const { settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState(null)

    useEffect(async () => {
        let newCurrentSettings = null

        if (settings && property) {
            newCurrentSettings = insightUtils.getSettings(settings, property.id)
            setCurrentSettings(newCurrentSettings)
        }

        let newAvailablePaymentMethods = [...(existingPaymentMethods || [])]

        if (excludeDebitCards) {
            newAvailablePaymentMethods = newAvailablePaymentMethods.filter((pm) => pm.method != "debit_card" )
        }

        if (excludeCash) {
            newAvailablePaymentMethods = newAvailablePaymentMethods.filter((pm) => pm.method != "cash" )
        }

        if (!excludeCash && !(newAvailablePaymentMethods.find((pm) => pm.method == "cash")) && (!newCurrentSettings || (newCurrentSettings.available_payment_methods_default_cash && (property?.state != "CO" || newCurrentSettings.available_payment_methods_co_cash)))) {
            newAvailablePaymentMethods.push({id: "new_cash", name: "Cash Pay"})
        }

        // Add this method if we don't have settings yet, if the default is on, and if the property isn't in CO or that specific setting is on too
        if (!newCurrentSettings || (newCurrentSettings.available_payment_methods_default_credit_card && (property?.state != "CO" || newCurrentSettings.available_payment_methods_co_credit_card))) {
            newAvailablePaymentMethods.push({id: "new_credit_card", name: "New Credit Card"})
        }

        if (!excludeDebitCards && ((!newCurrentSettings || (newCurrentSettings.available_payment_methods_default_debit_card && (property?.state != "CO" || newCurrentSettings.available_payment_methods_co_debit_card))))) {
            newAvailablePaymentMethods.push({id: "new_debit_card", name: "New Debit Card"})
        }

        if (!newCurrentSettings || (newCurrentSettings.available_payment_methods_default_ach && (property?.state != "CO" || newCurrentSettings.available_payment_methods_co_ach))) {
            newAvailablePaymentMethods.push({id: "new_ach", name: "New Bank Account"})
        }

        setAvailablePaymentMethods(newAvailablePaymentMethods)

    }, [settings, property, excludeCash])

    return (
        <>
            {availablePaymentMethods &&
            <div className="form-row form-center">
                <div className="st-col-50">
                    {title && <h3>{title}</h3>}
                    <FormItem label={methodTypeLabel || "How are You Going to Pay?"} name={paymentMethodIdName}>
                        <BasicDropdown name={paymentMethodIdName} options={availablePaymentMethods} direction="row" />
                    </FormItem>
                </div>
                {showFees &&
                    <div className="st-col-50">
                        <h3>Fees</h3>

                        ACH: {currentSettings.resident_responsible_recurring_charges_ach ? insightUtils.numberToCurrency(currentSettings.payment_fee_ach_resident, 2) : insightUtils.numberToCurrency(0, 2)} Per Payment<br/>

                        Credit Card: {currentSettings.resident_responsible_recurring_charges_credit_card ? '% of payment calculated below' : insightUtils.numberToCurrency(0, 2) + " Per Payment"}<br/>

                        {!excludeDebitCards &&
                            <>
                                Debit Card: {currentSettings.resident_responsible_recurring_charges_debit_card ? insightUtils.numberToCurrency(currentSettings.payment_fee_debit_card_resident, 2) : insightUtils.numberToCurrency(0, 2)} Per Payment<br/>
                            </>
                        }

                        Cash Pay: {insightUtils.numberToCurrency(currentSettings.payment_fee_cash_resident, 2)} Per Payment<br/>
                    </div>
                }
            </div>}

            {["new_credit_card", "new_debit_card", "new_ach"].includes(formikProps.values[paymentMethodIdName]) &&
            <>
                <div className="form-row">
                    <FormItem label="First Name" name={valuesPrefix + "billing_first_name"} />
                    <FormItem label="Last Name" name={valuesPrefix + "billing_last_name"} />
                    <FormItem label="Payment Method Nickname" name={valuesPrefix + "nickname"} optional={true} />
                </div>

                <div className="form-row">
                    <FormItem label="Billing Address" name={valuesPrefix + "billing_street"} />
                    <FormItem label="City" name={valuesPrefix + "billing_city"} />
                    <FormItem label="State" name={valuesPrefix + "billing_state"}><StateDropdown name={valuesPrefix + "billing_state"}/></FormItem>
                    <FormItem label="Zip" name={valuesPrefix + "billing_zip"} mask={insightUtils.zipMask()} />
                </div>

                {formikProps.values[paymentMethodIdName] == "new_ach" && <>
                    <div className="form-row">
                        <FormItem label="Account Type" name={valuesPrefix + "ach_account_type"}>
                            <BasicDropdown name={valuesPrefix + "ach_account_type"} options={[{id: "checking", name: "Checking"}, {id: "savings", name: "Savings"}]} direction="row" />
                        </FormItem>
                        <FormItem label="Routing Number" name={valuesPrefix + "ach_routing_number"} />
                        <FormItem label="Account Number" name={valuesPrefix + "ach_account_number"} />
                    </div>
                </>}

                {(formikProps.values[paymentMethodIdName] == "new_credit_card" || formikProps.values[paymentMethodIdName] == "new_debit_card") && <>
                    <div className="form-row">
                        <FormItem label="Card Number" name={valuesPrefix + "credit_card_number"} />
                        <FormItem label="Exp Date" name={valuesPrefix + "credit_card_expires_on"} placeholder="MM/YY" mask={insightUtils.expirationDateMask()} />
                        <FormItem label="CVV" name={valuesPrefix + "credit_card_cvv"} formItemClass="form-item-25"  />
                    </div>
                </>}

            </>
            }
        </>
    )}

export default PaymentMethodForm;

