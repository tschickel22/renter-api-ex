import React, {useEffect, useState} from 'react';
import {Link} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";
import store from "../../../app/store";

import {loadChargesAndLedgerItems} from "../../../slices/chargeSlice";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import BasicDropdown from "../../shared/BasicDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {useFormikContext} from "formik";
import {loadResidentPaymentMethods} from "../../../slices/paymentSlice";
import {determineCheckPrintingEligibility} from "../../../slices/leaseSlice";

const MoveOutChargesView = ({lease, checkPrintingEnabled}) => {

    const formikProps = useFormikContext()

    const { constants } = useSelector((state) => state.company)
    const [chargesAndLedgerItems, setChargesAndLedgerItems] = useState([])
    const [balanceAndNewCharges, setBalanceAndNewCharges] = useState([])
    const [residentPaymentMethods, setResidentPaymentMethods] = useState(null)

    useEffect(async() => {

        /*
           Load Charges
         */
        const charge_results = await store.dispatch(loadChargesAndLedgerItems({leaseId: lease.hash_id, mode: "move_out"})).unwrap()
        let charges = Array.from(charge_results.data.charges)
        let ledgerItems = Array.from(charge_results.data.ledger_items)
        const newChargesAndLedgerItems = charges.concat(ledgerItems)
        let currentBalance = insightUtils.calculateChargesTotal(ledgerItems)

        setBalanceAndNewCharges([{description_pretty: "Current Balance", amount: currentBalance}].concat(charges))
        setChargesAndLedgerItems(newChargesAndLedgerItems)

        const payment_method_results = await store.dispatch(loadResidentPaymentMethods({leaseResidentId: lease.primary_resident.hash_id})).unwrap()
        console.log("payment_method_results", payment_method_results)
        setResidentPaymentMethods(payment_method_results.data.resident_payment_methods)

    }, [])

    function runSearch(_text, _page) {
        return {total: balanceAndNewCharges.length, objects: balanceAndNewCharges}
    }

    function generateTableRow(charge, key) {
        return (
            <div key={key} className="st-row-wrap">
                <div className="st-row">
                    <span className="st-col-25 st-first-col">{charge.description_pretty}</span>
                    <span className="st-col-25 text-right">{charge.frequency == constants.charge_frequencies.one_time.key && charge.amount > 0 ? insightUtils.numberToCurrency(charge.amount, 2) : ''}</span>
                    <span className="st-col-25 text-right">{charge.frequency == constants.charge_frequencies.monthly.key? insightUtils.numberToCurrency(charge.amount, 2) : ''}</span>
                    <span className="st-col-25 text-right">{insightUtils.numberToCurrency(charge.prorated_amount || charge.amount, 2)}</span>
                    <span className="st-nav-col">{charge.hash_id ? <Link to={insightRoutes.financialChargeEdit(charge.hash_id)} style={{marginLeft: "10px"}}><i className="fa fa-pencil"></i></Link> : <>&nbsp;</>}</span>
                </div>
            </div>
        )
    }

    return (
        <>
            <ListPage
                hideSearch={true}
                titleImage={<></>}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                noDataMessage={
                    <div className="st-row-wrap">

                        <div className="st-row">
                            <span className="st-col-100 text-center">No Charges Exist</span>
                        </div>

                        <div className="st-row">
                            <span className="st-col-100 text-center"><Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id, true, true)} className="btn btn-red">Add Charge</Link></span>
                        </div>
                    </div>
                }
                reloadWhenChanges={chargesAndLedgerItems}
                numberPerPage={100000}
                columns={
                    [
                        {label: "", class: "st-col-25"},
                        {label: "One-Time Charges", class: "st-col-25 text-right"},
                        {label: "Monthly Charges", class: "st-col-25 text-right"},
                        {label: "Due at Move-Out", class: "st-col-25 text-right"},
                    ]
                }
                footerRow={chargesAndLedgerItems.length > 0 &&<>
                    <div className="st-row-wrap">

                        <div className="st-row">
                            <span className="st-col-25 st-first-col"></span>
                            <span className="st-col-75 text-right"><strong>Total:</strong> {insightUtils.numberToCurrency(insightUtils.calculateChargesTotal(chargesAndLedgerItems), 2)}</span>
                            <span className="st-nav-col">&nbsp;</span>
                        </div>

                    </div>

                    <br/>

                    <div className="st-col-100 text-center"><Link to={insightRoutes.financialChargeNew(lease.property_id, lease.hash_id, true, true)} className="btn btn-red">Add Charge</Link></div>
                </>}
            />

            {insightUtils.calculateChargesTotal(chargesAndLedgerItems) < 0 &&
                <>
                    <hr className="hr-light"/>
                    <h3>Resident Refund</h3>


                    {checkPrintingEnabled &&
                        <div className="form-row">
                            <div className="form-item form-item-25"></div>
                            <FormItem name="security_deposit_refund_mode" label="How would you like to refund the resident?" formItemClass="form-left form-item-50">
                                <RadioButtonGroup name="security_deposit_refund_mode" options={constants.lease_refund_modes} direction="row"/>
                            </FormItem>
                            <div className="form-item form-item-25"></div>
                        </div>
                    }

                    {false &&
                        <>
                        {formikProps.values.security_deposit_refund_mode == constants.lease_refund_modes.ach.key &&
                            <FormItem name="security_deposit_refund_payment_method_id" label="Select the ACH account:" formItemClass="form-left form-item-50">
                                <BasicDropdown name="security_deposit_refund_payment_method_id" options={residentPaymentMethods} optionLabelName="nickname" />
                            </FormItem>
                        }
                        </>
                    }

                    {formikProps.values.security_deposit_refund_mode == constants.lease_refund_modes.paper_check_handwritten.key &&
                        <div className="form-row form-center">
                            <FormItem name="security_deposit_refund_check_number" label={"Enter the check number for the " + insightUtils.numberToCurrency(-1 * insightUtils.calculateChargesTotal(chargesAndLedgerItems), 2) + " refund:"} formItemClass="form-left form-item-50" />
                        </div>
                    }

                </>
            }

        </>

    )}

export default MoveOutChargesView;

