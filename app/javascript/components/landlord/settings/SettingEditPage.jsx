import React, {useEffect, useMemo, useState} from 'react';
import store from "../../../app/store";

import {useLocation, useNavigate, useParams} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import {useSelector} from "react-redux";
import SettingSubGroupListRow from "./SettingSubGroupListRow";
import insightUtils from "../../../app/insightUtils";
import {Form, Formik} from "formik";
import {loadCurrentCompany, loadSetting, saveSetting} from "../../../slices/companySlice";
import insightRoutes from "../../../app/insightRoutes";
import SettingsNav from "./SettingsNav";
import {saveCompanyPaymentMethod} from "../../../slices/paymentSlice";


const SettingEditPage = ({redirectIfMissing}) => {

    let params = useParams();
    let navigate = useNavigate()
    let location = useLocation()

    const { currentUser, currentActualUser } = useSelector((state) => state.user)
    const { currentCompany, settingsConfig } = useSelector((state) => state.company)
    const settingGroup = settingsConfig[params.settingGroupKey]
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    const [setting, setSetting] = useState("")

    const showAdminOnlyWarning = useMemo(() => {return settingGroup.admin_only && !insightUtils.isAdmin(currentActualUser)}, [settingGroup, currentActualUser])

    useEffect(async () => {

        if (currentUser.user_type != "admin" && params.mode == "system") {
            document.location.href = '/?invalid-access'
        }

        const results = await store.dispatch(loadSetting({mode: params.mode, propertyId: params.propertyId})).unwrap()
        let newSetting = Object.assign({}, results.data.setting)

        if (params.mode == "properties" && params.propertyId) {
            newSetting.property_id = params.propertyId

            // If redirectIfMissing, we can't stay here and create a new setting
            if (!newSetting.id && redirectIfMissing) {
                navigate(insightRoutes.settingEdit("company", null, params.settingGroupKey), {state: location.state})
            }
        }

        if (params.mode == "system" && newSetting.company_id) {
            document.location.href = '/?incorrect-settings-loaded'
        }

        newSetting.group_key = params.settingGroupKey

        // Add the shell of a payment method for proper validation
        newSetting.default_screening_payment_method = insightUtils.emptyPaymentMethod()

        setSetting(newSetting)
    }, [currentCompany, params.propertyId])

    function runSearch(_text, _page) {
        if (params.mode == "properties") {
            return {total: 0, objects: settingGroup.sub_groups.filter((s) => !s.company_only)}
        }
        else {
            return {total: 0, objects: settingGroup.sub_groups}
        }

    }

    async function handleFormikSubmit(values, { setSubmitting, setFieldValue, setErrors }) {
        setBaseErrorMessage("")

        try {

            // There is a corner case that requires us to call back to the server before saving the settings... if
            // a payment method is being added
            if (values.default_screening_payment_method_id && values.default_screening_payment_method_id.toString().indexOf("new_") == 0 && values.default_screening_payment_method) {
                values.default_screening_payment_method.method = values.default_screening_payment_method_id.replace("new_", "")
                values.default_screening_payment_method.billing_agreement = true
                const paymentMethodResults = await store.dispatch(saveCompanyPaymentMethod({companyPaymentMethod: values.default_screening_payment_method})).unwrap()
                const paymentMethodResponse = paymentMethodResults.data

                console.log(paymentMethodResponse)

                if (paymentMethodResponse.success) {
                    values.default_screening_payment_method_id = paymentMethodResponse.company_payment_method.id
                    values.default_screening_payment_method = null

                    setFieldValue('default_screening_payment_method_id', paymentMethodResponse.company_payment_method.id)

                    // Reload the current company so that the payment methods are loaded
                    await store.dispatch(loadCurrentCompany())

                } else if (paymentMethodResponse.errors) {
                    setErrors({default_screening_payment_method: paymentMethodResponse.errors})

                    if (paymentMethodResponse.errors.base) {
                        setBaseErrorMessage(paymentMethodResponse.errors.base)
                    }

                    insightUtils.scrollTo('errors')

                    return
                }
            }

            const result = await store.dispatch(saveSetting({setting: values})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                closeView()
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
            setBaseErrorMessage("Unable to save settings")
            setSubmitting(false);
        }
    }

    function generateTableRow(settingSubGroup, key) {
        return (<SettingSubGroupListRow key={key} settingGroup={settingGroup} settingSubGroup={settingSubGroup} />)
    }

    function closeView() {
        if (location.state && location.state.return_url) {
            navigate(location.state.return_url)
        }
        else {
            navigate(insightRoutes.settingList(params.mode, params.propertyId))
        }
    }

    return (
        <div className="section">



            {setting && (params.mode != "properties" || params.propertyId) && <Formik
                enableReinitialize
                initialValues={setting}
                onSubmit={handleFormikSubmit}
            >
                {({ isSubmitting, values }) => (
                    <>
                        <Form>
                            <ListPage
                                title={settingGroup.name}
                                titleImage={<>
                                    <img className="section-img" src="/images/photo-settings.jpg" />
                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}
                                </>}
                                hideSearch={true}
                                runSearch={runSearch}
                                generateTableRow={generateTableRow}
                                nav={<><SettingsNav/>
                                    {showAdminOnlyWarning &&
                                        <div className="text-error text-bold">NOTE: These settings can only be updated by Renter Insight Support</div>
                                    }
                                </>}
                                noDataMessage="No settings exist for this product"
                            />

                            {showAdminOnlyWarning &&
                                <div className="text-error text-bold" style={{marginTop: "20px", marginBottom: "-10px"}}>NOTE: These settings can only be updated by Renter Insight Support</div>
                            }

                            <div className="form-row">
                                <div className="st-col-100 form-nav">
                                    <a className="btn btn-gray" onClick={() => closeView()}>&lt; Back</a>

                                    {!showAdminOnlyWarning &&
                                        <>{currentUser.settings_edit && <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <span>Submitting...</span>}
                                            {!isSubmitting && <span>Save</span>}
                                        </button>}</>
                                    }
                                </div>
                            </div>
                        </Form>
                    </>
                )}
            </Formik>}
        </div>

    )}

export default SettingEditPage;
