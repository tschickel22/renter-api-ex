import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import {saveItem, updateItems} from "../../../slices/companySlice";
import {deleteVendor, loadVendor, saveVendor, saveVendorCategory} from "../../../slices/vendorSlice";
import store from "../../../app/store";

import {FieldArray, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import StateDropdown from "../../shared/StateDropdown";
import CommentsView from "../communications/CommentsView";
import insightRoutes from "../../../app/insightRoutes";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import DatePicker from "react-datepicker";
import VendorInsuranceDeclarationsView from "./VendorInsuranceDeclarationsView";
import VendorLicenseLicencesView from "./VendorLicenseLicencesView";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import Modal from "../../shared/Modal";

const VendorEditPage = () => {

    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    const { currentCompany, constants, items } = useSelector((state) => state.company)
    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentUser } = useSelector((state) => state.user)

    const [vendor, setVendor] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [editingTaxId, setEditingTaxId] = useState(false)
    const [deletingVendor, setDeletingVendor] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)
    const declarationsBatchNumber = +new Date()
    const licensesBatchNumber = +new Date()

    useEffect(async() => {
        if (parseInt(params.vendorId) > 0) {
            const results = await store.dispatch(loadVendor({vendorId: params.vendorId})).unwrap()
            let newVendor = {... results.data.vendor}
            newVendor.vendor_category_name = ""

            let newVendorInsurances = [...newVendor.vendor_insurances].map((newInsurance) => {
                newInsurance.effective_on = insightUtils.parseDate(newInsurance.effective_on)
                newInsurance.expires_on = insightUtils.parseDate(newInsurance.expires_on)

                return newInsurance
            })

            let newVendorLicenses = [...newVendor.vendor_licenses].map((newLicense) => {
                newLicense.effective_on = insightUtils.parseDate(newLicense.effective_on)
                newLicense.expires_on = insightUtils.parseDate(newLicense.expires_on)

                return newLicense
            })

            newVendor.vendor_insurances = newVendorInsurances
            newVendor.vendor_licenses = newVendorLicenses

            setVendor(newVendor)
        }
        else {
            setVendor(insightUtils.emptyVendor())
        }
    }, [])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")



        if (values.vendor_category_id == -1) {
            if (values.vendor_category_name) {

                // Push the new vendor category
                const results = await store.dispatch(saveVendorCategory({vendorCategory: {name: values.vendor_category_name}})).unwrap()
                let newVendorCategories = Array.from(items.filter((item) => (item.type == 'VendorCategory')))
                newVendorCategories.push(results.data.vendor_category)
                store.dispatch(updateItems(newVendorCategories))

                delete values.vendor_category_name
                values.vendor_category_id = results.data.vendor_category.id
            }
            else {
                setErrors({vendor_category_name: "cannot be blank"})
                setSubmitting(false)
                return
            }
        }

        if (values.id) {
            // Mark any insurances set to remove
            let insurancesToDestroy = []
            let licensesToDestroy = []
            let allGood = true

            allGood = await (async () => {
                for (const [index, vi] of vendor.vendor_insurances.entries()) {
                    if (values.vendor_insurances.find((evi) => evi.id == vi.id)) {
                        // Check for new Insurance type
                        allGood = allGood && (await checkForFreeFormEntry(values, `vendor_insurances.${index}.insurance_type_id`, `vendor_insurances.${index}.insurance_type_name`, 'VendorInsuranceType', setErrors, setSubmitting));

                    } else {
                        insurancesToDestroy.push(vi)
                    }
                }
                return allGood
            })();

            allGood = await (async () => {
                for (const [index, vl] of vendor.vendor_licenses.entries()) {
                    if (values.vendor_licenses.find((evi) => evi.id == vl.id)) {
                        // Check for new license type
                        allGood = allGood && (await checkForFreeFormEntry(values, `vendor_licenses.${index}.license_type_id`, `vendor_licenses.${index}.license_type_name`, 'VendorLicenseType', setErrors, setSubmitting));

                    } else {
                        licensesToDestroy.push(vl)
                    }
                }
                return allGood
            })();

            if (!allGood) {
                alert('If you have added a new option, please enter the name')
                return;
            }
            else {
                if (insurancesToDestroy.length > 0) {
                    insurancesToDestroy.forEach((vis) => {
                        values.vendor_insurances.push({"id": vis.id, "_destroy": true})
                    })
                }

                if (licensesToDestroy.length > 0) {
                    licensesToDestroy.forEach((vis) => {
                        values.vendor_licenses.push({"id": vis.id, "_destroy": true})
                    })
                }
            }
        }

        // Update batch numbers
        if (values.vendor_insurances) {
            values.vendor_insurances.forEach((vi, index) => {
                vi.declarations_batch_number = declarationsBatchNumber + index
            })
        }

        if (values.vendor_licenses) {
            values.vendor_licenses.forEach((vl, index) => {
                vl.licenses_batch_number = licensesBatchNumber + index
            })
        }

        const results = await store.dispatch(saveVendor({vendor: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            closeView(response.vendor.id)
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base.join(", "))
            }

            insightUtils.scrollTo('errors')
        }
    }

    async function checkForFreeFormEntry(values, id_field_name, name_field_name, type, setErrors, setSubmitting) {
        if (insightUtils.getValue(values, id_field_name) == -1) {
            if (insightUtils.getValue(values, name_field_name)) {

                // Push the new vendor category
                const results = await store.dispatch(saveItem({itemName: insightUtils.getValue(values, name_field_name), itemType: type})).unwrap()
                let existingItems = [...items]
                existingItems.push(results.data.item)
                store.dispatch(updateItems(existingItems))

                insightUtils.setValuesWithDotNotation(values, id_field_name, results.data.item.id)

                return true
            }
            else {
                let errors = {}
                errors[name_field_name] = 'cannot be blank'
                setErrors(errors)
                setSubmitting(false)
                return false
            }
        } else {
            return true
        }
    }

    function addVendorInsurance(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyVendorInsurance())
    }

    function removeVendorInsurance(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    function addVendorLicense(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyVendorLicense())
    }

    function removeVendorLicense(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deleteVendor({vendorId: deletingVendor.id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Vendor Deleted"}))

            navigate(insightRoutes.vendorList())
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }
    }

    function cancelDelete() {
        setDeletingVendor(null)
        setDeletingSubmitted(false)
    }

    function closeView(newVendorId) {
        insightUtils.handleBackNavigation(insightRoutes.vendorList(), location, navigate, newVendorId)
    }

    return (
        <>
            <div className="section">
            {vendor && <>
                <h2>{vendor.id ? "Edit " + vendor.name : "Add Vendor"}</h2>
                <p>Use this form to {vendor.id ? "edit" : "create"} a vendor.</p>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={vendor}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div>
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

                                <div className="form-row">
                                    <FormItem label="Category" name="vendor_category_id" optional={true}>
                                        <BasicDropdown name="vendor_category_id" blankText="-- Select Category --" options={items.filter((item) => (item.type == 'VendorCategory')).concat([{id: -1, name: "Add New Category..."}])}/>
                                    </FormItem>
                                    {values.vendor_category_id == -1 && <FormItem label="Enter New Category" name="vendor_category_name"/>}
                                    <FormItem label="Status" name="status" optional={true}>
                                        <BasicDropdown name="status" blankText="-- Select Status --" options={constants.vendor_statuses}/>
                                    </FormItem>
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
                                        {vendor.tax_id && !editingTaxId &&
                                            <FormItem label="" formItemClass="form-item-25" name="tax_id">
                                                <div className="form-value">{vendor.tax_id_masked}&nbsp;&nbsp;&nbsp;<a onClick={() => setEditingTaxId(true)}>Edit</a></div>
                                            </FormItem>
                                        }
                                        {(!vendor.tax_id || editingTaxId) &&
                                            <FormItem label="" formItemClass="form-item-25" name="tax_id" optional={!values.generate_1099} mask={values.tax_id_type == "ssn" ? insightUtils.ssnMask() : insightUtils.einMask()} placeholder="Enter Tax ID"/>
                                        }
                                    </div>
                                </>}
                                <hr/>
                                <h3 className="text-left">
                                    Insurance
                                    <div className="text-small text-muted">Track Vendor Insurance</div>
                                </h3>
                                <br/>
                                {<FieldArray
                                    name="vendor_insurances"
                                    render={arrayHelpers => (
                                        <>
                                            {values.vendor_insurances && values.vendor_insurances.map((vendor_insurance, index) => (
                                                <React.Fragment key={index}>

                                                    <div className="form-row">
                                                        <FormItem label="Insurance Type" name={`vendor_insurances.${index}.insurance_type_id`} formItemClass="form-item-33" optional={true}>
                                                            <BasicDropdown name={`vendor_insurances.${index}.insurance_type_id`} blankText="-- Select Insurance Type --" options={insightUtils.prepend(items.filter((item) => (item.type == 'VendorInsuranceType')), {id: -1, name: "Add New Type..."})}/>
                                                        </FormItem>
                                                        {insightUtils.getValue(values, `vendor_insurances.${index}.insurance_type_id`) == -1 && <FormItem label="Enter New Type" name={"vendor_insurances." + index + ".insurance_type_name"} formItemClass="form-item-25"/>}
                                                        <div className="form-item text-right" style={isMobileDevice ? {} : {paddingTop: "20px"}}>
                                                            <a onClick={() => removeVendorInsurance(arrayHelpers, index)}>Remove Insurance Policy</a>
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <FormItem label="Policy Effective Date" name={`vendor_insurances.${index}.effective_on`} optional={true}>
                                                            <DatePicker className="form-input form-input-white" selected={insightUtils.getValue(values, `vendor_insurances.${index}.effective_on`)} onChange={(date) => setFieldValue(`vendor_insurances.${index}.effective_on`, date)}/>
                                                        </FormItem>
                                                        <FormItem label="Policy Expiration Date" name={`vendor_insurances.${index}.expires_on`} optional={true}>
                                                            <DatePicker className="form-input form-input-white" selected={insightUtils.getValue(values, `vendor_insurances.${index}.expires_on`)} onChange={(date) => setFieldValue(`vendor_insurances.${index}.expires_on`, date)}/>
                                                        </FormItem>

                                                        <FormItem label="Insurance Company Name" name={`vendor_insurances.${index}.insurance_company_name`} optional={true}/>
                                                    </div>

                                                    <div className="form-row">
                                                        <FormItem label="Policy #" name={`vendor_insurances.${index}.policy_number`} optional={true}/>
                                                        <FormItem label="Liability Limit" name={`vendor_insurances.${index}.liability_limit`} mask={insightUtils.currencyMask()} optional={true}/>
                                                    </div>

                                                    <VendorInsuranceDeclarationsView vendorInsurance={vendor_insurance} declarationsBatchNumber={declarationsBatchNumber + index}/>

                                                    <hr/>

                                                </React.Fragment>
                                            ))}
                                            <br/>
                                            <div className="text-center">
                                                <a className="btn btn-green" onClick={() => addVendorInsurance(arrayHelpers)}>Add Insurance Policy</a>
                                            </div>
                                        </>
                                    )}
                                />}

                                <hr/>
                                <h3 className="text-left">
                                    Vendor Licenses
                                    <div className="text-small text-muted">Track Vendor License Information</div>
                                </h3>
                                <br/>
                                {<FieldArray
                                    name="vendor_licenses"
                                    render={arrayHelpers => (
                                        <>
                                            {values.vendor_licenses && values.vendor_licenses.map((vendor_license, index) => (
                                                <React.Fragment key={index}>

                                                    <div className="form-row">
                                                        <FormItem label="License Type" name={`vendor_licenses.${index}.license_type_id`} formItemClass="form-item-33" optional={true}>
                                                            <BasicDropdown name={`vendor_licenses.${index}.license_type_id`} blankText="-- Select License Type --" options={insightUtils.prepend(items.filter((item) => (item.type == 'VendorLicenseType')), {id: -1, name: "Add New Type..."})}/>
                                                        </FormItem>
                                                        {insightUtils.getValue(values, `vendor_licenses.${index}.license_type_id`) == -1 && <FormItem label="Enter New Type" name={"vendor_licenses." + index + ".license_type_name"} formItemClass="form-item-25"/>}
                                                        <div className="form-item text-right" style={isMobileDevice ? {} : {paddingTop: "20px"}}>
                                                            <a onClick={() => removeVendorLicense(arrayHelpers, index)}>Remove License</a>
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <FormItem label="License Effective Date" name={`vendor_licenses.${index}.effective_on`} optional={true}>
                                                            <DatePicker className="form-input form-input-white" selected={insightUtils.getValue(values, `vendor_licenses.${index}.effective_on`)} onChange={(date) => setFieldValue(`vendor_licenses.${index}.effective_on`, date)}/>
                                                        </FormItem>
                                                        <FormItem label="License Expiration Date" name={`vendor_licenses.${index}.expires_on`} optional={true}>
                                                            <DatePicker className="form-input form-input-white" selected={insightUtils.getValue(values, `vendor_licenses.${index}.expires_on`)} onChange={(date) => setFieldValue(`vendor_licenses.${index}.expires_on`, date)}/>
                                                        </FormItem>
                                                    </div>

                                                    <div className="form-row">
                                                        <FormItem label="License #" name={`vendor_licenses.${index}.license_number`} optional={true}/>
                                                        <FormItem label="Issuing Agency" name={`vendor_licenses.${index}.issuing_agency`} optional={true}/>
                                                    </div>

                                                    <VendorLicenseLicencesView vendorLicense={vendor_license} licensesBatchNumber={licensesBatchNumber + index}/>

                                                    <hr/>

                                                </React.Fragment>
                                            ))}
                                            <br/>

                                            <div className="text-center">
                                                <a className="btn btn-green" onClick={() => addVendorLicense(arrayHelpers)}>Add License</a>
                                            </div>
                                        </>
                                    )}
                                />}
                                <hr/>
                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    {vendor.id && currentUser.vendors_delete && <a onClick={()=>setDeletingVendor(vendor)} className="btn btn-gray"><span>Delete</span></a>}
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>
                                </div>

                                {deletingVendor && <Modal closeModal={() => cancelDelete()}>
                                    <h2>Delete Vendor?</h2>
                                    <p className="text-center">Are you sure you want to delete this vendor?</p>

                                    <div className="form-nav">
                                        <div onClick={() => cancelDelete()} className="btn btn-gray"><span>Cancel</span></div>
                                        <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                                    </div>
                                </Modal>}
                            </div>
                        </Form>
                    )}
                </Formik>
            </>}

                {vendor && vendor.id &&
                    <CommentsView title="Notes" type="CommunicationNotePrivate" subType="notes" relatedObjectType="Vendor" relatedObjectHashId={vendor.id} extraClassName="skinny-column" containerClassName="main-container"/>
                }
            </div>
        </>
    )
}

export default VendorEditPage;

