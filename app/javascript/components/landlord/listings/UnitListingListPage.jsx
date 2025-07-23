import React, {useEffect, useState} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {FieldArray, Form, Formik} from "formik";

import insightUtils from "../../../app/insightUtils";
import UnitListingListRow from "./UnitListingListRow";
import {saveUnitListing, saveUnitListings, searchForUnitListings} from "../../../slices/unitListingSlice";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import FormItem from "../../shared/FormItem";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const UnitListingListPage = ({}) => {

    let params = useParams()
    let navigate = useNavigate()
    let location = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const { properties, settings, constants } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [propertyListing, setPropertyListing] = useState(null)
    const [unitsInEditMode, setUnitsInEditMode] = useState([])
    const [unitsWithoutListings, setUnitsWithoutListings] = useState([])
    const [selectingUnit, setSelectingUnit] = useState(false)
    const [nextUrl, setNextUrl] = useState(null)
    const [saveMethod, setSaveMethod] = useState(null)


    useEffect(async() => {

        if (property) {

            // Load existing unit_listings
            const results = await store.dispatch(searchForUnitListings({propertyId: property.id})).unwrap()
            console.log("Existing Unit Listings", results)
            const existingUnitListings = results.data.unit_listings

            // Merge the property's units with the existing unit listings
            let newUnitListings = []
            let newUnitsWithoutListings = []
            property.units.forEach((unit) => {

                const existingUnitListing = existingUnitListings.find((ul) => { return ul.unit_id == unit.id})

                if (existingUnitListing) {
                    let newUnitListing = Object.assign({}, existingUnitListing)
                    newUnitListing.available_on = insightUtils.parseDate(newUnitListing.available_on)
                    newUnitListing.lease_term ||= ""

                    newUnitListings.push(newUnitListing)
                }
                else {
                    newUnitsWithoutListings.push(unit)
                }

            })

            // If we don't have any listings yet, jump straight into selecting a unit
            if (newUnitListings.length == 0) {
                setSelectingUnit(true)
            }

            setUnitsWithoutListings(newUnitsWithoutListings)
            setPropertyListing({unit_id: "", listing_type: "", unit_listings: newUnitListings})

        }
    }, [property])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        // Have we been asked to activate as well?
        if (saveMethod == "saveAndActivate") {
            values.unit_listings.forEach((unitListing) => { unitListing.status = constants.unit_listing_statuses.active.key})
        }

        const results = await store.dispatch(saveUnitListings({propertyId: property.id, unitListings: values.unit_listings})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            if (nextUrl) {
                navigate(nextUrl)
            }
            else {
                // Ensure this property is set up for screening. If not, let the user know
                const newSettings = insightUtils.getSettings(settings, property.id)
                if (newSettings?.application_require_screening) {
                    if (!property.external_screening_id || !property.screening_attestation) {
                        store.dispatch(displayAlertMessage({message: "You must complete the screening activation for this property", linkText: "Complete Screening Activation", url: insightRoutes.propertyScreeningAttestation(property.id), hideCloseOption: true, navigateState: {return_url: location.pathname + (window.location.search || '')}}))
                    }
                }

                closeView()
            }

        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }
            else {
                // Is there a status error that we need to use a pop-up for?
                if (response.errors.unit_listings && Object.values(response.errors.unit_listings).find((ul) => ul.status)) {
                    const listingWithStatusError = Object.values(response.errors.unit_listings).find((ul) => ul.status)

                    if (listingWithStatusError.status.indexOf("screening settings") >= 0) {
                        store.dispatch(displayAlertMessage({message: listingWithStatusError.status, url: insightRoutes.settingEdit("properties", property.id, "screening", true), navigateState: {return_url: location.pathname}, linkText: "Edit Settings"}))
                    }
                    else {
                        store.dispatch(displayAlertMessage({message: listingWithStatusError.status}))
                    }
                }
            }

            insightUtils.scrollTo('errors')
        }
    }

    async function handleUnitSelected(newUnitId, newListingType, arrayHelpers) {
        const unit = unitsWithoutListings.find((u) => u.id == newUnitId)

        if (unit) {
            const name = newListingType == constants.unit_listing_type_options.floor_plan.key ? unit.floor_plan_name : unit.street_and_unit

            const results = await store.dispatch(saveUnitListing({unitListing: {unit_id: unit.id, name: name, listing_type: newListingType}})).unwrap()
            console.log(results)
            arrayHelpers.push(results.data.unit_listing)

            // Take this unit out of the list
            setUnitsWithoutListings(unitsWithoutListings.filter((u) => u.id != newUnitId))
        }
        setSelectingUnit(false)
    }

    function closeView() {
        navigate(insightRoutes.propertyListingList())
    }

    function toggleEditMode(unitId) {
        let newUnitsInEditMode = Array.from(unitsInEditMode)

        if (unitsInEditMode.indexOf(unitId) < 0) {
            newUnitsInEditMode.push(unitId)
        }
        else {
            newUnitsInEditMode.splice(unitsInEditMode.indexOf(unitId), 1)
        }

        setUnitsInEditMode(newUnitsInEditMode)
    }

    function saveAndProceed(newNextUrl, submitForm) {
        setNextUrl(newNextUrl)
        submitForm()
    }

    async function save(newSaveMethod, submitForm) {
        await setSaveMethod(newSaveMethod)
        submitForm()
    }

    return (
        <>
            {propertyListing && currentUser.listings_edit &&
                <div className="section">
                    <img className="section-img" src="/images/photo-units.jpg" />
                    <div className="title-block"><h1>{property.name}</h1>
                        <div className="subtitle">Unit Listings</div>
                    </div>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={propertyListing}
                        onSubmit={handleFormikSubmit}
                    >
                    {({ isSubmitting, values, submitForm }) => (
                        <Form>
                            <div className="section-table-wrap">
                                <p className="text-center">
                                    Configure the listings for each unit on this page.<br/>
                                    <br/>
                                    <Link to={insightRoutes.propertyListingEdit(property.id)} className="btn btn-gray">Edit Property-level info for {property.name}</Link>
                                    {unitsWithoutListings && unitsWithoutListings.length > 0 &&
                                    <>
                                        &nbsp;
                                        <a onClick={() => setSelectingUnit(true)} className="btn btn-red">Add Additional Unit</a>
                                    </>}
                                </p>
                                <div className="st-nav">
                                    <div></div>
                                    <div className="st-search"></div>
                                </div>

                                <div className="section-table">
                                    <div className="st-table-scroll">
                                        {<FieldArray
                                            name="unit_listings"
                                            render={(arrayHelpers) => (
                                                <>
                                                    {selectingUnit &&
                                                        <>
                                                            <div className="form-row">
                                                                <FormItem label="Select a Unit" name="unit_id" >
                                                                    <BasicDropdown name="unit_id" blankText="Select Unit" options={unitsWithoutListings} optionLabelName="street_and_unit" />
                                                                </FormItem>
                                                            </div>
                                                            {values.unit_id &&
                                                                <div className="form-row form-stacked">
                                                                    <label>What kind of listing do you want?</label><br/>
                                                                    <br/>
                                                                    <FormItem name="listing_type" radioValue={constants.unit_listing_type_options.specific_unit.key} type="radio" label="Specific Unit - Use this listing for a specific unit.  The listing will automatically be removed upon move-in."/>
                                                                    <br/>
                                                                    <FormItem name="listing_type" radioValue={constants.unit_listing_type_options.floor_plan.key} type="radio" label="Floor Plan - This is good for creating one listing to represent several similar units.  This listing will not automatically be removed upon move-in."/>

                                                                </div>
                                                            }
                                                            <div className="form-nav">
                                                                <a onClick={() => setSelectingUnit(false)} className="btn btn-gray"><span>Cancel</span></a>
                                                                {values.unit_id && values.listing_type &&
                                                                    <a onClick={() => handleUnitSelected(values.unit_id, values.listing_type, arrayHelpers)} className="btn btn-red">
                                                                        <span>Continue</span>
                                                                    </a>
                                                                }
                                                            </div>


                                                        </>
                                                    }
                                                    {!selectingUnit && values.unit_listings && values.unit_listings.map((unitListing, index) => (
                                                        <UnitListingListRow key={index} property={property} unitListing={unitListing} unitsInEditMode={unitsInEditMode} toggleEditMode={toggleEditMode} saveAndProceed={saveAndProceed} namePrefix={`unit_listings.${index}.`} />
                                                    ))}
                                                </>
                                            )}
                                        />}
                                    </div>
                                    {!selectingUnit &&
                                        <>
                                            <div className="form-nav">
                                                <a onClick={closeView} className="btn btn-gray"><span>Back</span></a>
                                                <button className="btn btn-red" onClick={() => save("save", submitForm)} disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                                </button>
                                                {values.unit_listings.filter((unitListing) => unitListing.status != constants.unit_listing_statuses.active.key).length > 0 && <button className="btn btn-red" onClick={() => save("saveAndActivate", submitForm)}  disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Save and Activate" : "Saving..."}</span>
                                                </button>}
                                            </div>
                                            {values.unit_listings.filter((unitListing) => unitListing.status != constants.unit_listing_statuses.active.key).length > 0 && <p className="text-center text-muted">Activated listings will be live immediately and will be updated on apartment listing sites within 24-48 hours.</p>}
                                        </>
                                    }
                                </div>
                            </div>
                        </Form>
                    )}
                    </Formik>
                </div>
            }
        </>


    )}

export default UnitListingListPage;

