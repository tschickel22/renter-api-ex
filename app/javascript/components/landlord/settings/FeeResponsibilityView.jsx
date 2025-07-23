import React from 'react';
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {useFormikContext} from "formik";


const FeeResponsibilityView = ({settingKey, settingConfig, showAdminOnlyWarning}) => {
    const formikProps = useFormikContext()

    return (
        <>
            <div className="section-table">
                <div className="st-table-scroll">

                    <div className="st-row-wrap">
                        <div className="st-row st-header">
                            <span className="st-col-100 text-center"><strong>{settingConfig.label}</strong></span>
                        </div>
                    </div>

                    <div className="st-row-wrap">
                        <div className="st-row">
                            <span className="st-col-33 text-center">
                                {formikProps.values.available_payment_methods_default_ach &&
                                    <FormItem label="ACH" name={settingKey + "_ach"}>
                                        <RadioButtonGroup name={settingKey + "_ach"} options={[{id: false, name: "Landlord"}, {id: true, name: "Resident"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>
                            <span className="st-col-33 text-center">
                                {formikProps.values.available_payment_methods_default_credit_card &&
                                    <FormItem label="Credit Card" name={settingKey + "_credit_card"}>
                                        <RadioButtonGroup name={settingKey + "_credit_card"} options={[{id: false, name: "Landlord"}, {id: true, name: "Resident"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>
                            <span className="st-col-33 text-center">
                                {formikProps.values.available_payment_methods_default_debit_card &&
                                    <FormItem label="Debit Card" name={settingKey + "_debit_card"}>
                                        <RadioButtonGroup name={settingKey + "_debit_card"} options={[{id: false, name: "Landlord"}, {id: true, name: "Resident"}]} direction="row" disabled={showAdminOnlyWarning} />
                                    </FormItem>
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </>

    )}

export default FeeResponsibilityView;

