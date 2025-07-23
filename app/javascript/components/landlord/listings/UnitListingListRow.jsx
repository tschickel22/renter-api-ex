import React, {useState} from 'react';
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import DatePicker from "react-datepicker";
import {ErrorMessage, useFormikContext} from "formik";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import {Link, useNavigate} from "react-router-dom";
import store from "../../../app/store";
import {saveUnitListing} from "../../../slices/unitListingSlice";

const UnitListingListRow = ({property, unitListing, namePrefix, unitsInEditMode, toggleEditMode, saveAndProceed}) => {
    const formikProps = useFormikContext()
    let navigate = useNavigate()

    const { constants } = useSelector((state) => state.company)

    function updateListingStatus(unitListing, newStatus) {
        formikProps.setFieldValue(namePrefix + "status", newStatus)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row st-header">
                    <div className="st-first-col st-col-100" style={{justifyContent: "space-between"}}>
                        {unitsInEditMode.indexOf(unitListing.unit_id) < 0 ?
                            <>
                                <div className="st-title" onClick={() => toggleEditMode(unitListing.unit_id)} style={{cursor: "pointer"}}>
                                    {unitListing.listing_type == constants.unit_listing_type_options.floor_plan.key ? "Floor Plan" : "Unit"} {unitListing.name}
                                    &nbsp;&nbsp;
                                    <i className="fa fa-pencil" style={{fontSize: "0.8em", fontWeight: "normal"}}></i>
                                    <div />
                                </div>
                                {unitListing.id && <div onClick={() => updateListingStatus(unitListing, insightUtils.getValue(formikProps.values, namePrefix + "status") == constants.unit_listing_statuses.active.key ? constants.unit_listing_statuses.inactive.key : constants.unit_listing_statuses.active.key)} className={"lp-status-label" + (insightUtils.getValue(formikProps.values, namePrefix + "status") == constants.unit_listing_statuses.active.key ? "": " text-light-gray")} style={{cursor: "pointer"}}><i className={insightUtils.getValue(formikProps.values, namePrefix + "status") == constants.unit_listing_statuses.active.key ? "fad fa-toggle-on text-red" : "fad fa-toggle-off"}></i> <span>{insightUtils.getValue(formikProps.values, namePrefix + "status") == constants.unit_listing_statuses.active.key ? "Active" : "Inactive"}</span></div>}
                            </>
                        :
                            <>

                                <div className="form-row" style={{width: "100%", marginBottom: "0"}}>
                                    <FormItem name={`${namePrefix}listing_type`}>
                                        <BasicDropdown name={`${namePrefix}listing_type`} options={constants.unit_listing_type_options} />
                                    </FormItem>
                                    <FormItem name={`${namePrefix}name`} placeholder="Listing Name" />
                                </div>

                                <a onClick={() => toggleEditMode(unitListing.unit_id)} style={{marginLeft: "20px"}}>Close</a>
                            </>
                        }
                    </div>
                </div>

                <div className="st-row st-row-valign-top">
                    <div className="st-col-20 st-col-md-100" title="Photos">
                        <div className="form-item">
                            <label>Photo</label>
                            <img onClick={() => navigate(insightRoutes.unitListingPhotosEdit(property.id, unitListing.unit_id))} src={unitListing.photo_url || "/images/photo-units.jpg"} style={{width: "100px"}} />
                        </div>
                    </div>

                    <span className="st-col-20 st-col-md-100" title="Rent" style={{paddingRight: "10px"}}>
                        <FormItem label="Rent" name={`${namePrefix}rent`} mask={insightUtils.currencyMask()} optional={true} />
                        <div className="hidden-md">
                            <br/>
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingPhotosEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Upload Photos</a>
                        </div>
                    </span>

                    <span className="st-col-20 st-col-md-100" title="Security Deposit" style={{paddingRight: "10px"}}>
                        <FormItem label="Security Deposit" name={`${namePrefix}security_deposit`} mask={insightUtils.currencyMask()}  optional={true} />
                        <div className="hidden-md">
                            <br/>
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingDescriptionEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Update Description</a>
                        </div>
                    </span>

                    <span className="st-col-20 st-col-md-100" title="Lease Term" style={{paddingRight: "10px"}}>
                        <FormItem label="Lease Term" name={`${namePrefix}lease_term`} optional={true}>
                            <BasicDropdown name={`${namePrefix}lease_term`} options={constants.lease_term_options} />
                        </FormItem>
                        <div className="hidden-md">
                            <br/>
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingAmenitiesEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Select Amenities</a>
                        </div>
                    </span>

                    <span className="st-col-20 st-col-md-100" title="Available On">
                        <FormItem label="Available On" name={`${namePrefix}available_on`} optional={true}>
                            <DatePicker className="form-input form-input-white" selected={insightUtils.getValue(formikProps.values, namePrefix + "available_on")} onChange={(date) => formikProps.setFieldValue(namePrefix + "available_on", date)} />
                        </FormItem>
                        <div className="hidden-md">
                            <br/>
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingPreview(unitListing.hash_id), formikProps.submitForm)}>Preview Listing</a>
                        </div>
                    </span>
                </div>
                <div className="hidden-md" style={{height: "20px"}}>

                </div>
                <div className="visible-md">
                    <div className="st-row st-row-valign-top">
                        <div className="st-col-20 st-col-md-100">
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingPhotosEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Upload Photos</a>
                        </div>

                        <span className="st-col-20 st-col-md-100">
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingDescriptionEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Update Description</a>
                        </span>

                        <span className="st-col-20 st-col-md-100">
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingAmenitiesEdit(property.id, unitListing.unit_id), formikProps.submitForm)}>Select Amenities</a>
                        </span>

                        <span className="st-col-20 st-col-md-100">
                            <a onClick={() => saveAndProceed(insightRoutes.unitListingPreview(unitListing.hash_id), formikProps.submitForm)}>Preview Listing</a>
                        </span>
                    </div>
                </div>
            </div>

        </>

    )}

export default UnitListingListRow;

