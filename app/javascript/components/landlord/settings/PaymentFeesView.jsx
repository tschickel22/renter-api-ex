import React from 'react';
import {useSelector} from "react-redux";
import {useFormikContext} from "formik";
import insightUtils from "../../../app/insightUtils";


const PaymentFeesView = ({}) => {

    const formikProps = useFormikContext()

    return (
        <>
                <div className="section-table">
                        <div className="st-table-scroll">

                                <div className="st-row-wrap">
                                        <div className="st-row st-header">
                                                <span className="st-col-20">&nbsp;</span>
                                                <span className="st-col-20 text-center"><strong>Bank Account (ACH)</strong></span>
                                                <span className="st-col-20 text-center"><strong>Credit Card</strong></span>
                                                <span className="st-col-20 text-center"><strong>Debit Card</strong></span>
                                                <span className="st-col-20 text-center"><strong>Cash Pay</strong></span>
                                        </div>
                                </div>

                                <div className="st-row-wrap">
                                        <div className="st-row">
                                                <span className="st-col-25">Landlord Pays</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberToCurrency(formikProps.values.payment_fee_ach_property, 2)}</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberWithCommas(formikProps.values.payment_fee_credit_card_property, 2)}% + {insightUtils.numberToCurrency(formikProps.values.payment_fee_ach_resident, 2)}</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberToCurrency(formikProps.values.payment_fee_debit_card_property, 2)}</span>
                                                <span className="st-col-20 text-center">N/A</span>
                                        </div>
                                </div>

                                <div className="st-row-wrap">
                                        <div className="st-row">
                                                <span className="st-col-25">Resident Pays</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberToCurrency(formikProps.values.payment_fee_ach_resident, 2)}</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberWithCommas(formikProps.values.payment_fee_credit_card_resident,2)}% + {insightUtils.numberToCurrency(formikProps.values.payment_fee_ach_resident, 2)}</span>
                                                <span className="st-col-25 text-center">{insightUtils.numberToCurrency(formikProps.values.payment_fee_debit_card_resident, 2)}</span>
                                                <span className="st-col-20 text-center">{insightUtils.numberToCurrency(formikProps.values.payment_fee_cash_resident, 2)}</span>
                                        </div>
                                </div>
                        </div>
                </div>

        </>

    )}

export default PaymentFeesView;

