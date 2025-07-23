import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {Link, useParams} from "react-router-dom";
import store from "../../../app/store";
import { Carousel } from 'react-responsive-carousel';
import GoogleMapReact from 'google-map-react'

import "react-responsive-carousel/lib/styles/carousel.min.css";
import {searchForPropertyListings} from "../../../slices/propertyListingSlice";
import insightUtils from "../../../app/insightUtils";
import Modal from "../../shared/Modal";
import UnitListingShowPage from "./UnitListingShowPage";
import insightRoutes from "../../../app/insightRoutes";
import {Form, Formik} from "formik";
import {saveCharge} from "../../../slices/chargeSlice";
import FormItem from "../../shared/FormItem";

import BasicDropdown from "../../shared/BasicDropdown";
import BedsDropdown from "../../landlord/companies/BedsDropdown";
import BathsDropdown from "../../landlord/companies/BathsDropdown";

const PropertyListingShowPage = ({inPreviewMode}) => {

    let params = useParams()

    const { isMobileDevice, railsEnv } = useSelector((state) => state.dashboard)
    const { constants, baseUrl } = useSelector((state) => state.company)

    const [googleMap, setGoogleMap] = useState(null);
    const [allUnitListings, setAllUnitListings] = useState(null)
    const [unitListings, setUnitListings] = useState(null)
    const [unitListingGroups, setUnitListingGroups] = useState(null)
    const [company, setCompany] = useState(null)
    const [properties, setProperties] = useState(null)
    const [propertyPhotos, setPropertyPhotos] = useState(null)
    const [unitListing, setUnitListing] = useState(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [cityOptions, setCityOptions] = useState(null)


    useEffect(async() => {

        if (constants && Object.keys(constants).length > 0) {
            /*
               Load Company, Properties and Property Listings using params.propertyListingId
            */
            const results = await store.dispatch(searchForPropertyListings({propertyListingId: params.propertyListingId, entireCompany: true})).unwrap()

            console.log(results)

            let newCities = {}

            results.data.unit_listings.forEach((unitListing, i) => {
                const property = results.data.properties.find((p) => p.id == unitListing.property_id)
                const unit = property.units.find((u) => u.id == unitListing.unit_id)
                const cityAndState = unit.city +  ", " + unit.state
                const cityId = cityAndState.toLowerCase().replace(" ", '-').replace(',', '')
                newCities[cityId] = {id: cityId, name: cityAndState}
            })

            const newSortedCities = Object.values(newCities).sort((a, b) => {
                    return (a.id > b.id ? 1 : -1) * -1
                }
            )

            setCityOptions(newSortedCities)
            setAllUnitListings(results.data.unit_listings)
            setProperties(results.data.properties)
            setPropertyPhotos(results.data.property_photos)
            setCompany(results.data.company)
            setUnitListings(results.data.unit_listings)
        }

    }, [constants]);

    useEffect(async() => {
        if (googleMap) {
            fitMapToMarkers()
        }
    }, [googleMap])

    useEffect(async() => {
        if (unitListings) {

            // Split unit listings into groups of 4
            let newUnitListingGroups = []
            let newUnitListings = Array.from(unitListings)
            let size = isMobileDevice ? 1 : 4

            while (newUnitListings.length > 0) {
                newUnitListingGroups.push(newUnitListings.splice(0, size));
            }

            setUnitListingGroups(newUnitListingGroups)

            if (googleMap) {
                fitMapToMarkers()
            }
        }
    }, [unitListings])


    function handleViewUnitListing(unitListing) {
        setUnitListing(unitListing)
    }

    function apiIsLoaded(map) {
        setGoogleMap(map);
    }

    function fitMapToMarkers() {
        console.log("Fitting Map");

        // Re-center the map
        let adjustmentsMade = 0;
        let bounds = new google.maps.LatLngBounds();

        unitListings.forEach((unitListing, i) => {
            bounds.extend(new google.maps.LatLng(unitListing.lat, unitListing.lng));
            adjustmentsMade++;
        });

        // Don't zoom in too far on only one marker
        if (Math.abs(bounds.getNorthEast().lat() - bounds.getSouthWest().lat()) < 0.005) {
            const extendPoint1 = new google.maps.LatLng(
                bounds.getNorthEast().lat() + 0.01,
                bounds.getNorthEast().lng() + 0.01
            );
            const extendPoint2 = new google.maps.LatLng(
                bounds.getNorthEast().lat() - 0.01,
                bounds.getNorthEast().lng() - 0.01
            );
            bounds.extend(extendPoint1);
            bounds.extend(extendPoint2);
        }

        if (adjustmentsMade > 0) {
            // Don't let the map try to re-load results right after we load them
            googleMap.fitBounds(bounds, 0);
        }
    }

    function copyLink(url) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(baseUrl + url);
        }
        setLinkCopied(true)
    }

    async function handleSearch(values, { setSubmitting, setErrors }) {

        try {
            const matchingUnitListings = allUnitListings.filter((unitListing) => {

                const property = properties.find((p) => p.id == unitListing.property_id)
                const unit = property.units.find((u) => u.id == unitListing.unit_id)
                const cityAndState = unit.city +  ", " + unit.state
                const cityId = cityAndState.toLowerCase().replace(" ", '-').replace(',', '')

                if (values.rent && (!unitListing.rent || parseInt(unitListing.rent) > values.rent)) {
                    return false;
                }

                if (values.beds && (!unit.beds || unit.beds < values.beds)) {
                    return false;
                }

                if (values.baths && (!unit.baths || unit.baths < values.baths)) {
                    return false;
                }

                if (values.city && values.city != cityId) {
                    return false;
                }

                return true;
            })

            console.log(matchingUnitListings)
            setUnitListings(matchingUnitListings)

            setSubmitting(false);

        }
        catch(err) {
            console.log("UH-OH", err)
            setSubmitting(false);
        }
    }

    return (
        <>
            <div className="section property-listings">
                {(!unitListings || !unitListingGroups) ?
                    <>Loading...</>
                    :
                    <>
                        <div className="flex-row flex-space-between">
                            <h1>Find a Property for Rent{inPreviewMode && " - PREVIEW"}</h1>
                            {inPreviewMode && <div style={{display: "flex", alignItems: "flex-end", paddingBottom: "20px"}}><Link to={insightRoutes.propertyListingList()} className="btn btn-gray"><span>Back</span></Link>&nbsp;<a onClick={() => copyLink(insightRoutes.propertyListingsShow(params.propertyListingId))} className="btn btn-red"><span>{linkCopied ? "Link Copied": "Copy Link"}</span> <i className="fal fa-link"></i></a></div>}
                        </div>

                        {cityOptions && <Formik
                                initialValues={{rent: "", beds: "", baths: ""}}
                                onSubmit={handleSearch}
                            >
                            {({ isSubmitting, values, setFieldValue }) => (
                                <Form>
                                        <div className="form-row">
                                            <FormItem label="Rent" name="rent">
                                                <BasicDropdown name="rent" extraClass="form-select-gray" options={[{id: 500, name: "< $500"},{id: 750, name: "< $750"},{id: 1000, name: "< $1,000"},{id: 1250, name: "< $1,250"},{id: 1500, name: "< $1,500"},{id: 1750, name: "< $1,750"},{id: 2000, name: "< $2,000"},{id: 2250, name: "< $2,250"},{id: 2500, name: "< $2,500"},{id: 2750, name: "< $2,750"},{id: 3000, name: "< $3,000"},{id: 4000, name: "< $4,000"},{id: 5000, name: "< $5,000"},{id: 10000, name: "< $10,000"}]} />
                                            </FormItem>

                                            <FormItem label="Beds" name="beds">
                                                <BedsDropdown name="beds" />
                                            </FormItem>

                                            <FormItem label="Baths" name="baths">
                                                <BathsDropdown name="baths" />
                                            </FormItem>

                                            <FormItem label="City" name="city">
                                                <BasicDropdown name="city" extraClass="form-select-gray" blankText="All Cities" options={cityOptions} />
                                            </FormItem>

                                            <div className="form-item">
                                                <button className="btn btn-red" style={{marginTop: "29px"}} type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Search" : "Searching..."}</span></button>
                                            </div>
                                        </div>
                                </Form>
                            )}
                        </Formik>}

                        <div className="map">
                            <GoogleMapReact
                                bootstrapURLKeys={{ key: constants.env.google_api_key }}
                                onGoogleApiLoaded={({ map }) => apiIsLoaded(map)}
                                yesIWantToUseGoogleMapApiInternals
                                center={unitListings.length == 0 ? {lat: parseFloat(allUnitListings[0].lat), lng: parseFloat(allUnitListings[0].lng)} : {lat: parseFloat(unitListings[0].lat), lng: parseFloat(unitListings[0].lng)}}
                                zoom={14}
                            >
                                {unitListings.map((unitListing, i) => {
                                    return (<div key={i}
                                        onClick={() => handleViewUnitListing(unitListing)}
                                        lat={parseFloat(unitListing.lat)}
                                        lng={parseFloat(unitListing.lng)}
                                        text="Unit"
                                        className="map-marker">
                                        <i className="fa fa-map-marker map-marker" />
                                    </div>)
                                })}
                            </GoogleMapReact>
                        </div>
                        <div style={{display: "block", width: "100%", height: "300px"}}>
                            <Carousel showThumbs={false} showIndicators={false} showStatus={false}>
                                {unitListingGroups.map((unitListingGroup, i) => {
                                    return (
                                        <div key={i} className="unit-listing-group">
                                            <div className="flex-row">
                                            {unitListingGroup.map((unitListing, j) => {

                                                const property = properties.find((p) => p.id == unitListing.property_id)
                                                const propertyPhoto = propertyPhotos.find((p) => p.property_id == unitListing.property_id)
                                                const unit = property.units.find((u) => u.id == unitListing.unit_id)

                                                return (<div key={j} className="st-col-25 st-col-md-100 unit-listing-wrapper" onClick={() => handleViewUnitListing(unitListing)}>
                                                    <div className="unit-listing">
                                                        <div className="property-photo">
                                                            <img src={propertyPhoto ? propertyPhoto.url : "/images/apartment-building.png"} className={propertyPhoto ? "img-responsive" : "img-responsive img-square"} />
                                                        </div>
                                                        <div className="lp-info">
                                                            <h2>{unitListing.name}<span>{insightUtils.propertyTypePretty(property.property_type)} in {unit.city}, {unit.state} {unit.zip}</span></h2>
                                                            <div className="lp-info-stats">
                                                                <div className="lp-info-stat"><span style={{whiteSpace: "nowrap"}}>{insightUtils.getBedsLabel(unit.beds)}{unit.beds > 0 && " bed"} / {unit.baths} bath</span> {unitListing.rent && insightUtils.numberToCurrency(unitListing.rent) + " /mo"}</div>
                                                                <div className="lp-info-stat"><span>Available:</span> {unit.available_on ? insightUtils.formatDate(unit.available_on) : "Now"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>)
                                            })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </Carousel>
                        </div>
                    </>
                }
            </div>

            {unitListing &&
            <Modal closeModal={() => setUnitListing(null)}>
               <UnitListingShowPage unitListingId={unitListing.hash_id} />
            </Modal>
            }
        </>

    )}

export default PropertyListingShowPage;

