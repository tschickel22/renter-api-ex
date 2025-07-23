import React, {useEffect, useRef, useState} from 'react';

import {useSelector} from "react-redux";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import Modal from "../../shared/Modal";
import insightRoutes from "../../../app/insightRoutes";
import {Field, FieldArray, Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";

import insightUtils from "../../../app/insightUtils";
import BasicDropdown from "../../shared/BasicDropdown";
import ResidentCompactFormRow from "./ResidentCompactFormRow";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {saveLease} from "../../../slices/leaseSlice";
import store from "../../../app/store";
import ScreeningPackageBlock from "./ScreeningPackageBlock";
import {loadLeaseResident} from "../../../slices/leaseResidentSlice";
import PaymentMethodForm from "../../shared/PaymentMethodForm";
import BedsDropdown from "../companies/BedsDropdown";
import BathsDropdown from "../companies/BathsDropdown";
import DatePicker from "react-datepicker";
import {saveCompanyPaymentMethod} from "../../../slices/paymentSlice";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const ScreeningNewPage = ({mode}) => {
    let params = useParams()
    let navigate = useNavigate()
    const { state } = useLocation()

    const { properties, constants, settings, currentCompany, leadSources } = useSelector((state) => state.company)
    const allPaymentRepsonsibilityOptions = [{id: "property", name: "Me"}, {id: "resident", name: "Renter"}]

    const [lease, setLease] = useState(null)
    const [units, setUnits] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [sendInvite, setSendInvite] = useState(false)
    const [inviteSent, setInviteSent] = useState(false)
    const [currentSettings, setCurrentSettings] = useState(null)
    const [screeningPackages, setScreeningPackages] = useState([])
    const [screeningPaymentResponsibility, setScreeningPaymentResponsibility] = useState(null)
    const [paymentResponsibilityOptions, setPaymentResponsibilityOptions] = useState(allPaymentRepsonsibilityOptions)

    let formRef = useRef()

    useEffect(async () => {

        if (settings) setCurrentSettings(insightUtils.getSettings(settings))

        if (params.propertyId) {
            updateSelectedProperty(params.propertyId)
        }

        if (properties && !lease) {
            if (params.leaseResidentId) {
                const result = await store.dispatch(loadLeaseResident({leaseResidentId: params.leaseResidentId})).unwrap()
                const response = result.data

                if (response.success) {
                    let newLease = response.lease

                    newLease.primary_resident.lead_info = response.lease_resident.lead_info

                    setLease(newLease)
                    updateSelectedProperty(response.lease.property_id)

                    // We should not stay here if the lease resident has already begun their application
                    if (response.lease.primary_resident && response.lease.primary_resident.current_step != constants.lease_resident_steps.lead.key) {
                        navigate(insightRoutes.applicationEdit(response.lease.primary_resident.hash_id))
                    }
                }
                else if (response.errors) {
                    setBaseErrorMessage(response.errors)
                }
            }
            else {
                setLease({screening_payment_method_id: "", property_id: params.propertyId || "", unit_id: params.unitId || "", rent: "", security_deposit: "", lease_term: "", lease_term_other: "", screening_payment_responsibility: "", screening_payment_method: Object.assign(insightUtils.emptyPaymentMethod(), {method: "credit_card"}), primary_resident: {screening_package_id: 1, lead_info: insightUtils.emptyLeadInfo(), resident: {first_name: "", last_name: "", email: "", phone_number: ""}}})
            }
        }

    }, [properties])

    useEffect( () => {

        let newScreeningPackages = null

        if (currentSettings) {
            if (currentSettings.screening_who_pays == 'property' && currentSettings.default_screening_package_id) {
                newScreeningPackages = currentCompany.screening_packages.filter((screeningPackage) => screeningPackage.id == currentSettings.default_screening_package_id)

                if (formRef && formRef.current) {
                    formRef.current.setFieldValue("primary_resident.screening_package_id", currentSettings.default_screening_package_id)
                }
            }
            else if (currentSettings.screening_who_pays == 'resident') {
                newScreeningPackages = currentCompany.screening_packages.filter((screeningPackage) => screeningPackage.id == 1)
            }
            else {
                newScreeningPackages = currentCompany.screening_packages.filter((screeningPackage) => (screeningPaymentResponsibility != "resident" || screeningPackage.id == 1))
            }

            setScreeningPackages(newScreeningPackages)

            if (!currentSettings.screening_who_pays || currentSettings.screening_who_pays == "ask") {
                setPaymentResponsibilityOptions(allPaymentRepsonsibilityOptions)
            }
            else {
                setPaymentResponsibilityOptions(allPaymentRepsonsibilityOptions.filter((option)=> option.id == currentSettings.screening_who_pays))
            }

            const newResponsibility = (!currentSettings.screening_who_pays || currentSettings.screening_who_pays == "ask") ? "property" : currentSettings.screening_who_pays

            if (formRef && formRef.current && !formRef.current.values.screening_payment_responsibility) {
                formRef.current.setFieldValue("screening_payment_responsibility", newResponsibility)
                setScreeningPaymentResponsibility(newResponsibility)
            }
        }

    }, [currentCompany.screening_packages, screeningPaymentResponsibility, currentSettings])

    function handlePropertySelected(e) {
        if (e.target.value == "new") {
            navigate(insightRoutes.propertyNew()+"?return_url="+insightRoutes.screeningNew())
        }
        else {
            updateSelectedProperty(e.target.value)
        }
    }

    function handleUnitSelected(e, propertyId) {
        if (e.target.value == "new") {
            navigate(insightRoutes.unitNew(propertyId)+"?return_url="+insightRoutes.screeningNew())
        }
        else {
            updateSelectedUnit(e.target.value)
        }
    }

    function updateSelectedProperty(propertyId) {
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))

        if (property) {
            const newSettings = insightUtils.getSettings(settings, property.id)
            setCurrentSettings(newSettings)
            setUnits(property.units)

            // Ensure this property is set up for screening. If not, let the user know
            if (newSettings?.application_require_screening) {
                if (!property.external_screening_id || !property.screening_attestation) {
                    store.dispatch(displayAlertMessage({message: "You must complete the screening activation for this property", linkText: "Complete Screening Activation", url: insightRoutes.propertyScreeningAttestation(property.id), hideCloseOption: true, navigateState: {return_url: location.pathname + (window.location.search || '')}}))
                }
            }
        }
    }

    function updateSelectedUnit(unitId) {
        const unit = (units || []).find((unit) => unit.id == parseInt(unitId))

        if (unit) {
            if (formRef && formRef.current) {
                formRef.current.setFieldValue("primary_resident.lead_info.beds", unit.beds)
                formRef.current.setFieldValue("primary_resident.lead_info.baths", unit.baths)
                formRef.current.setFieldValue("primary_resident.lead_info.square_feet", unit.square_feet)
            }
        }
    }

    function addNewResident(arrayHelpers) {
        arrayHelpers.push(insightUtils.emptyLeaseResident())
    }

    function closeModal() {
        if (state && state.from) {
            if (state.from == "applicants") {
                navigate(insightRoutes.applicationList())
                return;
            }
            else if (state.from == "units") {
                navigate(insightRoutes.unitList())
                return;
            }
            else if (state.from == "screenings") {
                navigate(insightRoutes.screeningList())
                return;
            }
        }

        navigate(insightRoutes.propertyList())
    }

    return (
        <>
            {currentSettings && currentCompany && properties && lease &&
                <Modal closeModal={closeModal} preventClickOutsideToClose={true}>
                    <div className="section" id="ll-section-resident-screening">

                        <div className="title-block">
                            {mode == "leads" ?
                                <h2>{params.leaseResidentId ? "Edit Lead" : "Create New Lead"}</h2>
                                :
                                <h2>Create New {currentCompany.external_screening_id && currentSettings.application_require_screening ? "Screening" : "Application"}</h2>
                            }
                        </div>

                        <div className="section-table-wrap">

                            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                            {!inviteSent && <>
                                {mode == "leads" ?
                                    <p className="text-center">Use this form to create a lead.</p>
                                    :
                                    <p className="text-center">Use this form to create a single application for a property. You can include multiple applicants (i.e., roommates) as well as cosigners. To create an application for separate individuals applying for the property, you can create another application after this one.</p>
                                }

                                <Formik
                                    initialValues={lease}
                                    innerRef={formRef}
                                    onSubmit={async (values, { setSubmitting, setErrors, setFieldValue }) => {

                                        /*
                                           SAVE LEASE
                                         */

                                        setBaseErrorMessage("")

                                        const currentStep = (mode == "leads" ? constants.lease_resident_steps.lead.key : constants.lease_resident_steps.invitation.key)

                                        values.primary_resident.current_step = currentStep

                                        if (values.secondary_residents) {
                                            values.secondary_residents.forEach((secondaryResident) => {
                                                secondaryResident.current_step = currentStep
                                            })
                                        }

                                        // If there is only one screening package, make sure it's the selected on
                                        if (screeningPackages && screeningPackages.length == 1) {
                                            values.primary_resident.screening_package_id = screeningPackages[0].id
                                        }

                                        // Make sure the secondary residents have the same screening package selected
                                        if (values.secondary_residents) {
                                            values.secondary_residents.forEach((secondaryResident) => {
                                                secondaryResident.screening_package_id = values.primary_resident.screening_package_id
                                            })
                                        }

                                        values.primary_resident.type = "LeaseResidentPrimary"
                                        values.lease_action = (mode == "leads" ? constants.lease_actions.adding_lead.key : (sendInvite ? constants.lease_actions.invite_to_screening.key : constants.lease_actions.begin_application.key))

                                        if (values.screening_payment_method_id && values.screening_payment_method_id.toString().indexOf("new_") >= 0 && values.screening_payment_method) {
                                            values.screening_payment_method.method = values.screening_payment_method_id.replace("new_", "")
                                            values.screening_payment_method.billing_agreement = true
                                            const results = await store.dispatch(saveCompanyPaymentMethod({companyPaymentMethod: values.screening_payment_method})).unwrap()
                                            const response = results.data

                                            console.log(response)

                                            if (response.success) {
                                                values.screening_payment_method_id = response.company_payment_method.id
                                                values.screening_payment_method = null

                                                setFieldValue('screening_payment_method_id', response.company_payment_method.id)
                                            }
                                            else if (response.errors) {
                                                setErrors(response.errors)

                                                if (response.errors.base) {
                                                    setBaseErrorMessage(response.errors.base)
                                                }

                                                insightUtils.scrollTo('errors')

                                                return
                                            }
                                        }

                                        const results = await store.dispatch(saveLease({lease: values})).unwrap()
                                        const response = results.data
                                        console.log(response)

                                        if (response.success) {
                                            if (mode == "leads") {
                                                if (params.leaseResidentId) {
                                                    navigate(insightRoutes.leaseShow(response.lease.hash_id))
                                                }
                                                else {
                                                    navigate(insightRoutes.leadList(response.lease.property_id))
                                                }

                                            }
                                            else {
                                                if (sendInvite) {
                                                    setInviteSent(true)
                                                }
                                                else {
                                                    navigate(insightRoutes.applicationEdit(response.lease.primary_resident.hash_id))
                                                }
                                            }
                                        }
                                        else if (response.errors) {
                                            setErrors(response.errors)

                                            if (response.errors.base) {
                                                setBaseErrorMessage(response.errors.base)
                                            }

                                            insightUtils.scrollTo('errors')
                                        }


                                        setSubmitting(false);

                                    }}>
                                    {({ isSubmitting,values,setFieldValue, setSubmitting, handleSubmit}) => (
                                        <Form>

                                            {mode == "leads" && <>
                                                <div className="form-row"><h2>Applicant Info</h2></div>
                                                <ResidentCompactFormRow residentType="primary_resident" resident={values.primary_resident} mode="compact" index={0} />

                                                <FieldArray
                                                    name="secondary_residents"
                                                    render={arrayHelpers => (
                                                        <>
                                                            {values.secondary_residents && values.secondary_residents.map((secondary_resident, index) => (
                                                                <ResidentCompactFormRow key={index} index={index} arrayHelpers={arrayHelpers} residentType={"secondary_residents." + index} resident={secondary_resident} />
                                                            ))}

                                                            <div className="form-row">
                                                                <div className="form-item">
                                                                    <a onClick={() => addNewResident(arrayHelpers)}>Add Applicant</a>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                />
                                            </>}

                                            {mode == "leads" && <div className="form-row"><h2>Desired Unit Info</h2></div>}

                                            <div className="form-row">
                                                <FormItem label="Property" name="property_id" optional={mode == "leads"} >
                                                    <BasicDropdown name="property_id" blankText="-- Select Property --" options={properties.filter((p) => p.units && p.units.length > 0).concat([{id: "new", name: " Add New Property..."}])} onChange={(e) => {handlePropertySelected(e)}} />
                                                </FormItem>
                                                <FormItem label="Unit" name="unit_id" optional={mode == "leads"} >
                                                    {units ?
                                                        <BasicDropdown name={`unit_id`} blankText="-- Select Unit --" options={units.concat([{id: "new", name: " Add New Unit..."}])} onChange={(e) => {handleUnitSelected(e, values.property_id)}} />
                                                        :
                                                        <select className="form-select"><option>Please select a property</option></select>
                                                    }
                                                </FormItem>
                                            </div>

                                            {mode == "leads" && <>

                                                <div className="form-row">
                                                    <FormItem label="# of Beds" name="primary_resident.lead_info.beds" optional={true}>
                                                        <BedsDropdown name="primary_resident.lead_info.beds" />
                                                    </FormItem>
                                                    <FormItem label="# of Baths" name="primary_resident.lead_info.baths" optional={true}>
                                                        <BathsDropdown name="primary_resident.lead_info.baths" />
                                                    </FormItem>
                                                    <FormItem label="Square Feet" name="primary_resident.lead_info.square_feet" optional={true} />
                                                </div>

                                                <div className="form-row">
                                                    <FormItem label="Lead Source" name="primary_resident.lead_info.lead_source_id" optional={true}>
                                                        <BasicDropdown name="primary_resident.lead_info.lead_source_id" options={leadSources} />
                                                    </FormItem>
                                                    <FormItem label="Desired Move-in Date" name="primary_resident.lead_info.move_in_on" optional={true}>
                                                        <DatePicker name="primary_resident.lead_info.move_in_on" className="form-input form-input-white" selected={values.primary_resident.lead_info && insightUtils.parseDate(values.primary_resident.lead_info.move_in_on)} onChange={(date) => setFieldValue("primary_resident.lead_info.move_in_on", date)} />
                                                    </FormItem>
                                                    <FormItem label="Desired Lease Term" name="lease_term" optional={true}>
                                                        <BasicDropdown name="lease_term" options={constants.lease_term_options} />
                                                    </FormItem>
                                                    <FormItem label="Desired Rent" name="rent" optional={true} />
                                                </div>

                                                <div className="form-row"><h2>Notes</h2></div>
                                                <div className="form-row">
                                                    <FormItem label="" name={"primary_resident.lead_info.notes"} optional={true}>
                                                        <Field component="textarea" rows={4} name={"primary_resident.lead_info.notes"} className="form-input form-input-white" placeholder=""/>
                                                    </FormItem>
                                                </div>
                                            </>}

                                            {mode != "leads" &&
                                                <>
                                                <div className="form-row">
                                                    <FormItem label="Rent" name="rent" optional={mode == "leads"} />
                                                    <FormItem label="Security Deposit" name="security_deposit" optional={mode == "leads"} />
                                                    <FormItem label="Lease Term" name="lease_term" optional={mode == "leads"} >
                                                        <BasicDropdown name="lease_term" options={constants.lease_term_options} />
                                                    </FormItem>

                                                    {values.lease_term == "other" && <FormItem label="Enter Months" name="lease_term_other" />}
                                                </div>

                                                <ResidentCompactFormRow residentType="primary_resident" resident={values.primary_resident} mode="compact" index={0} />

                                                <FieldArray
                                                    name="secondary_residents"
                                                    render={arrayHelpers => (
                                                        <>
                                                            {values.secondary_residents && values.secondary_residents.map((secondary_resident, index) => (
                                                                <ResidentCompactFormRow key={index} index={index} arrayHelpers={arrayHelpers} residentType={"secondary_residents." + index} resident={secondary_resident} />
                                                            ))}

                                                            <div className="form-row">
                                                                <div className="form-item">
                                                                    <a onClick={() => addNewResident(arrayHelpers)}>Add Applicant</a>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                />

                                                {values.property_id && currentSettings.application_require_screening && <div className="form-row form-center">
                                                    <FormItem label="Who is Going to Pay?" name="screening_payment_responsibility">
                                                        <div style={{display: "flex", justifyContent: "center", marginTop: "10px"}}>
                                                            <RadioButtonGroup name="screening_payment_responsibility" options={paymentResponsibilityOptions} handleOptionChange={(newValue) => {setScreeningPaymentResponsibility(newValue); if (newValue == "resident") setFieldValue("primary_resident.screening_package_id", 1)}} direction="row" />
                                                        </div>
                                                    </FormItem>
                                                </div>}


                                                {values.property_id && currentSettings.application_require_screening && <div className="choose-package">

                                                    <h2>Choose Your Package</h2>

                                                    <div className="package-choices">
                                                        {screeningPackages.map((screeningPackage, i) => (
                                                            <ScreeningPackageBlock key={i} screeningPackage={screeningPackage} isActive={values.primary_resident.screening_package_id == screeningPackage.id} handlePackageSelection={(e) => setFieldValue("primary_resident.screening_package_id", screeningPackage.id)} />
                                                        ))}
                                                    </div>

                                                    <div className="disclaimer">
                                                        <sup>*</sup>The National Criminal Report is subject to federal, state and local laws which may limit or restrict TransUnion's ability to return some records. Criminal results not available to return for Delaware, Hawaii, Kentucky, Massachusetts, South Dakota, Wyoming, and New Jersey.
                                                    </div>
                                                    <div className="disclaimer">
                                                        <sup>**</sup> The National Eviction Report is subject to federal, state and local laws which may limit or restrict TransUnion's ability to return some records. Certain jurisdictions may limit what eviction related records are eligible for return. Eviction related results are not available for New York and Renter Insight Plus Package will be the default selection.
                                                    </div>
                                                </div>}

                                                {currentSettings.application_require_screening && values.screening_payment_responsibility == "property" &&
                                                    <PaymentMethodForm existingPaymentMethods={currentCompany.payment_methods} excludeDebitCards={true} excludeCash={true} paymentMethodIdName="screening_payment_method_id" prefix="screening_payment_method." />
                                                }
                                            </>}

                                            <div className="form-nav" style={{marginBottom: "30px"}}>
                                                {mode != "leads" &&
                                                <button onClick={(e) => {setSendInvite(false); setSubmitting(true); handleSubmit(e)}} className="btn btn-gray" type="submit" disabled={isSubmitting}>
                                                    {!isSubmitting && <span>Fill Out Application</span>}
                                                    {isSubmitting && <span>Sending...</span>}
                                                </button>
                                                }
                                                <button onClick={(e) => { setSendInvite(true); setSubmitting(true); handleSubmit(e)}} className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                    {!isSubmitting && <span>{mode == "leads" ? "Save Lead" : (currentCompany.external_screening_id && currentSettings.application_require_screening ? "Send Screening Request" : "Send Application Request")}</span>}
                                                    {isSubmitting && <span>Sending...</span>}
                                                </button>
                                            </div>

                                        </Form>
                                    )}
                                </Formik>
                            </>}

                            {inviteSent && <div className="add-property-wrap">
                                <p className="text-center">The request has been delivered.</p>
                                <a onClick={() => navigate(insightRoutes.screeningList())} className="btn btn-red">Close</a>
                            </div>
                            }
                        </div>

                    </div>
                </Modal>
            }
        </>

    )}

export default ScreeningNewPage;

