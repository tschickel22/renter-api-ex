import React, {useState, useEffect} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'

import {deleteUser, loadUser, saveUser, searchForUserRoles} from "../../../slices/userSlice";
import store from "../../../app/store";

import {Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import BasicDropdown from "../../shared/BasicDropdown";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import {deleteResidentPet} from "../../../slices/residentPetSlice";
import {searchForPropertyOwners} from "../../../slices/propertySlice";

const UserEditPage = () => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const { currentUser } = useSelector((state) => state.user)
    const { properties } = useSelector((state) => state.company)

    const [user, setUser] = useState(null)
    const [selectedUserRole, setSelectedUserRole] = useState(null)
    const [propertyOwners, setPropertyOwners] = useState(null)
    const [userRoles, setUserRoles] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {
        // User Roles
        const userRoleResults = await store.dispatch(searchForUserRoles({})).unwrap()
        setUserRoles(insightUtils.sortByName(userRoleResults.data.user_roles))

        // Property Owners
        const propertyOwnerResults = await store.dispatch(searchForPropertyOwners({})).unwrap()
        setPropertyOwners(insightUtils.sortByName(propertyOwnerResults.data.property_owners))

        // Are we coming back from adding something? If so, use those values
        if (location.state && location.state.values && Object.keys(location.state.values).length && !location.state.return_url) {
            setSelectedUserRole(userRoleResults.data.user_roles.find((ur) => ur.id == location.state.values.user_role_id))
            setUser(location.state.values)
        }
        else if (parseInt(params.userId) > 0) {
            const results = await store.dispatch(loadUser({userId: params.userId})).unwrap()
            console.log("loadUser", results)
            let newUser = Object.assign({}, results.data.user)

            setSelectedUserRole(userRoleResults.data.user_roles.find((ur) => ur.id == newUser.user_role_id))
            setUser(newUser)
        }
        else {
            let newUser = insightUtils.emptyUser()

            // Are we coming from somewhere else that is asking for a specific user role?
            if (location.state && location.state.user_role_name) {
                let newSelectedUserRole = userRoleResults.data.user_roles.find((ur) => ur.name == location.state.user_role_name)
                if (newSelectedUserRole) {
                    newUser.user_role_id = newSelectedUserRole.id
                    setSelectedUserRole(newSelectedUserRole)
                }
            }
            setUser(newUser)
        }

    }, [])

    async function handleFormikSumbit(values, { setSubmitting, setErrors }) {

        setBaseErrorMessage("")

        const results = await store.dispatch(saveUser({user: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView(response.user.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage([response.errors.base].flat().join(", "))
            }

            insightUtils.scrollTo('errors')
        }
    }

    function handleUserRoleSelected(e, values) {
        const userRoleId = e.target.value

        if (userRoleId == -1) {
            navigate(insightRoutes.userRoleNew(), {state: {return_url: location.pathname, field_to_update: "user_role_id", values: values}})
        }
        else {
            setSelectedUserRole(userRoles.find((ur) => ur.id == userRoleId))
        }
    }

    async function confirmDeletion() {
        if (confirm('Are you sure you want to delete this user?')) {
            await store.dispatch(deleteUser({user: user})).unwrap()
            closeView()
        }
    }

    function closeView(newUserId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a user, send it back to the calling form
            if (newUserId && location.state.field_to_update) {
                insightUtils.setValuesWithDotNotation(newValues, location.state.field_to_update, newUserId)
            }

            navigate(location.state.return_url, {state: {values: newValues}})
        }
        else {
            navigate(insightRoutes.userList())
        }
    }


    return (
        <>
            <div className="section">
                {properties && user && <>
                    <h2>{user.id ? "Edit " + user.name : "Add User"}</h2>
                    <p>Use this form to {user.id ? "edit" : "create"} a user.</p>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={user}
                        onSubmit={handleFormikSumbit}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="add-property-wrap">
                                    <div className="form-row">
                                        <FormItem label="First Name" name="first_name" />
                                        <FormItem label="Last Name" name="last_name" />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Email" name="email" type="email" />
                                        <FormItem label="Phone" name="cell_phone" optional={true} mask={insightUtils.phoneNumberMask()} />
                                    </div>

                                    <div className="form-row">
                                        {(currentUser.id == user.id || (user.id && selectedUserRole && selectedUserRole.name == "Property Owner")) ?
                                            <div className="form-item">
                                                <label>Role</label>
                                                <div className="form-value">{user.user_role_name}</div>
                                            </div>
                                            :
                                            <FormItem label="Role" name="user_role_id">
                                                <BasicDropdown name="user_role_id" blankText="-- Select Role --" options={userRoles.concat([{id: -1, name: "Add New Role..."}])} onChange={(e) => handleUserRoleSelected(e, values)}/>
                                            </FormItem>
                                        }
                                        <div className="form-item" />
                                    </div>

                                    {properties && selectedUserRole && selectedUserRole.user_type == "company_user" && <>
                                        <hr/>
                                        {selectedUserRole.name == "Property Owner" ?
                                            <>
                                                <h2>Property Owners</h2>
                                                <p>Select the property owners that this user will have access to.</p>
                                                <CheckBoxGroup name="property_owner_ids" options={propertyOwners} direction="row" />
                                            </>
                                            :
                                            <>
                                                <h2>Select Properties</h2>
                                                <p>Select the properties that this user will have access to.</p>
                                                <CheckBoxGroup name="property_ids" options={properties} direction="row" />
                                            </>
                                        }

                                    </>}

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        {user.id && currentUser.id != user.id && currentUser.users_delete && <a onClick={confirmDeletion} className="btn btn-gray"><span>Delete</span></a>}
                                        {currentUser.users_edit &&
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                            </button>
                                        }
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>}
            </div>
        </>
    )}

export default UserEditPage;

