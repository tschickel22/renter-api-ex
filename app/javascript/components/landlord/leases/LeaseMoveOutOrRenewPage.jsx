import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom'

import {FieldArray, Form, Formik} from "formik";

import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {determineCheckPrintingEligibility, getMoveOutDocuments, loadLease, saveLease} from "../../../slices/leaseSlice";

import RadioButtonGroup from "../../shared/RadioButtonGroup";
import StatusBlock from "./blocks/StatusBlock";

import LeaseIntentionsRow from "./LeaseIntentionsRow";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import MoveOutChargesView from "./MoveOutChargesView";
import DragAndDrop from "../../shared/DragAndDrop";
import {client} from "../../../app/client";
import DocumentListView from "./DocumentListView";

const LeaseMoveOutOrRenewPage = ({}) => {
    const params = useParams();
    const navigate = useNavigate()
    const uploadRef = useRef()

    const { constants, items, settings, properties } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [lease, setLease] = useState(null)
    const [action, setAction] = useState(null)
    const [isSingleResident, setIsSingleResident] = useState(false)
    const [checkPrintingEnabled, setCheckPrintingEnabled] = useState(false)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [errorFiles, setErrorFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [fileTypeError, setFileTypeError] = useState("")

    useEffect(async() => {

        if (lease) {
            // Load existing attachments
            const results = await store.dispatch(getMoveOutDocuments(lease.hash_id)).unwrap()

            if (results.data.move_out_documents) {
                setUploadedFiles(results.data.move_out_documents)
            }

        }
    }, [lease]);

    function handleFileChange(event) {
        handleDrop(event.target.files)
    }


    async function handleDrop(newFiles) {
        setFileTypeError("")
        setUploading(true)
        let errorFileList = Array.from(errorFiles)

        for (let i = 0; i < newFiles.length; i++) {
            if (!newFiles[i].name) return
            if (newFiles[i].size > 25000000) {setFileTypeError("Files must smaller than 25MB"); setUploading(false); return; }

            if (await handleUpload(newFiles[i])) {
                // Nothing to do
            }
            else {
                errorFileList.push(newFiles[i].name)
            }

        }

        setErrorFiles(errorFileList)
        setUploading(false)
    }

    async function handleUpload(currentFile) {

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData.append(
            "move_out_document",
            currentFile,
            currentFile.name
        );

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/leases/" + lease.hash_id + "/upload_move_out_documents", formData, {forUpload: true})
            .then((response) => {
                    const data = JSON.parse(response)

                    if (data.success) {
                        if (data.move_out_documents) {
                            setUploadedFiles(data.move_out_documents)
                        }
                        return true;
                    }
                    else if (data.errors) {
                        console.log(data.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your photo. Please Try again")
                    return false;
                })
    }

    async function handleDelete(e, moveOutDocument) {
        e.stopPropagation();

        // Create an object of formData
        let formData = new FormData();

        // Update the formData object
        formData["move_out_document_id"] = moveOutDocument.id

        // Request made to the backend api
        // Send formData object
        return client.post("/api/internal/leases/" + lease.hash_id + "/destroy_move_out_document", formData)
            .then((response) => {
                    if (response.success) {
                        if (response.move_out_documents) {
                            setUploadedFiles(response.move_out_documents)
                        }
                        return true;
                    }
                    else if (response.errors) {
                        console.log(response.errors)
                        return false;
                    }

                },
                () => {
                    console.log("We could not upload your photo. Please Try again")
                    return false;
                })
    }


    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
        }
    }, [settings, property])

    useEffect(async () => {

        /*
           Load Lease
         */
        if (!lease) {

            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()

            if (results.data.success) {
                let newLease = Object.assign({}, results.data.lease)

                // Are we only dealing with one resident?
                if (newLease.secondary_residents.length == 0) {
                    setIsSingleResident(true)

                    if (!newLease.move_out_step || newLease.move_out_step == constants.lease_move_out_steps.start.key || newLease.move_out_step == constants.lease_move_out_steps.resident_requested.key) {
                        newLease.move_out_step = constants.lease_move_out_steps.move_out_some.key
                    }
                }

                const checkPrintingResults = await store.dispatch(determineCheckPrintingEligibility({leaseId: params.leaseId})).unwrap()
                const newCheckPrintingEnabled = checkPrintingResults.data.success && checkPrintingResults.data.eligible_for_check_printing;
                setCheckPrintingEnabled(newCheckPrintingEnabled)

                if (!newCheckPrintingEnabled) {
                    newLease.security_deposit_refund_mode = constants.lease_refund_modes.paper_check_handwritten.key
                }

                setLease(newLease)

            }
            else {
                // Error!
                setBaseErrorMessage("Unable to load lease. Please try again.")
            }
        }
    }, []);

    function pushMoveOutChecklistUpdate(newChecklistValues) {
        store.dispatch(saveLease({lease: {hash_id: lease.hash_id,  move_out_checklist_items: newChecklistValues}}))
    }

    function readMoveOutValues(v) {
        return {
            id: v.id,
            move_out_intention: v.move_out_intention,
            forwarding_street: v.forwarding_street,
            forwarding_city: v.forwarding_city,
            forwarding_state: v.forwarding_state,
            forwarding_zip: v.forwarding_zip
        }
    }

    function closeView() {
        navigate(insightRoutes.leaseShow(lease.hash_id))
    }

    async function handleGoBack() {

        let leaseValues = {
            hash_id: lease.hash_id,
            move_out_step: constants.lease_move_out_steps.start.key
        }

        const results = await store.dispatch(saveLease({lease: leaseValues})).unwrap()

        console.log(results.data)

        if (results.data.success) {
            setLease(results.data.lease)
        }
        else if (results.data.errors) {
            setErrors(results.data.errors)

            if (results.data.errors.base) {
                setBaseErrorMessage(results.data.errors.base)
            }

            insightUtils.scrollTo('errors')
        }
    }

    return (
        <>
        {currentSettings && property && lease &&
        <div className="section">
            <StatusBlock lease={lease} title="Renew / Move-out" />

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={lease}
                enableReinitialize
                onSubmit={async(values, { setSubmitting, setErrors }) => {
                    setBaseErrorMessage("")

                    let leaseValues = {
                        hash_id: lease.hash_id,
                        move_out_step: values.move_out_step,
                        lease_action: constants.lease_actions.begin_move_out.key,
                        security_deposit_refund_mode: lease.security_deposit_refund_mode
                    }

                    if (lease.move_out_step == constants.lease_move_out_steps.move_out_some.key || lease.move_out_step == constants.lease_move_out_steps.collect_all_addresses.key) {
                        leaseValues.lease_action = constants.lease_actions.continue_move_out.key
                    }
                    else if (lease.move_out_step == constants.lease_move_out_steps.move_out_all.key) {
                        leaseValues.lease_action = constants.lease_actions.process_move_out.key
                        leaseValues.security_deposit_refund_mode = values.security_deposit_refund_mode
                        leaseValues.security_deposit_refund_payment_method_id = values.security_deposit_refund_payment_method_id
                        leaseValues.security_deposit_refund_check_number = values.security_deposit_refund_check_number
                    }

                    if (action) {
                        leaseValues.lease_action = action
                    }

                    if (values.primary_resident) {
                        leaseValues.primary_resident = readMoveOutValues(values.primary_resident)
                    }

                    if (values.secondary_residents) {
                        leaseValues.secondary_residents = values.secondary_residents.map((sr) => (readMoveOutValues(sr)))
                    }

                    try {

                        const results = await store.dispatch(saveLease({lease: leaseValues})).unwrap()

                        console.log(results.data)
                        setSubmitting(false);

                        if (results.data.success) {
                            if (results.data.lease.move_out_step == constants.lease_move_out_steps.proceed_to_renew.key) {
                                navigate(insightRoutes.leaseEdit(results.data.lease.next_lease_hash_id))
                                return;
                            }
                            else if (results.data.lease.move_out_step == constants.lease_move_out_steps.complete.key) {
                                navigate(insightRoutes.leaseShow(results.data.lease.hash_id))
                                return;
                            }
                            else {
                                setLease(results.data.lease)
                            }
                        }
                        else if (results.data.errors) {
                            setErrors(results.data.errors)

                            if (results.data.errors.base) {
                                setBaseErrorMessage(results.data.errors.base)
                            }

                            insightUtils.scrollTo('errors')
                        }
                    }
                    catch {
                        // Error!
                        setBaseErrorMessage("Unable to continue move-out process")
                        setSubmitting(false);
                    }

                    setAction(null)
                }}
            >
                {({ isSubmitting, setSubmitting, handleSubmit, values }) => (
                    <Form>
                        <div className="add-property-wrap">

                            <hr />

                            {(!lease.move_out_step || lease.move_out_step == constants.lease_move_out_steps.start.key) &&
                                <div className="flex-column flex-center">
                                    <h3>Begin Lease Renewal / Move-Out</h3>
                                    <p className="text-center">What are your residents' intentions?</p>

                                    <RadioButtonGroup name="move_out_step" extraClassName="centered-radio-button-group" options={[{id: constants.lease_move_out_steps.renew_all.key, name: "Renew lease for all residents"}, {id: constants.lease_move_out_steps.move_out_some.key, name: "Some residents are moving out"}, {id: constants.lease_move_out_steps.collect_all_addresses.key, name: "All residents are moving out"}]} />
                                </div>
                            }

                            {(lease.move_out_step == constants.lease_move_out_steps.move_out_some.key ||
                              lease.move_out_step == constants.lease_move_out_steps.collect_all_addresses.key) &&
                                <div className="flex-column flex-center">
                                    <h3>Lease Renewal / Move-Out</h3>

                                    {lease.move_out_step == constants.lease_move_out_steps.move_out_some.key &&
                                        <p className="text-left">Indicate your {isSingleResident ? "resident's" : "residents'"} intentions:</p>
                                    }

                                    <LeaseIntentionsRow residentType='primary_resident' lease={lease} leaseResident={lease.primary_resident}/>

                                    {<FieldArray
                                        name="secondary_residents"
                                        render={() => (
                                            <>
                                                {values.secondary_residents && values.secondary_residents.map((secondaryResident, i) => (
                                                    <LeaseIntentionsRow key={i} residentType={"secondary_residents." + i} lease={lease} leaseResident={secondaryResident}/>
                                                ))}
                                            </>
                                        )}
                                    />}
                                </div>
                            }

                            {lease.move_out_step == constants.lease_move_out_steps.move_out_all.key &&
                                <div className="flex-column flex-center">

                                    <div>
                                        <h3>Lease Details</h3>
                                    </div>

                                    <div className="form-row">

                                        <FormItem label="Lease Start Date" name="lease_start_on">
                                            <div className="text-left">{insightUtils.formatDate(values.lease_start_on)}</div>
                                        </FormItem>
                                        <FormItem label="Lease End Date" name="lease_end_on">
                                            <div className="text-left">{insightUtils.formatDate(values.lease_end_on)}</div>
                                        </FormItem>
                                        <FormItem label="Rent" name="rent">
                                            <div className="text-left">{insightUtils.numberToCurrency(values.rent)}</div>
                                        </FormItem>
                                        <FormItem label="Security Deposit" name="security_deposit">
                                            <div className="text-left">{insightUtils.numberToCurrency(values.security_deposit)}</div>
                                        </FormItem>
                                    </div>

                                    {currentSettings.items_required_for_move_out && <>
                                        <hr className="hr-light"/>
                                        <h3>Move-out Checklist</h3>
                                        <CheckBoxGroup name="move_out_checklist_items" options={items.filter((item) => (item.type == 'MoveOutChecklistItem' && currentSettings.items_required_for_move_out.split(",").indexOf(item.id.toString()) >= 0)) } direction="row" handleOptionChange={pushMoveOutChecklistUpdate} />
                                        <div className="flex-row">&nbsp;</div>
                                    </>}

                                    <hr className="hr-light"/>
                                    <h3>Lease Balance</h3>
                                    <MoveOutChargesView lease={lease} checkPrintingEnabled={checkPrintingEnabled} />
                                    <hr className="hr-light"/>

                                    <h3>Move-Out Documents</h3>
                                    <DragAndDrop handleDrop={handleDrop}>
                                        <input type="file" ref={uploadRef} onChange={handleFileChange} style={{display: "none"}} multiple={true} />
                                        <div style={{backgroundColor: "rgba(196, 196, 196, 0.2)", padding: "20px"}} onClick={() => uploadRef.current.click()}>
                                            <div className="text-center" style={{color: "#838383"}}>
                                                Drop files here or Upload<br/>
                                                {uploadedFiles.length == 0 && <>Files must be no larger than 25MB in size</>}
                                                {fileTypeError && <div className="text-error">{fileTypeError}</div>}
                                                {uploading && <div className="text-green">Uploading...</div>}

                                                {errorFiles.length > 0 && <><br/><br/>We could not upload these files:</>}
                                                {errorFiles.map((file, i) =>
                                                    <div key={i}>{file}</div>
                                                )}
                                            </div>
                                        </div>
                                    </DragAndDrop>

                                    <DocumentListView uploadedFiles={uploadedFiles} handleDelete={handleDelete} />

                                </div>
                            }

                            {lease.move_out_step == constants.lease_move_out_steps.proceed_to_renew.key &&
                                <div className="flex-column flex-center">
                                    <h3>Proceed to Renew</h3>
                                    <p className="text-center">We are ready to process your renewal. Click Continue to proceed.</p>

                                    <div className="form-nav">
                                        <Link to={insightRoutes.leaseEdit(lease.next_lease_hash_id)} className="btn btn-red">Continue</Link>
                                    </div>
                                </div>
                            }


                            {lease.move_out_step != constants.lease_move_out_steps.proceed_to_renew.key &&
                                <div className="form-nav">
                                    <a onClick={closeView} className="btn btn-gray"><span>Cancel</span></a>
                                    {(!isSingleResident && lease.move_out_step && lease.move_out_step != constants.lease_move_out_steps.start.key) &&
                                        <a onClick={handleGoBack} className="btn btn-gray"><span>Back</span></a>
                                    }
                                    {lease.move_out_step == constants.lease_move_out_steps.move_out_all.key && <a className="btn btn-gray" disabled={isSubmitting} onClick={(e) => {setAction(constants.lease_actions.cancel_move_out.key); setSubmitting(true); handleSubmit(e)}}><span>{!isSubmitting ? "Cancel Move-Out" : "Saving..."}</span></a>}
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? (lease.move_out_step == constants.lease_move_out_steps.move_out_all.key ? "Process Move-Out" : "Continue") : (lease.move_out_step == constants.lease_move_out_steps.move_out_all.key ? "Processing..." : "Continuing...")}</span></button>
                                </div>
                            }
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
        }
        </>
    )}

export default LeaseMoveOutOrRenewPage;

