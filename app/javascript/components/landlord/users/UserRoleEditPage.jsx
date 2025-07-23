import React, {useState, useEffect} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import {loadUser, loadUserRole, saveUser, saveUserRole, searchForUserRoles} from "../../../slices/userSlice";
import store from "../../../app/store";

import {Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {useSelector} from "react-redux";


const UserRoleEditPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { constants } = useSelector((state) => state.company)

    const [userRole, setUserRole] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {
        if (parseInt(params.userRoleId) > 0) {
            const results = await store.dispatch(loadUserRole({userRoleId: params.userRoleId})).unwrap()
            console.log("ROLE", results)
            let newUserRole = Object.assign({}, results.data.user_role)
            setUserRole(newUserRole)
        }
        else {
            setUserRole(insightUtils.emptyUserRole())
        }

    }, [])

    async function handleFormikSumbit(values, { setSubmitting, setErrors }) {

        setBaseErrorMessage("")

        if (values.name && values.name == "Company Admin") {
            setBaseErrorMessage("There can only be one Company Admin role")
            insightUtils.scrollTo('errors')
        }
        else {

            const results = await store.dispatch(saveUserRole({userRole: values})).unwrap()
            const response = results.data

            console.log(response)
            setSubmitting(false);

            if (response.success) {
                closeView(response.user_role.id)
            }
            else if (response.errors) {
                setErrors(response.errors)

                if (response.errors.base) {
                    setBaseErrorMessage([response.errors.base].flat().join(", "))
                }

                insightUtils.scrollTo('errors')
            }
        }
    }

    function closeView(newUserRoleId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a user, send it back to the calling form
            if (newUserRoleId && location.state.field_to_update) newValues[location.state.field_to_update] = newUserRoleId

            navigate(location.state.return_url, {state: {values: newValues}})
        }
        else {
            navigate(insightRoutes.userRoleList())
        }
    }

    return (
        <>
            <div className="section">
                {userRole && <>
                    <h2>{userRole.id ? "Edit " + userRole.name : "Add User Role"}</h2>
                    <p>Use this form to {userRole.id ? "edit" : "create"} a user role.</p>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={userRole}
                        onSubmit={handleFormikSumbit}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <div className="form-row">
                                        <FormItem label="Name" name="name" />
                                    </div>

                                    <div className="form-row">
                                        {userRole.id ?
                                            <div className="form-item">
                                                <label>Access Level</label>
                                                <div className="form-value">
                                                    {userRole.user_type == "company_admin" ? "Has access to all properties" : "Only has access to specific properties"}
                                                </div>
                                            </div>
                                            :
                                            <FormItem label="Access Level" name="user_type">
                                                <RadioButtonGroup name="user_type" options={[{id: "company_admin", name: "Has access to all properties"}, {id: "company_user", name: "Only has access to specific properties"}]} direction="row"/>
                                            </FormItem>
                                        }
                                    </div>

                                    <p>Configure the feature-level access for this user role:</p>

                                    <div className="form-row">
                                        <div className="form-item">
                                            <FormItem label="Communications" name="communications">
                                                <RadioButtonGroup name="communications" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {values.communications != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_communications_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_communications_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>

                                        <div className="form-item">
                                            <FormItem label="Listings" name="listings">
                                                <RadioButtonGroup name="listings" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {false && values.listings != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_listings_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_listings_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-item">
                                            <FormItem label="Screening" name="screening">
                                                <RadioButtonGroup name="screening" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {values.screening != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_screening_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_screening_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>
                                        <div className="form-item">
                                            <FormItem label="Payments" name="payments">
                                                <RadioButtonGroup name="payments" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {values.payments != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_payments_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_payments_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-item">
                                            <FormItem label="Maintenance Requests" name="maintenance_requests">
                                                <RadioButtonGroup name="maintenance_requests" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {values.maintenance_requests != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_maintenance_requests_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_maintenance_requests_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>
                                        <div className="form-item">
                                            <FormItem label="Leasing" name="leasing">
                                                <RadioButtonGroup name="leasing" options={constants.user_role_access_level_options} direction="row"/>
                                            </FormItem>
                                            {values.leasing != constants.user_role_access_level_options.none.key &&
                                                <FormItem label="" name="get_leasing_email" optional={true}>
                                                    <div className="flex-row roles-follow-up">
                                                        <label className="roles-follow-up-question">Receive related email notifications?</label>
                                                        <RadioButtonGroup name="get_leasing_email" options={insightUtils.yesNoOptions()} direction="row"/>
                                                    </div>
                                                </FormItem>
                                            }
                                        </div>

                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Residents" name="residents">
                                            <RadioButtonGroup name="residents" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                        <FormItem label="Vendors" name="vendors">
                                            <RadioButtonGroup name="vendors" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Reports" name="reports">
                                            <RadioButtonGroup name="reports" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>

                                        <FormItem label="Properties" name="properties">
                                            <RadioButtonGroup name="properties" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Settings" name="settings">
                                            <RadioButtonGroup name="settings" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>

                                        <FormItem label="Property Owners" name="property_owners">
                                            <RadioButtonGroup name="property_owners" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Billing & Expenses" name="expenses">
                                            <RadioButtonGroup name="expenses" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>

                                        <FormItem label="Accounting" name="accounting">
                                            <RadioButtonGroup name="accounting" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Documents" name="lease_docs">
                                            <RadioButtonGroup name="lease_docs" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>

                                        <FormItem label="Users" name="users">
                                            <RadioButtonGroup name="users" options={constants.user_role_access_level_options} direction="row"/>
                                        </FormItem>
                                    </div>

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>
    )}

export default UserRoleEditPage;

