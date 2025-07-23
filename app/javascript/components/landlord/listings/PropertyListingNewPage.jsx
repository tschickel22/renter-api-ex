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

const PropertyListingNewPage = () => {

    let navigate = useNavigate()

    const { currentCompany, properties, constants } = useSelector((state) => state.company)

    const [propertyListing, setPropertyListing] = useState(null)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(() => {

        if (currentCompany && currentCompany.listings_onboard_status == constants.payment_onboarding_statuses.completed.key && properties) {
            setPropertyListing({})
        }
    }, [currentCompany, properties])

    function handleFormikValidation(values) {

        const errors = {};

        if (!values.property_id) {
            errors.property_id = 'Select a property';
        }

        return errors;

    }

    async function handleFormikSubmit(values, { }) {
        setBaseErrorMessage("")

        navigate(insightRoutes.propertyListingEdit(values.property_id))
    }

    function closeView() {
        navigate(insightRoutes.propertyListingList())
    }

    return (
        <>
            <div className="section">
            {propertyListing && <>
                <img className="section-img" src="/images/photo-units.jpg" />
                <div className="title-block"><h1>Add Listing</h1></div>

                <p className="text-center">Select a property in order to create a listing.</p>
                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                <Formik
                    initialValues={propertyListing}
                    validate={handleFormikValidation}
                    onSubmit={handleFormikSubmit}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="add-property-wrap">
                                <div className="form-row">
                                    <FormItem label="Property" name="property_id" >
                                        <BasicDropdown name="property_id" blankText="Select Property" options={properties} />
                                    </FormItem>
                                </div>

                                <div className="form-nav">
                                    <a onClick={() => closeView()} className="btn btn-gray" disabled={isSubmitting}>
                                        <span>Cancel</span>
                                    </a>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                        <span>{!isSubmitting ? "Continue" : "Saving..."}</span>
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

export default PropertyListingNewPage;

