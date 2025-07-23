import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {ErrorMessage, Field, FieldArray, Form, Formik} from "formik";

import store from "../../../app/store";

import Modal from "../../shared/Modal";

import {updateFloorPlanNames} from "../../../slices/companySlice";
import {deactivateProperty, loadProperties, reactivateProperty, saveProperty, searchForPropertyOwners} from "../../../slices/propertySlice";
import {useSelector} from "react-redux";
import PropertyOwnerDropdown from "./PropertyOwnerDropdown";
import PropertyOwnerPercentageDropdown from "./PropertyOwnerPercentageDropdown";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import PropertyTypeDropdown from "./PropertyTypeDropdown";
import FormItem from "../../shared/FormItem";
import UnitEditForm from "./UnitEditForm";
import RadioButtonGroup from "../../shared/RadioButtonGroup";

function useQuery() {
    const { search } = useLocation();

    return React.useMemo(() => new URLSearchParams(search), [search]);
}

const PropertyEditModal = ({}) => {
    let navigate = useNavigate();
    let location = useLocation()
    let params = useParams();
    let query = useQuery()

    const { currentCompany, constants, properties, floorPlanNames } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [property, setProperty] = useState(null)
    const [propertyOwners, setPropertyOwners] = useState(null)
    const [deactivatingProperty, setDeactivatingProperty] = useState(false)

    useEffect(async() => {

        if (properties) {
            const results = await store.dispatch(searchForPropertyOwners({})).unwrap()
            console.log(results)
            setPropertyOwners(results.data.property_owners)

            // Are we coming back from something?
            if (location.state && location.state.values && !location.state.return_url) {
                setProperty(location.state.values)
            }
            else {

                // Can they add a unit?
                if (currentCompany.subscription_level == "free") {
                    const totalNumberOfUnits = insightUtils.countAllUnits(properties)

                    if (totalNumberOfUnits >= currentCompany.max_number_of_units) {
                        navigate(insightRoutes.upgradeForUnits())
                        return
                    }
                }

                let newProperty = null

                if (parseInt(params.propertyId) > 0) {
                    newProperty = (properties || []).find((property) => property.id == parseInt(params.propertyId))
                }

                let default_property_ownership = insightUtils.emptyPropertyOwnership()

                if (propertyOwners && propertyOwners.length == 1) {
                    default_property_ownership = {property_owner_id: propertyOwners[0].id, percentage: 100}
                }

                if (!newProperty) {
                    newProperty = insightUtils.emptyProperty()
                }
                else {
                    // Make this writable
                    newProperty = Object.assign({}, newProperty)
                }

                if (!newProperty.units || newProperty.units.length == 0) {
                    newProperty.units = [insightUtils.emptyUnit()]
                }

                if (newProperty.property_ownerships) {
                    let newPropertyOwnerships = newProperty.property_ownerships.map((po) => {
                        let newPropertyOwnership = Object.assign({}, po)

                        if ([25, 50, 75, 100].indexOf(parseInt(newPropertyOwnership.percentage)) < 0) {
                            newPropertyOwnership.percentage = -99
                        }

                        return newPropertyOwnership
                    })

                    newProperty.property_ownerships = newPropertyOwnerships
                }
                else {
                    newProperty.property_ownerships = [default_property_ownership]
                }

                setProperty(newProperty)
            }
        }

    }, [properties])

    function addNewUnit(values, arrayHelpers) {

        // Can they add another?
        if (currentCompany.subscription_level == "free") {
            const totalNumberOfUnits = insightUtils.countAllUnits(properties)
            const numberOfNewUnits = values.units.filter((u) => !u.id).length

            if ((totalNumberOfUnits + numberOfNewUnits) >= currentCompany.max_number_of_units) {
                navigate(insightRoutes.upgradeForUnits())
                return
            }
        }

        let lastUnit = Object.assign({}, values.units[values.units.length - 1])
        lastUnit.id = ""
        lastUnit.unit_number = ""

        let newFloorPlanNames = Object.assign({}, floorPlanNames)

        // Update the floorPlanNames in case one has been changed / added
        values.units.forEach((unit) => {
            if (unit.floor_plan_name && unit.floor_plan_name.length > 0 && !newFloorPlanNames[unit.floor_plan_name]) {
                newFloorPlanNames[unit.floor_plan_name] = {beds: unit.beds, baths: unit.baths, square_feet: unit.square_feet}
            }
        })

        store.dispatch(updateFloorPlanNames({newFloorPlanNames: newFloorPlanNames}))

        arrayHelpers.push(lastUnit)
    }

    function handleDeactivateProperty() {
        setDeactivatingProperty(true)
    }

    async function reallyDeactivateProperty() {
        await store.dispatch(deactivateProperty({property: property}))
        closeModal()
    }

    async function handleReactivateProperty() {
        await store.dispatch(reactivateProperty({property: property}))
        closeModal()
    }

    function closeModal(newPropertyId, newUnitId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            navigate(location.state.return_url, {state: {values: newValues}})
        }
        else if (query.get('return_url') && newPropertyId) {
            // Fastest way to get everything in sync
            document.location.href = insightRoutes.screeningNew(newPropertyId, newUnitId)
        }
        else {
            // Is this company set up for payments? If so, let's gather the bank account info
            if (!params.propertyId && newPropertyId && currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key) {

                // Fastest way to get everything in sync... including new property assignments
                document.location.href = insightRoutes.propertyBankAccountList() + "?message=new-property"
            }
            else {
                navigate(insightRoutes.propertyList())
            }
        }
    }

    function handleFormikValidate(values) {
        const errors = {};

        // Make sure ownership adds up to 100%
        let totalOwnership = 0

        values.property_ownerships.forEach((ownership, i) =>
            {
                if (ownership.percentage) {
                    if (ownership.percentage > 0) {
                        totalOwnership = totalOwnership + parseFloat(ownership.percentage)
                        let newOwnership = Object.assign({}, ownership)
                        newOwnership.percentage_other = ""
                        values.property_ownerships[i] = newOwnership
                    }
                    else if (ownership.percentage == -99 && ownership.percentage_other) {
                        totalOwnership = totalOwnership + parseFloat(ownership.percentage_other)
                    }

                }

                if (!ownership.property_owner_id) {
                    insightUtils.addError(errors, "property_ownerships", i, "property_owner_id", "can't be blank")
                }
            }
        )

        if (totalOwnership != 100) {
            if (!errors["property_ownerships"]) errors["property_ownerships"] = []
            if (!errors["property_ownerships"][values.property_ownerships.length -1]) errors["property_ownerships"][values.property_ownerships.length -1] = {}
            errors["property_ownerships"][values.property_ownerships.length -1]["percentage"] = "Ownership must add up to 100%"
        }


        return errors;
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        // Run validation of ownership
        const validationErrors = handleFormikValidate(values)

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
        }
        else {
            try {

                const results = await store.dispatch(saveProperty({property: values})).unwrap()
                const response = results.data
                console.log(response)

                setSubmitting(false);

                if (response.success) {
                    store.dispatch(loadProperties())
                    closeModal(response.property.id, response.property.units && response.property.units.length > 0 ? response.property.units[0].id : null)
                }
                else if (response.errors) {
                    setErrors(response.errors)

                    if (response.errors.base) {
                        setBaseErrorMessage([response.errors.base].flat().join(", "))
                    }

                    insightUtils.scrollTo('errors')
                }

            } catch (err) {
                // Error!
                setBaseErrorMessage("Unable to add property")
                setSubmitting(false);
            }
        }
    }

    return (
        <>
        {properties && property &&
        <div className="section">

            <h2>{property.id ? "Edit " + property.name + (property.status == "inactive" ? " (INACTIVE)" : "") : "Add Property"}</h2>
            <p className="text-center">Use this form to {property.id ? "edit" : "create"} a property.</p>

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={property}
                onSubmit={handleFormikSubmit}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="add-property-wrap">
                            <div className="form-row">
                                <FormItem label="Property Name" name="name" />
                                <FormItem label="Property Type" name="property_type">
                                    <PropertyTypeDropdown name="property_type" />
                                </FormItem>
                            </div>

                            <div className="well">
                                <h3>Property Owners</h3>

                                <div className="form-row">

                                    <FormItem label="Is property owned or managed only?" name="ownership_type">
                                        <RadioButtonGroup name="ownership_type" options={constants.ownership_types} direction="row" />
                                    </FormItem>
                                </div>

                                <FieldArray
                                    name="property_ownerships"
                                    render={arrayHelpers => (
                                        <>
                                            {values.property_ownerships && values.property_ownerships.map((property_owner, index) => (

                                                <div key={index} className="form-row">
                                                    <FormItem label="Property Owner Name" name={`property_ownerships.${index}.property_owner_id`}>
                                                        <PropertyOwnerDropdown name={`property_ownerships.${index}.property_owner_id`} propertyOwners={propertyOwners} />
                                                    </FormItem>

                                                    <FormItem label="Owner Percentage" name={`property_ownerships.${index}.percentage`} formItemClass="form-screen-ownerpercent" hideError={!insightUtils.isStandardPercentage(values["property_ownerships"][index]["percentage"])}>
                                                        <PropertyOwnerPercentageDropdown name={`property_ownerships.${index}.percentage`}  value={insightUtils.isStandardPercentage(values["property_ownerships"][index]["percentage"]) ? values["property_ownerships"][index]["percentage"] : -99} />
                                                    </FormItem>

                                                    {!insightUtils.isStandardPercentage(values["property_ownerships"][index]["percentage"]) &&
                                                        <FormItem label="Owner Percentage" name={`property_ownerships.${index}.percentage_other`} formItemClass="form-screen-ownerpercent-other">
                                                            <Field type="text" name={`property_ownerships.${index}.percentage_other`} value={values["property_ownerships"][index]["percentage_other"] || ""} className="form-input form-input-white" placeholder=""/>
                                                            <ErrorMessage className="text-error" name={`property_ownerships.${index}.percentage`} component="div"/>
                                                        </FormItem>
                                                    }
                                                    {insightUtils.isStandardPercentage(values["property_ownerships"][index]["percentage"]) && <div className="form-item form-screen-ownerpercent-other"></div>}
                                                    {values.property_ownerships.length > 1 && <div style={{paddingLeft: "10px", alignSelf: "center"}}><br/><a onClick={() => arrayHelpers.remove(index)}>Remove</a></div>}
                                                </div>

                                            ))
                                            }

                                            <div className="form-row">
                                                <div className="form-item">
                                                    <a onClick={() => arrayHelpers.push(insightUtils.emptyPropertyOwnership())}>Add Owner</a>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                />
                            </div>

                            {values.property_type && <div>

                                {insightUtils.isMultiFamily(values.property_type) && <h3>Units</h3>}
                                {!insightUtils.isMultiFamily(values.property_type) && <h3>Address</h3>}

                                <FieldArray
                                    name="units"
                                    render={arrayHelpers => (
                                        <>
                                            {values.units && values.units.map((unit, index) => (
                                                <UnitEditForm key={index} property={property} unit={unit} namePrefix={`units.${index}.`} index={index} arrayHelpers={arrayHelpers} />
                                            ))}

                                            {insightUtils.isMultiFamily(values.property_type) &&
                                                <div className="form-row">
                                                    <div className="form-item">
                                                        <a onClick={() => addNewUnit(values, arrayHelpers)}>Add Unit</a>
                                                    </div>
                                                </div>
                                            }
                                        </>
                                    )}
                                />
                            </div>}

                            <div className="form-nav">
                                <a onClick={() => closeModal()} className="btn btn-gray"><span>Cancel</span></a>

                                {property.status == "active" && <a onClick={handleDeactivateProperty} className="btn btn-gray"><span>Deactivate</span></a>}
                                {property.status == "inactive" && <a onClick={handleReactivateProperty} className="btn btn-gray"><span>Re-activate</span></a>}

                                <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                    {!isSubmitting && <span>Save Property</span>}
                                    {isSubmitting && <span>Saving...</span>}
                                </button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>

            {deactivatingProperty &&
                <Modal closeModal={() => setDeactivatingProperty(null)}>

                    <h2>Deactivate Property?</h2>
                    <p className="text-center">Are you sure you want to deactivate this property? All resident accounts will be deactivated as well.</p>

                    <div className="form-nav">
                        <div onClick={() => setDeactivatingProperty(false)} className="btn btn-gray"><span>Cancel</span></div>
                        <div onClick={() => reallyDeactivateProperty()} className="btn btn-red"><span>Deactivate Property</span></div>
                    </div>

                </Modal>
            }

        </div>
        }

        </>
    )}

export default PropertyEditModal;

