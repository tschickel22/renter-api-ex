import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'

import {loadMaintenanceRequest, saveMaintenanceRequest} from "../../../slices/maintenanceRequestSlice";
import store from "../../../app/store";

import {Field, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import AddPhotoBox from "../../shared/AddPhotoBox";
import InsightDatePicker from "../../shared/InsightDatePicker";
import CommentsView from "../../landlord/communications/CommentsView";

const RenterMaintenanceRequestEditPage = ({}) => {

    let navigate = useNavigate();
    let params = useParams();

    const { currentUser }= useSelector((state) => state.user)
    const { constants, properties, items } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [maintenanceRequest, setMaintenanceRequest] = useState(null)
    const [batchNumber, setBatchNumber] = useState(null)

    const [mode, setMode] = useState()

    useEffect(async() => {
        setBatchNumber(+new Date())

        if (parseInt(params.maintenanceRequestId) > 0) {
            const results = await store.dispatch(loadMaintenanceRequest({maintenanceRequestId: params.maintenanceRequestId})).unwrap()
            let newMaintenanceRequest = Object.assign({}, results.data.maintenance_request)
            if (newMaintenanceRequest.preferred_resolution_on) newMaintenanceRequest.preferred_resolution_on = insightUtils.parseDate(newMaintenanceRequest.preferred_resolution_on)
            setMaintenanceRequest(newMaintenanceRequest)
        }
        else {
            setMaintenanceRequest(insightUtils.emptyMaintenanceRequest())
        }
    }, [])


    useEffect(() => {
        if (maintenanceRequest) {
            if (maintenanceRequest.hash_id) {
                if (maintenanceRequest.submitted_by && maintenanceRequest.submitted_by.id == currentUser.id) {
                    setMode("edit")
                }
                else {
                    setMode("view")
                }
            }
            else {
                setMode("new")
            }
        }
    }, [maintenanceRequest])

    return (
        <div className="section">
            {properties && maintenanceRequest && mode && <>
                <Formik
                    initialValues={maintenanceRequest}
                    onSubmit={async (values, { setSubmitting, setErrors }) => {
                        setBaseErrorMessage("")
                        values.photos_batch_number = batchNumber

                        const results = await store.dispatch(saveMaintenanceRequest({maintenanceRequest: values})).unwrap()
                        const response = results.data

                        console.log(response)
                        setSubmitting(false);

                        if (response.success) {
                            navigate(insightRoutes.renterPortal())
                        }
                        else if (response.errors) {
                            setErrors(response.errors)

                            if (response.errors.base) {
                                setBaseErrorMessage(response.errors.base.join(", "))
                            }

                            insightUtils.scrollTo('errors')
                        }

                    }}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <i className="fad fa-tools section-icon"></i>

                            <div className="maint-new-request">
                                <div className="title-block">
                                    <h1><span>{mode == "new" ? "Add Maintenance Ticket" : (maintenanceRequest.title || "Edit Ticket")}</span></h1>

                                    {mode != "new" && maintenanceRequest.unit &&
                                        <div className="subtitle">{maintenanceRequest.unit.street_and_unit}, {maintenanceRequest.unit.city}, {maintenanceRequest.unit.state} {maintenanceRequest.unit.zip}</div>
                                    }
                                </div>

                                {mode != "new" && <div className="info-status-wrap">
                                    <div className="info-status">Status: <span className={maintenanceRequest.status == constants.maintenance_request_statuses.open.key ? "info-positive" : "info-negative"}>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}</span></div>
                                </div>}

                                {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                <div className="skinny-column maint-request-form">
                                    <div className="smallspacer"></div>

                                    {mode == "view" ?
                                        <>
                                            <p>The ticket below was submitted on <em>{insightUtils.formatDate(maintenanceRequest.submitted_on)}</em> by {maintenanceRequest.submitted_by.name}.</p>
                                        </>
                                        :
                                        <>

                                            <div className="form-row">
                                                <FormItem label="Ticket Title" name="title" />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-item">
                                                    <FormItem label="Description" name="description">
                                                        <Field component="textarea" rows={4} name="description" className="form-input form-input-white" placeholder=""/>
                                                    </FormItem>
                                                </div>
                                            </div>
                                        </>
                                    }

                                    <div className="form-row">
                                        <FormItem label="Urgency" name="urgency" optional={true}>
                                            <BasicDropdown name="urgency" options={constants.maintenance_request_urgencies} />
                                        </FormItem>

                                        <FormItem label="Category" name="maintenance_request_category_id" optional={true}>
                                            <BasicDropdown name="maintenance_request_category_id" options={items.filter((item) => (item.type == "MaintenanceRequestCategory"))} />
                                        </FormItem>

                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Preferred Day to Resolve" name="preferred_resolution_on" optional={true}>
                                            <InsightDatePicker name="preferred_resolution_on" selected={values.preferred_resolution_on} onChange={(date) => setFieldValue("preferred_resolution_on", date)} />
                                            {insightUtils.isResident(currentUser) &&
                                                <div className="text-muted text-left text-small" style={{marginTop: "5px"}}>Management will contact you with day & time of repair</div>
                                            }
                                        </FormItem>

                                        <FormItem label="Preferred Time to Resolve" name="preferred_resolution_time" optional={true}>
                                            <BasicDropdown name="preferred_resolution_time" options={constants.maintenance_request_resolution_times} />
                                        </FormItem>
                                    </div>

                                    <div className="form-row">
                                        <FormItem label="Do we have permission to enter the unit?" name="permission_to_enter" optional={true}>
                                            <RadioButtonGroup name="permission_to_enter" options={insightUtils.yesNoOptions()} direction="row" />
                                        </FormItem>

                                        <div className="form-item"></div>
                                    </div>

                                    {values.permission_to_enter && values.permission_to_enter.toString() == "true" &&

                                        <div className="form-row">
                                            <FormItem label="Do you have pets in the unit?" name="pets_in_unit">
                                                <RadioButtonGroup name="pets_in_unit" options={insightUtils.yesNoOptions()} direction="row" />
                                            </FormItem>
                                            {values.pets_in_unit && values.pets_in_unit.toString() == "true" &&
                                                <FormItem label="Please describe your pets" name="pet_description" />
                                            }
                                        </div>
                                    }

                                    {mode == "view" &&
                                        <>

                                            <ul className="summary">
                                                {maintenanceRequest.resident && <>
                                                    <li><strong>Tenant Phone:</strong> {maintenanceRequest.resident.phone_number}</li>
                                                </>}
                                                {maintenanceRequest.unit && <>
                                                    <li><strong>Location:</strong> {maintenanceRequest.unit.full_address}</li>
                                                </>}
                                              <li><strong>Issue Description:</strong> {maintenanceRequest.title} {maintenanceRequest.description && " - " + maintenanceRequest.description}</li>
                                              <li><strong>Category:</strong> {insightUtils.getLabel(maintenanceRequest.maintenance_request_category_id, items.filter((item) => (item.type == "MaintenanceRequestCategory")))}</li>
                                                {maintenanceRequest.scheduled_on && <>
                                                <li><strong>Preferred Day to Resolve:</strong> {insightUtils.formatDate(maintenanceRequest.scheduled_on)}</li>
                                                </>}
                                              <li><strong>Permission to Enter:</strong> {maintenanceRequest.permission_to_enter ? "Yes" : "No"}</li>
                                              <li><strong>Pets in Unit:</strong> {maintenanceRequest.pets_in_unit ? "Yes" : "No"}</li>
                                                {maintenanceRequest.pets_in_unit &&
                                                <li><strong>Pet Description:</strong> {maintenanceRequest.pet_description}</li>
                                                }
                                            </ul>
                                        </>
                                    }

                                    <AddPhotoBox apiPath={"/api/internal/maintenance_requests/" + (maintenanceRequest.hash_id ? maintenanceRequest.hash_id : "new")} batchNumber={batchNumber} />

                                    {false && <div className="maint-tenant-list">
                                        <div className=""><i className="fas fa-check-square btn-maint-notify-tenants btn-checkbox active"></i> Send notifications to all tenants with contact information on file:</div>
                                        <ul>
                                            <li>Billy Bob Thornton</li>
                                            <li>Miles Davis</li>
                                            <li>Billy Jean</li>
                                            <li>Dane Cook</li>
                                        </ul>
                                    </div>}

                                    <div className="form-nav">
                                        <a onClick={() => navigate(insightRoutes.renterPortal())} className="btn btn-gray" disabled={isSubmitting}>
                                            <span>Cancel</span>
                                        </a>
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}>
                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>

                <a name="comments"></a>
                {maintenanceRequest.id && <CommentsView title="Conversation with Property" type="CommunicationNotePublic" subType="conversation_with_resident" relatedObjectType="MaintenanceRequest" relatedObjectHashId={maintenanceRequest.hash_id} extraClassName="skinny-column" containerClassName="main-container" />}
            </>}
        </div>
    )}

export default RenterMaintenanceRequestEditPage;

