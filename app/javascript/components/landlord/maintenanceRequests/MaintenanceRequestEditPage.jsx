import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom'

import {loadMaintenanceRequest, loadMaintenanceRequestAssignees, loadMaintenanceRequestPrintView, saveMaintenanceRequest} from "../../../slices/maintenanceRequestSlice";
import store from "../../../app/store";

import {Field, Form, Formik} from "formik";

import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import ToggleSwitch from "../../shared/ToggleSwitch";
import InsightDatePicker from "../../shared/InsightDatePicker";
import AddPhotoBox from "../../shared/AddPhotoBox";
import Modal from "../../shared/Modal";

import ToolTip from "../../shared/ToolTip";
import CommentsView from "../communications/CommentsView";
import {markConversationAsRead} from "../../../slices/communicationSlice";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import CheckBoxGroup from "../../shared/CheckBoxGroup";

const MaintenanceRequestEditPage = ({}) => {

    let navigate = useNavigate();
    let params = useParams();

    const { currentUser }= useSelector((state) => state.user)
    const { constants, settings, properties, items } = useSelector((state) => state.company)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [maintenanceRequest, setMaintenanceRequest] = useState(null)
    const [currentSettings, setCurrentSettings] = useState(null)
    const [units, setUnits] = useState(null)
    const [assignees, setAssignees] = useState(null)
    const [batchNumber, setBatchNumber] = useState(null)
    const [scrolledPastTop, setScrolledPastTop] = useState(false)
    const [printViewContent, setPrintViewContent] = useState(null)
    const [mode, setMode] = useState()
    const [statusAfterSave, setStatusAfterSave] = useState(true)
    const [notificationOptions, setNotificationOptions] = useState(null)
    const [notificationTooltip, setNotificationTooltip] = useState(null)


    useEffect(async() => {
        setBatchNumber(+new Date())

        if (currentUser) {
            const assignee_results = await store.dispatch(loadMaintenanceRequestAssignees()).unwrap()
            setAssignees(assignee_results.data.assignees)
        }
        else {
            setAssignees([])
        }

        if (parseInt(params.maintenanceRequestId) > 0) {
            const results = await store.dispatch(loadMaintenanceRequest({maintenanceRequestId: params.maintenanceRequestId, editMode: params.editMode})).unwrap()
            updateSelectedProperty(results.data.maintenance_request.property_id)
            let newMaintenanceRequest = Object.assign({}, results.data.maintenance_request)
            if (newMaintenanceRequest.scheduled_on) newMaintenanceRequest.scheduled_on = insightUtils.parseDate(newMaintenanceRequest.scheduled_on)
            setMaintenanceRequest(newMaintenanceRequest)
        }
        else {
            setMaintenanceRequest(insightUtils.emptyMaintenanceRequest())
        }
    }, [])

    useEffect(() => {
        const mainContainer = document.querySelector(".main-container");
        mainContainer.addEventListener("scroll", listenToScroll);
        return () =>
            mainContainer.removeEventListener("scroll", listenToScroll);
    }, [])

    const listenToScroll = () => {
        const mainContainer = document.querySelector(".main-container");
        const maintenanceRequestForm = document.querySelector(".maint-request-form")

        if (maintenanceRequestForm) {
            const scrollPosition = mainContainer.scrollTop;
            const heightToHideFrom = maintenanceRequestForm.offsetTop;

            if (scrollPosition > heightToHideFrom) {
                setScrolledPastTop(true);
            }
            else {
                setScrolledPastTop(false);
            }
        }
    };


    useEffect(() => {
        if (maintenanceRequest) {
            if (maintenanceRequest.hash_id) {
                if (currentUser) {
                    if (currentUser.maintenance_requests_edit && maintenanceRequest.submitted_by && maintenanceRequest.submitted_by.id == currentUser.id) {
                        setMode("edit")
                    }
                    else {
                        setMode("view")
                    }

                    store.dispatch(markConversationAsRead({relatedObjectType: "MaintenanceRequest", relatedObjectHashId: maintenanceRequest.hash_id}))
                }
                else {
                    setMode(params.editMode)
                }
            }
            else {
                setMode("new")
            }
        }
    }, [maintenanceRequest])

    function updateSelectedProperty(propertyId) {
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))

        if (property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
            setUnits(property.units)
        }
    }

    function updateSelectedAssignee(assigneeId) {
        if (assigneeId != maintenanceRequest.assigned_to_type_and_id) {
            const assignee = assignees.find((a) => a.id == assigneeId)
            let notificationOptions = []
            let profilePiecesMissing = []

            if (assignee && assignee.email) {
                notificationOptions.push({id: "email", name: "Email Ticket"})
            }
            else {
                profilePiecesMissing.push("an email address")
            }

            if (assignee && assignee.phone_number) {
                notificationOptions.push({id: "text", name: "Text Ticket"})
            }
            else {
                profilePiecesMissing.push("a cell phone number")
            }

            if (profilePiecesMissing.length > 0) {
                setNotificationTooltip(`This assignee does not have ${profilePiecesMissing.join(' or ')} in their profile`)
            }
            else {
                setNotificationTooltip(null)
            }

            setNotificationOptions(notificationOptions)
        }
        // Not changing assignee... no need to show alert options
        else {
            setNotificationOptions(null)
            setNotificationTooltip(null)
        }
    }

    async function handleLoadPrintView() {
        const results = await store.dispatch(loadMaintenanceRequestPrintView({maintenanceRequest: maintenanceRequest})).unwrap()

        await setPrintViewContent(results.data)

        setTimeout(() => {window.print()}, 500)

    }

    function handleAddExpense(values) {
        navigate(insightRoutes.expenseNew(), {state: {return_url: location.pathname, values: values, from_maintenance_request_id: maintenanceRequest.id}})
    }

    function handleEditExpense(expense, values) {
        navigate(insightRoutes.expenseEdit(expense.hash_id), {state: {return_url: location.pathname, values: values}})
    }

    function calculateTotal(expenses) {
        let total = 0

        expenses.forEach((expense) => {
            total += expense.amount
        })

        return total
    }

    return (
        <div className="section">
            {properties && maintenanceRequest && (!currentUser || currentUser.maintenance_requests_view) && mode && !printViewContent && <>

                {scrolledPastTop && maintenanceRequest.hash_id && <div className="stickynote sticky-active">
                    <div className="sn-container">
                        <div className="sn-group">
                            <span><strong>Ticket #{maintenanceRequest.id} <span className={maintenanceRequest.status == constants.maintenance_request_statuses.open.key ? "info-positive" : "info-negative"}>({insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)})</span></strong></span>
                            {maintenanceRequest.unit && <span>{maintenanceRequest.unit.street}{maintenanceRequest.unit.unit_number && <>, <strong>Unit #{maintenanceRequest.unit.unit_number}</strong></>}</span>}
                        </div>
                        <div className="sn-block"><strong>{maintenanceRequest.title}</strong> - {maintenanceRequest.description}</div>
                    </div>
                </div>}

                <i className="fad fa-tools section-icon"></i>

                <div className="maint-new-request">
                    <Formik
                        initialValues={maintenanceRequest}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setBaseErrorMessage("")
                            const originalStatus = values.status

                            values.photos_batch_number = batchNumber

                            if (statusAfterSave) {
                                values.status = statusAfterSave
                            }

                            const results = await store.dispatch(saveMaintenanceRequest({maintenanceRequest: values, editMode: params.editMode})).unwrap()
                            console.log(results)
                            const response = results.data

                            setSubmitting(false);

                            if (response.success) {
                                if (currentUser) {
                                    navigate(insightRoutes.maintenanceRequestList())
                                }
                            }
                            else {
                                if (statusAfterSave) {
                                    values.status = originalStatus
                                }

                                if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }

                        }}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form>

                                    <div className="title-block">
                                        <h1><span>{mode == "new" ? "Add Maintenance Ticket" : (maintenanceRequest.title || "Edit Ticket")}</span></h1>

                                        {mode != "new" && maintenanceRequest.unit &&
                                            <div className="subtitle">{maintenanceRequest.property.name}, {maintenanceRequest.unit.street_and_unit}, {maintenanceRequest.unit.city}, {maintenanceRequest.unit.state} {maintenanceRequest.unit.zip}</div>
                                        }
                                    </div>

                                    {mode != "new" && <div className="info-status-wrap">
                                        <div className="info-status">Status: <span className={maintenanceRequest.status == constants.maintenance_request_statuses.open.key ? "info-positive" : "info-negative"}>{insightUtils.getLabel(maintenanceRequest.status, constants.maintenance_request_statuses)}</span></div>
                                    </div>}

                                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                                    <div className="skinny-column maint-request-form">
                                        <div className="smallspacer"></div>
                                        {
                                            mode == "vendor_edit" ?
                                                <>
                                                    <p>The ticket below was submitted on <em>{insightUtils.formatDate(maintenanceRequest.submitted_on)}</em> by {maintenanceRequest.submitted_by.name}.</p>

                                                    <ul className="summary">
                                                        <li><strong>Description: </strong> <em>{maintenanceRequest.title}</em> {maintenanceRequest.description}</li>
                                                        {maintenanceRequest.urgency && <li><strong>Urgency:</strong> {insightUtils.getLabel(maintenanceRequest.urgency, constants.maintenance_request_urgencies)}</li>}
                                                    </ul>
                                                </>
                                                :
                                                <>

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

                                                            <div className="form-row">
                                                                <FormItem label="Property" name="property_id">
                                                                    <BasicDropdown name="property_id" blankText="-- Select Property --" options={properties.filter((p) => p.units && p.units.length > 0)} onChange={(e) => {updateSelectedProperty(e.target.value)}} />
                                                                </FormItem>
                                                                <FormItem label="Unit" name="unit_id">
                                                                    {units ?
                                                                        <BasicDropdown name={`unit_id`} blankText="-- Select Unit --" options={units} />
                                                                        :
                                                                        <select className="form-select"><option>Please select a property</option></select>
                                                                    }
                                                                </FormItem>
                                                            </div>
                                                        </>
                                                    }

                                                    <div className="form-row">
                                                        <FormItem label="Urgency" name="urgency" optional={true}>
                                                            <BasicDropdown name="urgency" options={constants.maintenance_request_urgencies} />
                                                        </FormItem>

                                                        <FormItem label="Assigned To" name="assigned_to_type_and_id" optional={true}>
                                                            <BasicDropdown name="assigned_to_type_and_id" options={assignees} onChange={(e) => updateSelectedAssignee(e.target.value)} />
                                                        </FormItem>
                                                    </div>

                                                    {notificationOptions &&
                                                        <div className="form-row">
                                                            <div className="form-item"></div>

                                                            <FormItem label={<>Send Notification {notificationTooltip && <ToolTip explanation={notificationTooltip} icon={<i className="far fa-triangle-exclamation"></i>} />}</>} name="send_notification" optional={true}>
                                                                <CheckBoxGroup name="send_notification" options={notificationOptions} direction="row" optionClassName="st-col-50" />
                                                            </FormItem>
                                                        </div>
                                                    }

                                                    <div className="form-row">
                                                        {(mode == "new" || mode == "edit") &&
                                                        <FormItem label="Category" name="maintenance_request_category_id" optional={true}>
                                                            <BasicDropdown name="maintenance_request_category_id" options={items.filter((item) => (item.type == "MaintenanceRequestCategory"))} />
                                                        </FormItem>
                                                        }

                                                        <FormItem label="Schedule Day" name="scheduled_on" optional={true}>
                                                            <InsightDatePicker name="scheduled_on" selected={values.scheduled_on} onChange={(date) => setFieldValue("scheduled_on", date)} />
                                                        </FormItem>

                                                        <FormItem label="Schedule Time" name="scheduled_time" optional={true}>
                                                            <BasicDropdown name="scheduled_time" options={constants.maintenance_request_resolution_times} />
                                                        </FormItem>
                                                    </div>

                                                    <div className="form-row">

                                                        <FormItem formItemClass="form-item-50" label={<>Recurring Maintenance? <ToolTip explanation="Recurring will schedule multiple tickets in the future" /></>} name="recurring_frequency" optional={true}>
                                                            <BasicDropdown name="recurring_frequency" options={constants.maintenance_request_recurring_frequencies} blankText={"One-Time"} />
                                                        </FormItem>

                                                        {(mode == "new" || mode == "edit") &&
                                                            <FormItem formItemClass="form-item-50" label="&nbsp;" name="internal_ticket" optional={true}>
                                                                <ToggleSwitch label={<>Internal Ticket? <ToolTip explanation="Internal will not be shared or visible to the resident" /></>} name="internal_ticket"/>
                                                            </FormItem>
                                                        }

                                                        {(mode == "view" || mode == "edit") && currentUser?.maintenance_requests_edit && currentUser?.expenses_edit && maintenanceRequest.hash_id &&
                                                        <div className="form-item form-item-50">
                                                            <a onClick={() => handleAddExpense(values)} className="btn btn-red btn-medium" disabled={isSubmitting}>
                                                                <span>Add Expense <i className="fal fa-plus"></i></span>
                                                            </a>
                                                        </div>
                                                        }

                                                    </div>
                                                </>
                                        }

                                        {currentUser?.expenses_view && maintenanceRequest.expenses && maintenanceRequest.expenses.length > 0 && <div className="expenses">
                                            <label>Expenses</label>
                                            {maintenanceRequest.expenses.map((expense, index) => {
                                                return (
                                                    <div key={index} className="expense-item">
                                                        <div className="expense-item-icons">
                                                            <i onClick={() => handleEditExpense(expense, values)} className="fal fa-edit btn-expense-edit"></i>
                                                            {false && <i className="fal fa-trash-alt btn-expense-delete"></i>}
                                                        </div>
                                                        <li className="expense-name"><strong>{expense.description}</strong></li>
                                                        <div className="expense-group">
                                                            <li><strong>Date:</strong> {insightUtils.formatDate(expense.due_on)}</li>
                                                            <li><strong>Account:</strong> {expense.account_name}</li>
                                                            <li><strong>Amount:</strong> {insightUtils.numberToCurrency(expense.amount, 2)}</li>
                                                        </div>
                                                    </div>)
                                            })}

                                            <div className="expense-total">Total Expenses: {insightUtils.numberToCurrency(calculateTotal(maintenanceRequest.expenses), 2)}</div>

                                        </div>}



                                        {(mode == "view" || mode == "vendor_edit") &&
                                            <>

                                                <ul className="summary">
                                                    {maintenanceRequest.resident && <>
                                                        <li><strong>Tenant Phone:</strong> {maintenanceRequest.resident.phone_number}</li>
                                                    </>}
                                                    {maintenanceRequest.unit && <>
                                                        <li><strong>Location:</strong> {maintenanceRequest.property.name}, {maintenanceRequest.unit.full_address}</li>
                                                    </>}

                                                    <li><strong>Issue Description:</strong> {maintenanceRequest.title} {maintenanceRequest.description && " - " + maintenanceRequest.description}</li>

                                                    {maintenanceRequest.maintenance_request_category_id &&
                                                        <li><strong>Category:</strong> {insightUtils.getLabel(maintenanceRequest.maintenance_request_category_id, items.filter((item) => (item.type == "MaintenanceRequestCategory")))}</li>
                                                    }

                                                    {maintenanceRequest.preferred_resolution_on && <>
                                                        <li><strong>Preferred Day to Resolve:</strong> {insightUtils.formatDate(maintenanceRequest.preferred_resolution_on)} {maintenanceRequest.preferred_resolution_time && <> between {insightUtils.getLabel(maintenanceRequest.preferred_resolution_time, constants.maintenance_request_resolution_times)}</>}</li>
                                                    </>}

                                                    {maintenanceRequest.scheduled_on && <li><strong>Scheduled:</strong> {insightUtils.formatDate(maintenanceRequest.scheduled_on)}
                                                        {maintenanceRequest.scheduled_time && <> between {insightUtils.getLabel(maintenanceRequest.scheduled_time, constants.maintenance_request_resolution_times)}</>}
                                                    </li>}

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

                                        <div className="form-nav flex-row">
                                            {
                                                currentUser ?
                                                    <>
                                                        <a onClick={() => navigate(insightRoutes.maintenanceRequestList())} className="btn btn-gray" disabled={isSubmitting}>
                                                            <span>Cancel</span>
                                                        </a>
                                                        {maintenanceRequest.hash_id && <a onClick={() => handleLoadPrintView()} className="btn btn-gray" disabled={isSubmitting}>
                                                            <span>Print with QR Code</span>
                                                        </a>}
                                                        {currentUser?.maintenance_requests_edit && <>
                                                            {maintenanceRequest.hash_id && values.status != constants.maintenance_request_statuses.closed.key && <button onClick={() => setStatusAfterSave(constants.maintenance_request_statuses.closed.key)} className={values.status == constants.maintenance_request_statuses.vendor_complete.key ? "btn btn-red" : "btn btn-gray"} type="submit" disabled={isSubmitting}>
                                                                <span>Close Ticket</span>
                                                            </button>}
                                                            {maintenanceRequest.hash_id && values.status != constants.maintenance_request_statuses.open.key && <button onClick={() => setStatusAfterSave(constants.maintenance_request_statuses.open.key)} className="btn btn-gray" type="submit" disabled={isSubmitting}>
                                                                <span>Re-open Ticket</span>
                                                            </button>}
                                                            <button onClick={() => setStatusAfterSave(null)} className={values.status == constants.maintenance_request_statuses.vendor_complete.key ? "btn btn-gray" : "btn btn-red"} type="submit" disabled={isSubmitting}>
                                                                <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                                            </button>
                                                        </>}
                                                    </>
                                                    :
                                                    <>
                                                        {values.status != constants.maintenance_request_statuses.open.key && <button onClick={() => setStatusAfterSave(constants.maintenance_request_statuses.open.key)} className="btn btn-gray" type="submit" disabled={isSubmitting}>
                                                            <span>Re-open Ticket</span>
                                                        </button>}
                                                        {values.status != constants.maintenance_request_statuses.vendor_complete.key && <button onClick={() => setStatusAfterSave(constants.maintenance_request_statuses.vendor_complete.key)} className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                            <span>Close Ticket</span>
                                                        </button>}
                                                        {false && <button onClick={() => setStatusAfterSave(null)} className="btn btn-red" type="submit" disabled={isSubmitting}>
                                                            <span>{!isSubmitting ? "Save" : "Saving..."}</span>
                                                        </button>}
                                                    </>
                                            }

                                        </div>
                                    </div>
                            </Form>
                        )}
                    </Formik>

                    {currentUser && currentUser.maintenance_requests_view && maintenanceRequest.id && mode != "vendor_edit" &&
                        <CommentsView title="Conversation with Resident" type="CommunicationNotePublic" subType="conversation_with_resident" relatedObjectType="MaintenanceRequest" relatedObjectHashId={maintenanceRequest.hash_id} extraClassName="skinny-column" containerClassName="main-container" hideReply={!currentUser.maintenance_requests_edit} />
                    }
                    {currentUser && currentUser.maintenance_requests_view && maintenanceRequest.id &&
                        <CommentsView title="Internal Notes" type="CommunicationNotePrivate" subType="internal_notes" relatedObjectType="MaintenanceRequest" relatedObjectHashId={maintenanceRequest.hash_id} extraClassName="skinny-column" containerClassName="main-container" hideReply={!currentUser.maintenance_requests_edit} />
                    }
                </div>
            </>}

            {printViewContent && <Modal closeModal={() => setPrintViewContent(null)}>
                <div className="content" dangerouslySetInnerHTML={{__html: printViewContent}} />
            </Modal>}
        </div>
    )}

export default MaintenanceRequestEditPage;

