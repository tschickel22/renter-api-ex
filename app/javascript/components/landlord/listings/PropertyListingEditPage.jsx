import React, {useState, useEffect, useRef} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'

import {loadPropertyListing, savePropertyListing} from "../../../slices/propertyListingSlice";
import store from "../../../app/store";

import {Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import DatePicker from "react-datepicker";

import AddPhotoBox from "../../shared/AddPhotoBox";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import moment from "moment";

const PropertyListingEditPage = () => {

    let navigate = useNavigate()
    let params = useParams()
    let location = useLocation()

    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany, properties, settings } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [propertyListing, setPropertyListing] = useState(null)
    const [property, setProperty] = useState(null)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const photosBatchNumber = +new Date()

    useEffect(async() => {

        if (currentCompany && currentCompany.listings_onboard_status == constants.payment_onboarding_statuses.completed.key && properties) {
            // Load PropertyListing
            const results = await store.dispatch(loadPropertyListing({propertyId: params.propertyId})).unwrap()

            // The server has final say whether this listing should exist
            if (results.data.property_listing) {
                let newPropertyListing = Object.assign({}, results.data.property_listing)
                newPropertyListing.rent_special_start_on = insightUtils.parseDate(newPropertyListing.rent_special_start_on)
                newPropertyListing.rent_special_end_on = insightUtils.parseDate(newPropertyListing.rent_special_end_on)
                newPropertyListing.rental_license_expires_on = insightUtils.parseDate(newPropertyListing.rental_license_expires_on)
                newPropertyListing.property_id = params.propertyId

                if (!newPropertyListing.contact_name) newPropertyListing.contact_name = currentUser.name
                if (!newPropertyListing.contact_email) newPropertyListing.contact_email = currentUser.email
                if (!newPropertyListing.contact_phone) newPropertyListing.contact_phone = currentCompany.cell_phone

                setCurrentSettings(insightUtils.getSettings(settings))
                setPropertyListing(newPropertyListing)
                setProperty((properties || []).find((property) => newPropertyListing && property.id == newPropertyListing.property_id))
            }
        }
    }, [currentCompany, properties])

    function handleFormikValidation(values) {

        const errors = {};

        if (!values.agreement) {
            errors.agreement = 'You must read and agree';
        }

        return errors;

    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        values.photos_batch_number = photosBatchNumber

        const results = await store.dispatch(savePropertyListing({propertyListing: values})).unwrap()
        const response = results.data

        console.log(response)
        setSubmitting(false);

        if (response.success) {
            navigate(insightRoutes.unitListingList(propertyListing.property_id))
        }
        else if (response.errors) {
            setErrors(response.errors)

            if (response.errors.base) {
                setBaseErrorMessage(response.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    function closeView(newPropertyListingId) {
        if (location.state && location.state.return_url) {
            let newValues = Object.assign({}, location.state.values)

            // If we added a vendor, send it back to the calling form
            if (newPropertyListingId && location.state.field_to_update) newValues[location.state.field_to_update] = newPropertyListingId

            navigate(location.state.return_url, {state: {values: newValues}})

        }
        else {
            navigate(insightRoutes.propertyListingList())
        }
    }

    return (
        <>
            <div className="section">
            {propertyListing && currentUser.listings_edit && <>
                <img className="section-img" src="/images/photo-units.jpg" />
                <div className="title-block"><h1>{propertyListing.id && property ? property.name : "Add Listing"}</h1>
                    {propertyListing.id && property && <div className="subtitle">Property Listing</div>}
                </div>

                <p className="text-center">Use this form to {propertyListing.id ? "edit" : "create"} a listing.</p>
                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={propertyListing}
                    validate={handleFormikValidation}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting, values, setFieldValue, handleChange, handleBlur }) => (
                        <Form>
                            <div className="add-property-wrap">

                                {values.property_id && <>
                                    <AddPhotoBox apiPath={"/api/internal/property_listings/" + (propertyListing.hash_id ? propertyListing.hash_id : "new")} batchNumber={photosBatchNumber}
                                                 header={<>
                                                    <h3>Property Photos</h3>
                                                    <h4 style={{fontWeight: "normal"}}>Photos & Floor Plans (unit photos entered separately)</h4>
                                                    </>
                                                 }
                                    />
                                    <br/><br/>

                                    <div className="form-row">
                                        <FormItem label="Video Link (Vimeo, YouTube, etc)" name="video_url" optional={true} />
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Property Description" name="description" type="textarea" placeholder="Tell us why your property is amazing" maxLength={7000} />
                                    </div>

                                    <h3>Property Amenities</h3>

                                    <div className="form-row">
                                        <FormItem label="Pets Allowed" name="pets_allowed" optional={true}>
                                            <BasicDropdown name="pets_allowed" options={constants.pets_allowed_options} />
                                        </FormItem>
                                        <FormItem label="Laundry Type" name="laundry_type" optional={true}>
                                            <BasicDropdown name="laundry_type" options={constants.laundry_type_options} />
                                        </FormItem>
                                        <FormItem label="Parking" name="parking_type" optional={true}>
                                            <BasicDropdown name="parking_type" options={constants.parking_type_options} />
                                        </FormItem>
                                        <FormItem label="Parking Fee"  name="parking_fee" mask={insightUtils.currencyMask()}  optional={true} />
                                    </div>

                                    <div className="form-row">
                                        <CheckBoxGroup name="amenities" options={constants.amenity_options} direction="row" />
                                    </div>
                                    <hr/>
                                    <h3>Utilities Included</h3>
                                    <div className="form-row">
                                        <CheckBoxGroup name="included_utilities" options={constants.utility_options} direction="row" />
                                    </div>
                                    <hr/>
                                    <h3>Rent Specials</h3>
                                    <div className="form-row">
                                        <FormItem label="Rent Special Title"  name="rent_special_title" optional={true} />
                                        <FormItem label="Rent Special Starts" name="rent_special_start_on" optional={true} >
                                            <DatePicker className="form-input form-input-white" selected={values.rent_special_start_on} onChange={(date) => setFieldValue("rent_special_start_on", date)} />
                                        </FormItem>
                                        <FormItem label="Rent Special Ends" name="rent_special_end_on" optional={true}>
                                            <DatePicker className="form-input form-input-white" selected={values.rent_special_end_on} onChange={(date) => setFieldValue("rent_special_end_on", date)} />
                                        </FormItem>
                                    </div>
                                    <hr/>
                                    <h3>Listing Contact Information</h3>
                                    <p>This info will appear on listing</p>
                                    <div className="form-row">
                                        <FormItem label="Name"  name="contact_name" optional={true} />
                                        <FormItem label="Email"  name="contact_email" optional={true} />
                                        <FormItem label="Phone"  name="contact_phone" mask={insightUtils.phoneNumberMask()} optional={true} />
                                    </div>
                                    <hr/>
                                    <h3>Rental License</h3>
                                    <p>Display your City Rental License Number & Expiration Date</p>
                                    <div className="form-row">
                                        <FormItem label="Rental License Number"  name="rental_license_number" optional={true} />
                                        <FormItem label="Expiration date" name="rental_license_expires_on" optional={true}>
                                            <DatePicker className="form-input form-input-white" selected={values.rental_license_expires_on} onChange={(date) => setFieldValue("rental_license_expires_on", date)} />
                                        </FormItem>
                                    </div>

                                    <FormItem label={<>By checking this box I agree as follows: I agree that I will provide accurate and non discriminatory information and I will comply with the <a href="https://www.renterinsight.com/termsofuse" target="_blank">Renter Insight Terms and Conditions</a> and the <a href="https://www.renterinsight.com/termsofuse" target="_blank">Add a Property Terms of Service</a></>} name="agreement" type="checkbox" avoidCheckBoxLabelAutoClick={true} optional={true} />

                                    <div className="form-nav">
                                        <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Continue" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </>}
                            </div>
                        </Form>
                    )}
                </Formik>
            </>}
            </div>
        </>
    )}

export default PropertyListingEditPage;

