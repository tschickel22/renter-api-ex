import React from 'react';
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {useFormikContext} from "formik";


const AvailablePaymentMethodsView = ({settingKey, label, showAdminOnlyWarning}) => {
    const formikProps = useFormikContext()

    return (
        <>
            <div className="section-table">
                <div className="st-table-scroll">

                    <div className="st-row-wrap">
                        <div className="st-row st-header">
                            <span className="st-col-100 text-center"><strong>{label}</strong></span>
                        </div>
                    </div>

                    <div className="st-row-wrap">
                        <div className="st-row">

                            <span className="st-col-25 text-center">
                                {(settingKey != "available_payment_methods_co" || formikProps.values.available_payment_methods_default_ach) &&
                                    <FormItem label="ACH" name={settingKey + "_ach"}>
                                        <RadioButtonGroup name={settingKey + "_ach"} options={[{id: true, name: "Yes"}, {id: false, name: "No"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>


                            <span className="st-col-25 text-center">
                                {(settingKey != "available_payment_methods_co" || formikProps.values.available_payment_methods_default_credit_card) &&
                                    <FormItem label="Credit Card" name={settingKey + "_credit_card"}>
                                        <RadioButtonGroup name={settingKey + "_credit_card"} options={[{id: true, name: "Yes"}, {id: false, name: "No"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>


                            <span className="st-col-25 text-center">
                                {(settingKey != "available_payment_methods_co" || formikProps.values.available_payment_methods_default_debit_card) &&
                                    <FormItem label="Debit Card" name={settingKey + "_debit_card"}>
                                        <RadioButtonGroup name={settingKey + "_debit_card"} options={[{id: true, name: "Yes"}, {id: false, name: "No"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>


                            <span className="st-col-25 text-center">
                                {(settingKey != "available_payment_methods_co" || formikProps.values.available_payment_methods_default_cash) &&
                                    <FormItem label="Cash Pay" name={settingKey + "_cash"}>
                                        <RadioButtonGroup name={settingKey + "_cash"} options={[{id: true, name: "Yes"}, {id: false, name: "No"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </>

    )}

export default AvailablePaymentMethodsView;

