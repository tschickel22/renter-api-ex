import React, {useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {loadUnitListingsForDisplay, saveUnitListing} from "../../../slices/unitListingSlice";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import UnitListingMessagingView from "./UnitListingMessagingView";
import FraudNotice from "./FraudNotice";
import { Carousel } from 'react-responsive-carousel';
import GoogleMapReact from 'google-map-react'

import "react-responsive-carousel/lib/styles/carousel.min.css";
import {displayAlertMessage} from "../../../slices/dashboardSlice";
import {EmailShareButton, FacebookIcon, FacebookMessengerShareButton, FacebookShareButton, TwitterShareButton} from "react-share";

const UnitListingShowPage = ({inPreviewMode, unitListingId}) => {

    let params = useParams()
    let navigate = useNavigate()
    let location = useLocation()

    const { constants, baseUrl } = useSelector((state) => state.company)

    const [applyMode, setApplyMode] = useState("apply")
    const [showListingActiveMessage, setShowListingActiveMessage] = useState(false)
    const [showDeactivateListingPrompt, setShowDeactivateListingPrompt] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [showFraudNotice, setShowFraudNotice] = useState(false)
    const [photos, setPhotos] = useState([])

    // Data loaded once
    const [unitListings, setUnitListings] = useState(null)
    const [allUnitPhotos, setAllUnitPhotos] = useState(null)
    const [company, setCompany] = useState(null)
    const [property, setProperty] = useState(null)
    const [propertyListing, setPropertyListing] = useState(null)
    const [propertyPhotos, setPropertyPhotos] = useState(null)
    const [floorPlans, setFloorPlans] = useState(null)

    // Once a unit is selected...
    const [unit, setUnit] = useState(null)
    const [unitListing, setUnitListing] = useState(null)
    const [shareLinkUrl, setShareLinkUrl] = useState(null)

    useEffect(async() => {

        /*
           Load Unit Listing
        */
        const results = await store.dispatch(loadUnitListingsForDisplay({unitId: unitListingId || params.unitListingId})).unwrap()
        console.log("unitListing:", results);

        if (results.data.unit_listings && results.data.property_listing) {
            setCompany(results.data.company)
            setProperty(results.data.property)
            setPropertyListing(results.data.property_listing)
            setPropertyPhotos(results.data.property_photos || [])

            // Collect the floor plans
            let newFloorPlans = []

            results.data.property.units.forEach((u) => {
                if (newFloorPlans.indexOf(u.floor_plan_name) < 0) {
                    newFloorPlans.push(u.floor_plan_name)
                }
            })

            setFloorPlans(newFloorPlans)
            setAllUnitPhotos(results.data.unit_photos || [])
            setUnitListings(results.data.unit_listings)
        }
        else {
            // What to do?
        }
    }, []);

    useEffect(() => {

        if (unitListings) {
            selectUnitListing(unitListingId || params.unitListingId)
        }
    }, [unitListings, unitListingId, params.unitListingId])

    function selectUnitListing(unitListingId) {
        const newUnitListing = unitListings.find((ul) => ul.hash_id == unitListingId)
        const newUnit = property.units.find((u) => u.id == newUnitListing.unit_id)
        const newUnitPhotos = allUnitPhotos.filter((up) => up.unit_listing_id == newUnitListing.id)

        // Push the photos into the carousel
        let newPhotos = (propertyPhotos || []).map((photo) => { return photo})
        newPhotos = newPhotos.concat(newUnitPhotos.map((photo) => { return photo}))
        setPhotos(newPhotos)

        // If this listing is inactive, just show the messaging view
        if (inPreviewMode || newUnitListing.status == constants.unit_listing_statuses.active.key) {
            setApplyMode("apply")
        }
        else {
            setApplyMode("message")
        }

        setUnit(newUnit)
        setShareLinkUrl(baseUrl + insightRoutes.unitListingShow(newUnitListing.hash_id, newUnitListing.url_stub))
        setUnitListing(newUnitListing)
    }

    function toggleUnitListingStatus() {
        if (unitListing.status == constants.unit_listing_statuses.active.key) {
            setShowDeactivateListingPrompt(true)
        }
        else {
            updateListingStatus(constants.unit_listing_statuses.active.key)
        }
    }

    function handleUnitListingChange(e) {
        // Update the URL
        if (inPreviewMode) {
            navigate(insightRoutes.unitListingPreview(e.target.value))
        }
        else {
            navigate(insightRoutes.unitListingShow(e.target.value))
        }
    }

    async function updateListingStatus(newStatus) {
        let newUnitListing = Object.assign({}, unitListing)
        newUnitListing.status = newStatus

        const results = await store.dispatch(saveUnitListing({unitListing: newUnitListing})).unwrap()

        if (results.data.unit_listing) {
            setShareLinkUrl(baseUrl + insightRoutes.unitListingShow(results.data.unit_listing.hash_id, results.data.unit_listing.url_stub))
            setUnitListing(results.data.unit_listing)

            if (results.data.unit_listing.status == constants.unit_listing_statuses.active.key) {
                setShowListingActiveMessage(true)
            }
        }
        else if (results.data.errors) {
            if (results.data.errors.status) {
                if (results.data.errors.status.indexOf("screening settings") >= 0) {
                    store.dispatch(displayAlertMessage({message: results.data.errors.status, url: insightRoutes.settingEdit("properties", property.id, "screening", true), navigateState: {return_url: location.pathname}, linkText: "Edit Settings"}))
                }
                else {
                    store.dispatch(displayAlertMessage({message: results.data.errors.status}))
                }
            }
            else {
                alert('Unable to update listing status')
            }
        }
    }

    async function focusOnApplication() {
        await setApplyMode("apply")
        document.getElementsByName('primary_resident.resident.first_name')[0].focus()
    }

    function copyLink(url) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText( url);
        }
        setLinkCopied(true)
    }

    return (
        <>
            {showFraudNotice ? <FraudNotice setShowFraudNotice={setShowFraudNotice} /> :
            <div className="section listing-preview">
                {unitListing && <>
                    {inPreviewMode &&
                        <div className="title-block">
                            <h1>Listing Preview</h1>
                        </div>
                    }
                    {(inPreviewMode || unitListing.status == constants.unit_listing_statuses.active.key) ?
                    <>
                        <div className="lp-nav horiz-nav">
                            <div className="lp-links-wrap">
                                {unitListing.status == constants.unit_listing_statuses.active.key && <a onClick={() => copyLink(shareLinkUrl)} className="lp-apply-link tooltip tooltip-copylink"><span>{linkCopied ? "Link Copied": "Copy Link"}</span> <i className="fal fa-link"></i></a>}
                                <div className="lp-apply-link lp-apply-link-icons tooltip tooltip-sharelink"><span>Share Link</span>
                                    <TwitterShareButton url={shareLinkUrl}><i className="fab fa-twitter"></i></TwitterShareButton>
                                    <FacebookShareButton url={shareLinkUrl}><i className="fab fa-facebook"></i></FacebookShareButton>
                                    <EmailShareButton url={shareLinkUrl} subject={unitListing.metadata_title} body={unitListing.metadata_description} separator={"\n\n"} ><i className="fal fa-envelope"></i></EmailShareButton>
                                </div>
                            </div>

                            {inPreviewMode && <div className="lp-status-wrap">

                                    <div className="lp-edit-nav">
                                        <Link to={insightRoutes.propertyListingList()} className="btn btn-gray"><span>Back</span></Link>&nbsp;
                                        <Link to={insightRoutes.unitListingList(unitListing.property_id)} className="btn btn-gray"><span>Edit</span></Link>
                                        {unitListing.status == constants.unit_listing_statuses.new.key && <div onClick={() => updateListingStatus(constants.unit_listing_statuses.active.key)} className="btn btn-red"><span>Publish</span></div>}
                                    </div>

                                    {unitListing.status != constants.unit_listing_statuses.new.key && <div onClick={() => toggleUnitListingStatus()} className={"lp-status" + (unitListing.status == constants.unit_listing_statuses.active.key ? " active" : "")}>
                                        <div className="lp-status-label">Listing <span>{unitListing.status == constants.unit_listing_statuses.active.key ? "Active" : "Inactive"}</span><i className={unitListing.status == constants.unit_listing_statuses.active.key ? "fad fa-toggle-on" : "fad fa-toggle-off"}></i></div>
                                    </div>}

                                    {showListingActiveMessage && <div className="alert-box">
                                        Your listing is now active. Please allow up to 48 hours for this listing to appear on syndication sites. <span onClick={() => setShowListingActiveMessage(false)} className="btn-close-x"><i className="fas fa-times"></i></span>
                                    </div>}

                                    {showDeactivateListingPrompt &&
                                        <div className="alert-box">
                                            Are you sure you want to de-activate this listing?

                                            <div className="btn-block">
                                                <div onClick={() => {setShowDeactivateListingPrompt(false); updateListingStatus(constants.unit_listing_statuses.inactive.key); }}  className="btn btn-red">Yes</div>
                                                &nbsp;
                                                <div onClick={() => setShowDeactivateListingPrompt(false)} className="btn btn-clear">No</div>
                                            </div>
                                        </div>
                                    }

                            </div>}
                        </div>

                        <div className="listing-preview-visuals">

                            <div className="lp-visual lp-carousel">
                                {photos && <Carousel showThumbs={false}>
                                    {photos.map((photo, i) => {
                                        return (<div key={i}>
                                            <img src={photo.url} />
                                        </div>)
                                    })}
                                </Carousel>}
                            </div>

                            <div className="lp-visual lp-map">
                                <GoogleMapReact
                                    bootstrapURLKeys={{ key: constants.env.google_api_key }}
                                    center={{lat: parseFloat(unit.lat), lng: parseFloat(unit.lng)}}
                                    zoom={14}
                                >
                                    <div
                                        lat={parseFloat(unit.lat)}
                                        lng={parseFloat(unit.lng)}
                                        text="Unit"
                                    >
                                        <i className="fa fa-map-marker" style={{color: "#C44C3D", fontSize: "30px", marginTop: "-30px", marginLeft: "-22px"}} />
                                    </div>
                                </GoogleMapReact>
                            </div>

                        </div>

                        <div className="listing-preview-topstats">
                            <div className="lp-buttons">
                                {false &&
                                    <div className="lp-qr-code-wrap">
                                        <img className="lp-qr-code" src="images/listing-preview-qr.png"/>
                                        <span>Scan to Apply</span>
                                    </div>
                                }
                                <div className="lp-buttons-stacked">
                                    {propertyListing.video_url && <a href={propertyListing.video_url} className="lp-button-link-wrap" target="_blank">
                                        <i className="far fa-play-circle"></i>
                                        <span>Property<br/>Video</span>
                                    </a>}
                                    <a className="lp-button-link-wrap" onClick={()=> focusOnApplication()}>
                                        <i className="fas fa-file-edit"></i>
                                        <span>Apply Now</span>
                                    </a>
                                </div>
                            </div>

                            <div className="lp-info">
                                <h2>{unitListing.name}<span>{insightUtils.propertyTypePretty(property.property_type)} in {unit.city}, {unit.state} {unit.zip}</span></h2>
                                <div className="lp-info-stats">
                                    <div className="lp-info-stat"><span>Monthly Rent:</span> {insightUtils.numberToCurrency(unitListing.rent)}</div>
                                    <div className="lp-info-stat"><span>Beds:</span> {insightUtils.getBedsLabel(unit.beds)}</div>
                                    <div className="lp-info-stat"><span>Baths:</span> {unit.baths}</div>
                                    <div className="lp-info-stat"><span>Sq Ft:</span> {insightUtils.numberWithCommas(unit.square_feet)}</div>
                                    <div className="lp-info-stat">
                                        {propertyListing.pets_allowed == "both" && <><i className="fas fa-check-circle pets-yes"></i> Cats & Dogs Allowed</>}
                                        {propertyListing.pets_allowed == "cats" && <><i className="fas fa-check-circle pets-yes"></i> Cats Allowed</>}
                                        {propertyListing.pets_allowed == "dogs" && <><i className="fas fa-check-circle pets-yes"></i> Dogs Allowed</>}
                                        {(!propertyListing.pets_allowed || propertyListing.pets_allowed == "no_pets") && <><i className="fas fa-check-circle pets-no"></i> No Pets Allowed</>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="listing-fraud-notice">
                            <a onClick={() => setShowFraudNotice(true)}>Fraud Notice</a>
                        </div>

                        <div className="listing-preview-details">

                            <div className="lp-details-column lp-details-info">

                                <h3>{property.name}</h3>
                                {floorPlans && <div className="form-row">
                                    <div className="form-item">
                                        <label>Unit&nbsp;/&nbsp;Floor&nbsp;Plan<span>*</span></label>
                                        <select className="form-select form-select-white" defaultValue={unitListing.hash_id} onChange={(e) => handleUnitListingChange(e)}>
                                            {unitListings.filter((ul) => inPreviewMode || ul.status == constants.unit_listing_statuses.active.key).map((ul, i) => (<option key={i} value={ul.hash_id}>{ul.name}</option>))}
                                        </select>
                                    </div>
                                </div>}

                                <div className="lp-details-row">
                                    {unitListing.available_on && <div className="lp-details-block"><span>Available</span> {insightUtils.formatDate(unitListing.available_on)}</div>}
                                    {unitListing.lease_term && <div className="lp-details-block"><span>Lease Term</span> {insightUtils.getLabel(unitListing.lease_term, constants.lease_term_options)}</div>}
                                    {unitListing.rent && <div className="lp-details-block"><span>Rent</span> {insightUtils.numberToCurrency(unitListing.rent)}</div>}
                                    {unitListing.security_deposit && <div className="lp-details-block"><span>Security Deposit</span> {insightUtils.numberToCurrency(unitListing.security_deposit)}</div>}
                                </div>

                                <div className="lp-details-block lp-details-block-left"><span>Description</span>
                                    {unitListing.description && <p>{unitListing.description}</p>}
                                    <p>{propertyListing.description}</p>
                                </div>

                                {propertyListing.rent_special_title && <div className="lp-details-block lp-details-block-left"><span>Rent Specials</span>
                                    <p>
                                        {propertyListing.rent_special_title}
                                        {propertyListing.rent_special_end_on && <span>&nbsp;Ends on {insightUtils.formatDate(propertyListing.rent_special_end_on)}</span>}
                                    </p>
                                </div>}

                                {unitListing.feature_amenities && <div className="lp-details-block lp-details-block-left"><span>Amenities</span>
                                    <p>{insightUtils.getLabels(unitListing.feature_amenities, constants.unit_feature_amenity_options)}</p>
                                </div>}

                                {unitListing.kitchen_amenities && <div className="lp-details-block lp-details-block-left"><span>Kitchen</span>
                                    <p>{insightUtils.getLabels(unitListing.kitchen_amenities, constants.unit_kitchen_amenity_options)}</p>
                                </div>}

                                {unitListing.outdoor_amenities && <div className="lp-details-block lp-details-block-left"><span>Outdoor</span>
                                    <p>{insightUtils.getLabels(unitListing.outdoor_amenities, constants.unit_outdoor_amenity_options)}</p>
                                </div>}

                                {unitListing.living_space_amenities && <div className="lp-details-block lp-details-block-left"><span>Living Space</span>
                                    <p>{insightUtils.getLabels(unitListing.living_space_amenities, constants.unit_living_space_amenity_options)}</p>
                                </div>}
                                
                                {propertyListing.amenities && <div className="lp-details-block lp-details-block-left"><span>Property Amenities</span>
                                    <p>{insightUtils.getLabels(propertyListing.amenities, constants.amenity_options)}</p>
                                </div>}

                                {propertyListing.included_utilities && <div className="lp-details-block lp-details-block-left"><span>Included Utilities</span>
                                    <p>{insightUtils.getLabels(propertyListing.included_utilities, constants.utility_options)}</p>
                                </div>}

                                {false &&
                                    <div className="lp-details-block lp-details-block-left"><span>Screening Policies</span>
                                        <p>Credit and Criminal checks are required for each lease holder.</p>
                                    </div>
                                }

                                {propertyListing.rental_license_number &&
                                    <p><strong>Rental License: </strong> {propertyListing.rental_license_number} {propertyListing.rental_license_expires_on && <>&nbsp;&nbsp;&nbsp;<strong>Expires:</strong> {insightUtils.formatDate(propertyListing.rental_license_expires_on)}</>}</p>
                                }
                            </div>

                            <UnitListingMessagingView company={company} propertyListing={propertyListing} unitListings={unitListings} unitListing={unitListing} unit={unit} applyMode={applyMode} setApplyMode={setApplyMode} />

                        </div>
                    </>
                    :
                    <>
                        <div className="title-block">
                            <h1>Listing unavailable</h1>
                            <div className="listing-preview-details">
                                <UnitListingMessagingView hideApplyOption={true} company={company} propertyListing={propertyListing} unitListings={unitListings} unitListing={unitListing} unit={unit} applyMode={applyMode} setApplyMode={setApplyMode} />
                            </div>
                        </div>
                    </>
                    }
                </>}

            </div> }

        </>

    )}

export default UnitListingShowPage;

