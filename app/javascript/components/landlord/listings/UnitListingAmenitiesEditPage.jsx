import React, {useEffect, useState} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {Form, Formik} from "formik";

import insightUtils from "../../../app/insightUtils";

import {saveUnitListing, searchForUnitListings} from "../../../slices/unitListingSlice";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import insightRoutes from "../../../app/insightRoutes";

const UnitListingAmenitiesEditPage = ({}) => {

    let params = useParams()
    let navigate = useNavigate()

    const { constants, properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [unitListing, setUnitListing] = useState(null)
    const [otherUnitOptions, setOtherUnitOptions] = useState(null)

    useEffect(async() => {

        if (property) {

            // Load existing unit_listings
            const results = await store.dispatch(searchForUnitListings({propertyId: property.id})).unwrap()
            console.log("Existing Unit Listings", results)
            const existingUnitListings = results.data.unit_listings

            // Merge the property's units with the existing unit listings
            let newUnitListing = null
            let newOtherUnits = []

            property.units.forEach((unit) => {

                if (unit.id == params.unitId) {
                    const existingUnitListing = existingUnitListings.find((ul) => { return ul.unit_id == unit.id})

                    if (existingUnitListing) {
                        newUnitListing = Object.assign({}, existingUnitListing)
                        newUnitListing.available_on = insightUtils.parseDate(newUnitListing.available_on)
                    }
                    else {
                        newUnitListing =  {unit_id: unit.id, street_and_unit: unit.street_and_unit, rent: "", security_deposit: "", lease_term: "", available_on: null}
                    }
                }
                else {
                    newOtherUnits.push(unit)
                }
            })

            newUnitListing.other_unit_update = "feature_amenities,kitchen_amenities,outdoor_amenities,living_space_amenities"

            setOtherUnitOptions(newOtherUnits)
            setUnitListing(newUnitListing)

        }
    }, [property])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        const results = await store.dispatch(saveUnitListing({unitListing: values})).unwrap()
        const response = results.data

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

    function closeView() {
        navigate(insightRoutes.unitListingList(property.id))
    }


    return (
        <>
            {unitListing &&
            <div className="section">
                <img className="section-img" src="/images/photo-units.jpg" />
                <div className="title-block"><h1>{property.name}</h1>
                    <div className="subtitle">{unitListing.street_and_unit} Amenities</div>
                </div>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={unitListing}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div className="section-table-wrap"><p className="text-center">Select the amenities for {unitListing.street_and_unit} on this page.</p>
                                <div className="st-nav">
                                    <div></div>
                                    <div className="st-search"></div>
                                </div>
                                <div className="section-table">
                                    <h3>Features</h3>
                                    <div className="form-row">
                                        <CheckBoxGroup name="feature_amenities" options={constants.unit_feature_amenity_options} direction="row" />
                                    </div>

                                    <hr/>

                                    <h3>Kitchen</h3>
                                    <div className="form-row">
                                        <CheckBoxGroup name="kitchen_amenities" options={constants.unit_kitchen_amenity_options} direction="row" />
                                    </div>

                                    <hr/>

                                    <h3>Outdoor</h3>
                                    <div className="form-row">
                                        <CheckBoxGroup name="outdoor_amenities" options={constants.unit_outdoor_amenity_options} direction="row" />
                                    </div>

                                    <hr/>

                                    <h3>Living Space</h3>
                                    <div className="form-row">
                                        <CheckBoxGroup name="living_space_amenities" options={constants.unit_living_space_amenity_options} direction="row" />
                                    </div>

                                    <h4>Apply to other Unit Listings</h4>
                                    <div className="form-row">
                                        <CheckBoxGroup name="other_unit_ids" options={otherUnitOptions} optionLabelName={"street_and_unit"} direction="row" />
                                    </div>

                                    <div className="form-nav">
                                        <a onClick={closeView} className="btn btn-gray"><span>Cancel</span></a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
            }
        </>


    )}

export default UnitListingAmenitiesEditPage;

