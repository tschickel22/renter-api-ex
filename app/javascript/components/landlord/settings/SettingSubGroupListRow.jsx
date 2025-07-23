import React, {useMemo} from 'react';
import FormItem from "../../shared/FormItem";
import PaymentFeesView from "./PaymentFeesView";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {useFormikContext} from "formik";
import insightUtils from "../../../app/insightUtils";
import FeeResponsibilityView from "./FeeResponsibilityView";
import ScreeningPackageSelection from "./ScreeningPackageSelection";
import ScreeningPaymentMethodForm from "./ScreeningPaymentMethodForm";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import ToolTip from "../../shared/ToolTip";
import store from "../../../app/store";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import insightRoutes from "../../../app/insightRoutes";
import AvailablePaymentMethodsView from "./AvailablePaymentMethodsView";


const SettingSubGroupListRow = ({settingGroup, settingSubGroup}) => {

    const formikProps = useFormikContext()

    const { items, currentCompany } = useSelector((state) => state.company)
    const { currentActualUser } = useSelector((state) => state.user)

    let showGroup = true

    if (settingSubGroup.show_if_key) {
        if (settingSubGroup.show_if_value) {
            if (Array.isArray(settingSubGroup.show_if_value)) {
                showGroup = settingSubGroup.show_if_value.indexOf(formikProps.values[settingSubGroup.show_if_key]) >= 0
            }
            else {
                showGroup = formikProps.values[settingSubGroup.show_if_key] == settingSubGroup.show_if_value
            }

        }
        else {
            showGroup = formikProps.values[settingSubGroup.show_if_key]
        }
    }

    function handleSelectOneChange(updatedSettingKey, newValue) {
        if (updatedSettingKey == "application_require_screening" && newValue) {
            if (currentCompany.external_screening_id) {
                settingGroup.sub_groups.forEach((ssg) => {
                    Object.keys(ssg.settings).forEach((settingKey, i) => {
                        const settingConfig = ssg.settings[settingKey]
                        if (settingConfig.data_type == 'optional_required_hide_if_no_screening') {
                            formikProps.setFieldValue(settingKey, "required")
                        }
                    })
                })
            }
            else {
                store.dispatch(displayAlertMessage({message: "You need to activate screening before requiring it on applications.", url: insightRoutes.onboardingScreening(), linkText: "Activate Screening"}))
                formikProps.setFieldValue(updatedSettingKey, false)
            }
        }
    }

    const showAdminOnlyWarning = useMemo(() => {return settingSubGroup.admin_only && !insightUtils.isAdmin(currentActualUser)}, [settingSubGroup, currentActualUser])

    return (
        <>
            {showGroup && <div>
                {showAdminOnlyWarning &&
                    <div style={{float: "right"}}>NOTE: These settings can only be updated by Renter Insight Support</div>
                }
                <h2>
                    {settingSubGroup.label}
                </h2>
                <hr />

                {settingSubGroup.description && <p>{settingSubGroup.description}</p>}

                {Object.keys(settingSubGroup.settings).map((settingKey, i) => {
                    const settingConfig = settingSubGroup.settings[settingKey]
                    let element = null
                    let showElement = true

                    if (settingConfig.show_if_key) {
                        if (settingConfig.show_if_value) {
                            if (Array.isArray(settingConfig.show_if_value)) {
                                showElement = settingConfig.show_if_value.indexOf(formikProps.values[settingConfig.show_if_key]) >= 0
                            }
                            else {
                                showElement = formikProps.values[settingConfig.show_if_key] == settingConfig.show_if_value
                            }

                        }
                        else {
                            showElement = formikProps.values[settingConfig.show_if_key]
                        }
                    }

                    // Are we supposed to show this?
                    if (showElement) {

                        let label = settingConfig.label

                        if (settingConfig.push_down_to_properties && !formikProps.values.property_id) {
                            label = <>{settingConfig.label} <ToolTip explanation="Any change to this setting will be copied down to all Property-level settings" icon={<i className="far fa-triangle-exclamation"></i>} /></>
                        }

                        if (settingConfig.tooltip) {
                            label = <>{settingConfig.label} <ToolTip explanation={settingConfig.tooltip} /></>
                        }

                        if (settingConfig.data_type == 'payment_fees') {
                            element = (<PaymentFeesView  />)
                        }
                        else if (settingConfig.data_type == 'available_payment_methods') {
                            element = (<AvailablePaymentMethodsView settingKey={settingKey} label={label} showAdminOnlyWarning={showAdminOnlyWarning} />)
                        }
                        else if (settingConfig.data_type == 'ach_credit_card_responsibility') {
                            element = (<FeeResponsibilityView settingKey={settingKey} settingConfig={settingConfig} showAdminOnlyWarning={showAdminOnlyWarning} />)
                        }
                        else if (settingConfig.data_type == 'screening_packages') {
                            element = (<ScreeningPackageSelection />)
                        }
                        else if (settingConfig.data_type == 'screening_payment_method') {
                            element = (<ScreeningPaymentMethodForm settingKey={settingKey} />)
                        }
                        else if (settingConfig.data_type == 'yes_no') {
                            element = (<FormItem label={label} name={settingKey} optional={true}>
                                <RadioButtonGroup name={settingKey} options={insightUtils.yesNoOptions()} direction="row" />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'optional_required_hide') {
                            element = (<FormItem label={label} name={settingKey} optional={true}>
                                <RadioButtonGroup name={settingKey} options={[{id: 'optional', name: "Optional"}, {id: 'required', name: "Required"}, {id: 'hide', name: "Hide"}]} direction="row" />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'optional_required_hide_if_no_screening') {
                            if (formikProps.values.application_require_screening) {
                                element = (<FormItem label={label} name={settingKey} optional={true}>
                                    <RadioButtonGroup name={settingKey} options={[{id: 'required', name: "Required"}]} direction="row" />
                                </FormItem>)
                            }
                            else {
                                element = (<FormItem label={label} name={settingKey} optional={true}>
                                    <RadioButtonGroup name={settingKey} options={[{id: 'optional', name: "Optional"}, {id: 'required', name: "Required"}, {id: 'hide', name: "Hide"}]} direction="row" />
                                </FormItem>)
                            }
                        }
                        else if (settingConfig.data_type == 'dropdown') {
                            element = (<FormItem label={label} name={settingKey} optional={true} formItemClass="st-col-50">
                                <BasicDropdown name={settingKey} options={settingConfig.options} />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'select_one') {
                            element = (<FormItem label={label} name={settingKey} optional={true}>
                                <RadioButtonGroup name={settingKey} options={settingConfig.options} direction="row" handleOptionChange={(newValue) => (handleSelectOneChange(settingKey, newValue))} />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'select_many') {
                            element = (<FormItem label={label} name={settingKey} optional={true}>
                                <CheckBoxGroup name={settingKey} options={settingConfig.options} direction="row" />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'select_many_items') {
                            element = (<FormItem label={label} name={settingKey} optional={true}>
                                <CheckBoxGroup name={settingKey} options={items.filter((item) => (item.type == settingConfig.model)) } direction="row" />
                            </FormItem>)
                        }
                        else if (settingConfig.data_type == 'currency') {
                            element = (<FormItem label={label} name={settingKey} mask={insightUtils.currencyMask()} optional={true} formItemClass="st-col-50" />)
                        }
                        else if (settingConfig.data_type == 'cents') {
                            element = (<FormItem label={label} name={settingKey} mask={insightUtils.centsMask()} optional={true} formItemClass="st-col-50" />)
                        }
                        else if (settingConfig.data_type == 'textarea') {
                            element = (<FormItem label={label} name={settingKey} type="textarea" optional={true} formItemClass="st-col-50" />)
                        }
                        else {
                            element = (<FormItem label={label} name={settingKey} optional={true} formItemClass="st-col-50" />)
                        }

                        return <React.Fragment key={i}>
                                {element}
                                <br/>
                                {settingConfig.help && <>
                                    <div className="help-block" dangerouslySetInnerHTML={{__html: settingConfig.help}}></div>
                                    <br />
                                </> }
                            </React.Fragment>
                    }
                    else {
                        return <React.Fragment key={i}></React.Fragment>
                    }
                })}
            </div>}

        </>

    )}

export default SettingSubGroupListRow;

