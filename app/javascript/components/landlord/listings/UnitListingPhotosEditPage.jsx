import React, {useEffect, useState} from 'react';

import store from "../../../app/store";
import {useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {Form, Formik} from "formik";

import insightUtils from "../../../app/insightUtils";
import {saveUnitListing, saveUnitListings, searchForUnitListings} from "../../../slices/unitListingSlice";
import AddPhotoBox from "../../shared/AddPhotoBox";
import insightRoutes from "../../../app/insightRoutes";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import {client} from "../../../app/client";

const UnitListingPhotosEditPage = ({}) => {

    let navigate = useNavigate()
    let params = useParams()

    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [unitListing, setUnitListing] = useState(null)
    const [otherUnitOptions, setOtherUnitOptions] = useState(null)
    const [selectedPhotos, setSelectedPhotos] = useState([])
    const photosBatchNumber = +new Date()

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

            newUnitListing.other_unit_update = "photos"

            setOtherUnitOptions(newOtherUnits)
            setUnitListing(newUnitListing)

        }
    }, [property])

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        let newUnitListing = {unit_id: values.unit_id, other_unit_ids: values.other_unit_ids, other_unit_update: "photos", photo_ids: selectedPhotos.map((photo) => (photo.id))}

        const results = await store.dispatch(saveUnitListing({unitListing: newUnitListing})).unwrap()
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

    function deleteSelectedPhotos() {
        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData["photo_ids"] = selectedPhotos.map((photo) => (photo.id))

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/unit_listings/" + params.unitId + "/destroy_photos", formData)
            .then((response) => {
                    if (response.success) {
                        if (response.photos) {

                            // Easiest way to update is just refresh the page
                            document.location.href = document.location.href
                        }
                        return true;
                    }
                    else if (response.errors) {
                        console.log(response.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not delete your photo. Please Try again")
                    return false;
                })
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
                    <div className="subtitle">{unitListing.street_and_unit} Photos</div>
                </div>

                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={unitListing}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div className="section-table-wrap"><p className="text-center">Upload photos for {unitListing.street_and_unit} on this page. Click on photos to remove or copy them to another unit listing.</p>
                                <div className="st-nav">
                                    <div></div>
                                    <div className="st-search"></div>
                                </div>
                                <div className="section-table">
                                    <AddPhotoBox apiPath={"/api/internal/unit_listings/" + params.unitId} batchNumber={photosBatchNumber} allowMultiSelect={true}
                                                 header={<h3 className="text-center">Unit Photos</h3>}
                                                 buildMultiSelectUI={(photos) => {
                                                     setSelectedPhotos(photos)
                                                     return (
                                                         <>
                                                             {photos.length > 0 &&
                                                                 <div>
                                                                     {photos.length} selected
                                                                     <h4>Add {photos.length} {photos.length == 1 ? "Photo" : "Photos"} to other Unit Listings</h4>
                                                                     <div className="form-row">
                                                                         <CheckBoxGroup name="other_unit_ids" options={otherUnitOptions} optionLabelName={"street_and_unit"} direction="row" />
                                                                     </div>
                                                                </div>
                                                             }
                                                         </>
                                                         )

                                                 }}
                                    />
                                    <div className="form-nav">
                                        <a onClick={closeView} className="btn btn-gray"><span>Back</span></a>
                                        {selectedPhotos.length > 0 && <>
                                                <a onClick={() => deleteSelectedPhotos()} className="btn btn-gray" type="submit" disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Remove " + selectedPhotos.length + (selectedPhotos.length == 1 ? " Photo" : " Photos") : "Deleting..."}</span>
                                                </a>
                                                <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                    <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                                </button>
                                        </>}
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

export default UnitListingPhotosEditPage;

