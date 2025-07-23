import React, {useState, useEffect, useRef} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {Form, Formik} from "formik";

import store from "../../../app/store";
import {Link} from "react-router-dom";
import Modal from "../../shared/Modal";

import {client} from "../../../app/client";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";

import {deleteUnit, loadUnit, searchForUnits} from "../../../slices/unitSlice";
import {useSelector} from "react-redux";
import UnitEditForm from "./UnitEditForm";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const UnitEditModal = ({}) => {
    let params = useParams()
    let location = useLocation()
    let query = insightUtils.useQuery()

    const navigate = useNavigate()

    const [property, setProperty] = useState(null)
    const [unit, setUnit] = useState(null)
    const [deletingUnit, setDeletingUnit] = useState(false)
    const [isValidForDeletion, setIsValidForDeletion] = useState(false)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const { currentCompany, properties } = useSelector((state) => state.company)

    useEffect(async () => {
        if (params.propertyId) {
            setProperty(insightUtils.getCurrentProperty(properties, params))
        }
    }, [])

    useEffect(async () => {

        if (location.pathname.indexOf("/new") > 0) {

            // Can we add more units?
            if (currentCompany.subscription_level == "free") {
                const totalNumberOfUnits = insightUtils.countAllUnits(properties)

                if (totalNumberOfUnits >= currentCompany.max_number_of_units) {
                    navigate(insightRoutes.upgradeForUnits())
                    return
                }
            }

            let newUnit = null

            if (property && property.units && property.units.length > 0) {
                newUnit = Object.assign({}, property.units[property.units.length - 1])
                newUnit.id = ""
                newUnit.unit_number = ""
            }
            else {
                newUnit = insightUtils.emptyUnit()
                if (property) newUnit.property_id = property.id
            }

            setUnit(newUnit)
        }
        else {
            const results = await store.dispatch(loadUnit({unitId: parseInt(params.unitId)})).unwrap()
            setUnit(results.data.unit)

            // Are there any leases? If not, this unit can be deleted
            if (results.data.unit.leases && results.data.unit.leases.length == 0) {
                setIsValidForDeletion(true)
            }
        }

    }, [property]);


    function closeModal(newUnitId) {
        if (query.get('return_url')) {
            document.location.href = insightRoutes.screeningNew(property.id, newUnitId)
        }
        else {
            navigate(-1)
        }
    }

    function handlePropertyChange(newPropertyId) {
        setProperty(insightUtils.getCurrentProperty(properties, {propertyId: newPropertyId}))
    }

    async function handleDeleteUnit() {
        const results = await store.dispatch(deleteUnit({unitId: parseInt(params.unitId)})).unwrap()

        if (results.data.success) {
            closeModal()
        }
        else {
            setDeletingUnit(false)
            setBaseErrorMessage(results.data.errors?.base)
        }
    }

    return (
        <>
        {properties && unit &&
        <Modal closeModal={closeModal}>

            <h2>{unit.id && property ? `Edit ${property.name}: ${unit.unit_number}` : "Add Unit"}</h2>
            {!deletingUnit && <p className="text-center">Use this form to {unit.id ? "edit" : "create"} a unit.</p>}

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={unit}
                enableReinitialize
                onSubmit={(values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    let url = "/api/internal/units"
                    let method = "POST"

                    if (unit.id) {
                        url += "/" + unit.id
                        method = "PUT"
                    }

                    client.call(method, url, {unit: values})
                        .then((response) => {
                                console.log(response)
                                setSubmitting(false);

                                if (response.success) {
                                    store.dispatch(searchForUnits({propertyId: property.id}))
                                    closeModal(response.unit.id)
                                }
                                else if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base.join(", "))
                                    }

                                    insightUtils.scrollTo('errors')
                                }

                            },
                            () => {
                                // Error!
                                setBaseErrorMessage("Unable to add unit")
                                setSubmitting(false);
                            })
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        {!deletingUnit &&
                            <div className="add-property-wrap">
                                {!params.propertyId &&<>
                                        <h3>Property</h3>
                                        <AutocompleteDropdown name="property_id"
                                                          label="Select Property"
                                                          options={properties}
                                                          handleChange={handlePropertyChange}
                                        />
                                    </>
                                }
                                {property && <>
                                    {property.property_type && <div>

                                        {insightUtils.isMultiFamily(property.property_type) && <h3>Unit</h3>}
                                        {!insightUtils.isMultiFamily(property.property_type) && <h3>Address</h3>}

                                        <UnitEditForm property={property} unit={unit} namePrefix="" index={0} />
                                    </div>}
                                </>}

                                <div className="form-nav">
                                    <a onClick={() => closeModal()} className="btn btn-gray"><span>Cancel</span></a>
                                    {isValidForDeletion && <a onClick={() => setDeletingUnit(true)} className="btn btn-gray"><span>Delete Unit</span></a>}
                                    {property && <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                    </button>}
                                </div>

                            </div>
                        }

                        {deletingUnit &&
                        <>
                            <div className="form-nav">
                                Are you sure you want to delete this unit?
                            </div>
                            <div className="form-nav">
                                <a onClick={() => (setDeletingUnit(false))} className="btn btn-gray"><span>No</span></a>
                                <a onClick={() => (handleDeleteUnit())} className="btn btn-red"><span>Yes</span></a>
                            </div>
                        </>
                        }
                    </Form>
                )}
            </Formik>
        </Modal>
        }
        </>
    )}

export default UnitEditModal;

