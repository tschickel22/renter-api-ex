import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'

import {deletePropertyOwner, loadPropertyOwner, savePropertyOwner, searchForPropertyOwners} from "../../../slices/propertySlice";
import store from "../../../app/store";

import {Form, Formik} from "formik";
import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import BasicDropdown from "../../shared/BasicDropdown";
import StateDropdown from "../../shared/StateDropdown";
import Modal from "../../shared/Modal";
import {deleteVendor} from "../../../slices/vendorSlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const PropertyOwnerEditPage = ({}) => {

    let navigate = useNavigate()
    let location = useLocation()
    let params = useParams()

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    const { currentUser } = useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)

    const [propertyOwner, setPropertyOwner] = useState(null)
    const [deletingPropertyOwner, setDeletingPropertyOwner] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)
    const [editingTaxId, setEditingTaxId] = useState(false)

    useEffect(async() => {
        let newPropertyOwner = null;
        if (parseInt(params.propertyOwnerId) > 0) {
            const results = await store.dispatch(loadPropertyOwner({propertyOwnerId: params.propertyOwnerId})).unwrap()
            newPropertyOwner = Object.assign({}, results.data.property_owner)
        }

        if (!newPropertyOwner) {
            newPropertyOwner = insightUtils.emptyPropertyOwner()
        }

        setPropertyOwner(newPropertyOwner)
    }, [])

    async function handleFormikSubmit(values, {setSubmitting, setErrors}) {
        setBaseErrorMessage("")

        const results = await store.dispatch(savePropertyOwner({propertyOwner: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            store.dispatch(searchForPropertyOwners({}))
            closeView(response.property_owner.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base.join(", "))
            }

            insightUtils.scrollTo('errors')
        }

    }


    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deletePropertyOwner({propertyOwnerId: deletingPropertyOwner.id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Owner Deleted"}))

            navigate(insightRoutes.propertyOwnerList())
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }
    }

    function cancelDelete() {
        setDeletingPropertyOwner(null)
        setDeletingSubmitted(false)
    }

    function closeView(newPropertyOwnerId) {
        insightUtils.handleBackNavigation(insightRoutes.propertyOwnerList(), location, navigate, newPropertyOwnerId)
    }

    return (
        <>
            {propertyOwner && <div className="section">

                <h2>{propertyOwner.id ? "Edit " + propertyOwner.name : "Add Property Owner"}</h2>
                <p className="text-center">Use this form to {propertyOwner.id ? "edit" : "create"} a property owner.</p>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={propertyOwner}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div>
                                <div className="form-row">
                                    <FormItem label="Owner Type" name="owner_type">
                                        <RadioButtonGroup name="owner_type" options={constants.property_owner_type_options} direction="row"/>
                                    </FormItem>
                                </div>
                                <div className="form-row">
                                    <FormItem label="Company Name (Legal Name)" name="name"/>
                                    <FormItem label="DBA (if different)" name="legal_business_dba" optional={true}/>
                                    <FormItem label="Company Type" name="tax_classification" optional={!values.generate_1099}>
                                        <BasicDropdown name="tax_classification" options={constants.tax_classification_options}/>
                                    </FormItem>
                                </div>

                                <div className="form-row">
                                    <FormItem label="Email" name="email" type="email" optional={true}/>
                                    <FormItem label="Phone" name="phone_number" optional={true} mask={insightUtils.phoneNumberMask()}/>
                                </div>

                                <h3 className="text-left">Shipping Address</h3>
                                <div className="form-row">
                                    <FormItem label="Address" name="street" optional={true}/>
                                    <FormItem label="Address Line 2" name="street_2" optional={true}/>
                                    <FormItem label="City" name="city" optional={true}/>
                                    <FormItem label="State" name={`state`} optional={true}>
                                        <StateDropdown name={`state`}/>
                                    </FormItem>
                                    <FormItem label="Zip" name="zip" mask={insightUtils.zipMask()} optional={true}/>
                                </div>

                                <div className="form-row">
                                    <FormItem formItemClass="form-item-100" label="Bill to Address: Use same as shipping address" name="billing_same_as_shipping" type="checkbox"/>
                                </div>

                                {!values.billing_same_as_shipping && <>
                                    <h3 className="text-left">Billing Address</h3>
                                    <div className="form-row">
                                        <FormItem label="Address" name="billing_street" optional={true}/>
                                        <FormItem label="Address Line 2" name="billing_street_2" optional={true}/>
                                        <FormItem label="City" name="billing_city" optional={true}/>
                                        <FormItem label="State" name={`billing_state`} optional={true}>
                                            <StateDropdown name={`billing_state`}/>
                                        </FormItem>
                                        <FormItem label="Zip" name="billing_zip" mask={insightUtils.zipMask()} optional={true}/>
                                    </div>
                                </>
                                }

                                {currentCompany && [constants.tax_reporting_onboard_statuses.pending.key, constants.tax_reporting_onboard_statuses.completed.key].includes(currentCompany.tax_reporting_onboard_status) && <>
                                    <h3 className="text-left">1099</h3>
                                    <div className="form-row">
                                        <FormItem formItemClass="form-item-100" label="Generate 1099 (if payments over IRS standard)?" name="generate_1099" type="checkbox"/>
                                    </div>
                                    <div className="form-row">
                                        <FormItem label="" formItemClass="form-item-15" name={`tax_id_type`} optional={!values.generate_1099}>
                                            <RadioButtonGroup name={`tax_id_type`} direction="row" options={[{id: "ein", name: "EIN"}, {id: "ssn", name: "SSN"}]}/>
                                        </FormItem>
                                        {propertyOwner.tax_id && !editingTaxId &&
                                            <FormItem label="" formItemClass="form-item-25" name="tax_id">
                                                <div className="form-value">{propertyOwner.tax_id_masked}&nbsp;&nbsp;&nbsp;<a onClick={() => setEditingTaxId(true)}>Edit</a></div>
                                            </FormItem>
                                        }
                                        {(!propertyOwner.tax_id || editingTaxId) &&
                                            <FormItem label="" formItemClass="form-item-25" name="tax_id" optional={!values.generate_1099} mask={values.tax_id_type == "ssn" ? insightUtils.ssnMask() : insightUtils.einMask()} placeholder="Enter Tax ID"/>
                                        }
                                    </div>
                                </>}
                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    {propertyOwner.id && currentUser.properties_delete && <a onClick={()=>setDeletingPropertyOwner(propertyOwner)} className="btn btn-gray"><span>Delete</span></a>}
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>
                                </div>

                                {deletingPropertyOwner && <Modal closeModal={() => cancelDelete()}>
                                    <h2>Delete Property Owner?</h2>
                                    {propertyOwner.property_count > 0 ?
                                        <>
                                            <p className="text-center">This owner still has {propertyOwner.property_count} assigned {propertyOwner.property_count == 1 ? "property" : "properties"}. Please <Link to={insightRoutes.propertyList()}>update the assignments</Link> and try again.</p>

                                            <div className="form-nav">
                                                <div onClick={() => cancelDelete()} className="btn btn-gray"><span>OK</span></div>
                                            </div>
                                        </>
                                        :
                                        <>
                                            <p className="text-center">Are you sure you want to delete this owner?</p>

                                            <div className="form-nav">
                                                <div onClick={() => cancelDelete()} className="btn btn-gray"><span>Cancel</span></div>
                                                <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                                        </div>
                                    </>}
                                </Modal>}
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>}
        </>
    )
}

export default PropertyOwnerEditPage;

