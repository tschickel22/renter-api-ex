import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import DatePicker from "react-datepicker";
import moment from 'moment';

import {Form, Formik} from "formik";
import {Link} from "react-router-dom";

import {useSelector} from "react-redux";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import store from "../../../app/store";
import {loadLease, saveLease} from "../../../slices/leaseSlice";
import LeaseApplicantBlock from "./blocks/LeaseApplicantBlock";
import ApplicationActionButton from "./blocks/ApplicationActionButton";
import CommentsView from "../communications/CommentsView";
import CheckBoxGroup from "../../shared/CheckBoxGroup";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import MoveInChargesView from "./MoveInChargesView";
import StatusBlock from "./blocks/StatusBlock";
import LeaseDocumentsView from "./LeaseDocumentsView";
import BasicDropdown from "../../shared/BasicDropdown";
import {loadChargesAndLedgerItems, loadRentAndDepositCharges} from "../../../slices/chargeSlice";

const LeaseEditPage = ({}) => {
    let params = useParams();
    let navigate = useNavigate()

    const { constants, items, settings, properties } = useSelector((state) => state.company)

    const [currentSettings, setCurrentSettings] = useState(null)
    const [lease, setLease] = useState(null)
    const [rentCharge, setRentCharge] = useState(null)
    const [depositCharge, setDepositCharge] = useState(null)
    const [units, setUnits] = useState(null)
    const [action, setAction] = useState(null)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const property = (properties || []).find((property) => lease && property.id == lease.property_id)

    useEffect(async () => {
        if (settings && property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
            setUnits(property.units)
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

                newLease.lease_start_on = insightUtils.parseDate(results.data.lease.lease_start_on)
                newLease.lease_end_on = insightUtils.parseDate(results.data.lease.lease_end_on)
                newLease.move_in_on = insightUtils.parseDate(results.data.lease.move_in_on)
                newLease.move_out_on = insightUtils.parseDate(results.data.lease.move_out_on)
                newLease.send_lease_letter = "true"

                if (!constants.lease_term_options[newLease.lease_term]) {
                    newLease.lease_term_other = newLease.lease_term
                    newLease.lease_term = "other"
                }

                setLease(newLease)

                /*
                   Load Charges
                 */
                const charge_results = await store.dispatch(loadRentAndDepositCharges({leaseId: params.leaseId})).unwrap()

                // Find the rent and security deposit charges
                if (charge_results.data.rent_charges && charge_results.data.rent_charges.length > 0) {
                    setRentCharge(charge_results.data.rent_charges[0])
                }
                if (charge_results.data.deposit_charges && charge_results.data.deposit_charges.length > 0) {
                    setDepositCharge(charge_results.data.deposit_charges[0])
                }
            }
            else {
                // Error!
                setBaseErrorMessage("Unable to edit lease. Please try again.")
            }
        }

    }, []);

    function updateSelectedProperty(propertyId) {
        const property = (properties || []).find((property) => property.id == parseInt(propertyId))

        if (property) {
            setCurrentSettings(insightUtils.getSettings(settings, property.id))
            setUnits(property.units)
        }
    }

    function pushMoveInChecklistUpdate(newChecklistValues) {
        store.dispatch(saveLease({lease: {hash_id: lease.hash_id,  move_in_checklist_items: newChecklistValues}}))
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")
        let leaseValues = {}
        let newAction = action

        // Special action handling
        if (!newAction || newAction == "save") {
            let leaseEndOnChanged = lease.lease_end_on && insightUtils.formatDate(lease.lease_end_on) != insightUtils.formatDate(values.lease_end_on)
            leaseEndOnChanged = leaseEndOnChanged || (!lease.lease_end_on && values.lease_end_on) // Not set, now set
            leaseEndOnChanged = leaseEndOnChanged || (lease.lease_end_on && !values.lease_end_on) // Was set, now not

            if ([constants.lease_statuses.future.key, constants.lease_statuses.current.key].indexOf(lease.status) >= 0 && leaseEndOnChanged) {
                newAction = constants.lease_actions.adjusting_lease_end.key
            }
            else {
                let moveOutOnChanged = lease.move_out_on && insightUtils.formatDate(lease.move_out_on) != insightUtils.formatDate(values.move_out_on)
                moveOutOnChanged = moveOutOnChanged || (!lease.move_out_on && values.move_out_on) // Not set, now set
                moveOutOnChanged = moveOutOnChanged || (lease.move_out_on && !values.move_out_on) // Was set, now not

                if ([constants.lease_statuses.former.key].indexOf(lease.status) >= 0 && moveOutOnChanged) {
                    newAction = constants.lease_actions.adjusting_move_out.key
                    leaseValues.move_out_on = values.move_out_on
                }

            }
        }

        leaseValues.hash_id = values.hash_id
        leaseValues.property_id = values.property_id
        leaseValues.unit_id = values.unit_id
        leaseValues.lease_start_on = values.lease_start_on
        leaseValues.lease_end_on = values.lease_end_on
        leaseValues.rent = values.rent
        leaseValues.security_deposit = values.security_deposit
        leaseValues.lease_action = newAction
        leaseValues.send_lease_letter = values.send_lease_letter
        leaseValues.lease_term = values.lease_term
        leaseValues.lease_term_other = values.lease_term_other

        try {

            const results = await store.dispatch(saveLease({lease: leaseValues})).unwrap()

            console.log(results.data)
            setSubmitting(false);

            if (results.data.success) {
                if (action == constants.lease_actions.begin_move_in.key) {
                    setLease(results.data.lease)
                }
                else if (action == constants.lease_actions.cancel_renewal.key) {
                    navigate(insightRoutes.leaseMoveOutOrRenew(results.data.lease.previous_lease_hash_id))
                }
                else {
                    closeView()
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
            setBaseErrorMessage("Unable to save lease")
            setSubmitting(false);
        }

        setAction(null)
    }

    function closeView() {
        navigate(insightRoutes.leaseShow(lease.hash_id))
    }

    return (
        <>
        {currentSettings && property && lease &&
        <div className="section">

            <StatusBlock lease={lease} title="Lease Details" />

            {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

            <Formik
                initialValues={lease}
                onSubmit={handleFormikSubmit}
            >
                {({ setSubmitting, handleSubmit, isSubmitting, values, setFieldValue }) => (
                    <Form>
                        <div className="add-property-wrap">
                            <div>
                                <h3>Occupants</h3>
                            </div>

                            <div className="flex-grid flex-grid-gray flex-grid-three-col">
                                {lease.primary_resident && <LeaseApplicantBlock setLease={setLease} lease={lease} leaseResident={lease.primary_resident} />}
                                {lease.secondary_residents.map((secondaryResident, i) => (
                                    <LeaseApplicantBlock key={i} setLease={setLease} lease={lease} leaseResident={secondaryResident}/>
                                ))}
                                {lease.occupants.map((occupant, i) => (
                                    <LeaseApplicantBlock key={i} setLease={setLease} lease={lease} leaseResident={occupant}/>
                                ))}
                                {lease.minors.map((minor, i) => (
                                    <LeaseApplicantBlock key={i} setLease={setLease} lease={lease} leaseResident={minor}/>
                                ))}

                            </div>

                            {lease.guarantors && lease.guarantors.length > 0 && <>
                                <div>
                                    <h3>Guarantors</h3>
                                </div>

                                <div className="flex-grid flex-grid-gray flex-grid-three-col">
                                    {lease.guarantors.map((guarantor, i) => (
                                        <LeaseApplicantBlock key={i} setLease={setLease} lease={lease} leaseResident={guarantor}/>
                                    ))}
                                </div>
                            </>}

                            {[constants.lease_statuses.lead.key, constants.lease_statuses.applicant.key, constants.lease_statuses.approved.key, constants.lease_statuses.renewing.key].indexOf(lease.status) >= 0 &&
                                <div className="form-nav">
                                    <Link to={insightRoutes.leaseAddResident(lease.hash_id, "LeaseResidentSecondary")} className="btn btn-gray">Add Applicant</Link>&nbsp;
                                    <Link to={insightRoutes.leaseAddResident(lease.hash_id, "LeaseResidentOccupant")} className="btn btn-gray">Add Occupant</Link>

                                    {lease.status != constants.lease_statuses.renewing.key && [constants.lease_application_statuses.completed.key, constants.lease_application_statuses.approved.key, constants.lease_application_statuses.declined.key].indexOf(lease.application_status) >= 0 && <ApplicationActionButton lease={lease} setLease={setLease} onEditLease={true} />}
                                </div>
                            }

                            <hr/>

                            <div>
                                <h3>Lease Details</h3>
                            </div>

                            <div className="form-row">

                                {!lease.move_in_on ?
                                    <>
                                        <FormItem name="property_id">
                                            <AutocompleteDropdown name="property_id"
                                                                  label={<>Property<span>*</span></>}
                                                                  blankText="-- Select Property --"
                                                                  options={properties}
                                                                  handleChange={updateSelectedProperty}
                                            />
                                        </FormItem>

                                        <FormItem name="unit_id">
                                            <AutocompleteDropdown name="unit_id"
                                                                  label={<>Unit<span>*</span></>}
                                                                  blankText="-- Select Unit --"
                                                                  options={units}
                                            />
                                        </FormItem>
                                    </>
                                    :
                                    <>
                                        <FormItem label="Property" name="property_id">
                                            <div className="text-left">{lease.property_name}</div>
                                        </FormItem>
                                        <FormItem label="Unit" name="unit_id">
                                            <div className="text-left">{lease.unit.street_and_unit}</div>
                                        </FormItem>
                                    </>
                                }

                                {([constants.lease_statuses.lead.key, constants.lease_statuses.applicant.key, constants.lease_statuses.renewing.key].indexOf(lease.status) >= 0 || (constants.lease_statuses.approved.key && !lease.lease_start_on)) ?
                                    <FormItem label="Rent" name="rent" mask={insightUtils.currencyMask()} optional={true} />
                                    :
                                    <FormItem label="Rent" name="rent">
                                        <div className="text-left">{rentCharge ? <Link to={insightRoutes.financialChargeEdit(rentCharge.hash_id)}><i className="fal fa-pencil"></i> {insightUtils.numberToCurrency(values.rent)}</Link> : insightUtils.numberToCurrency(values.rent)}</div>
                                    </FormItem>
                                }

                                {([constants.lease_statuses.lead.key, constants.lease_statuses.applicant.key, constants.lease_statuses.renewing.key].indexOf(lease.status) >= 0 || (constants.lease_statuses.approved.key && !lease.lease_start_on)) ?
                                    <FormItem label="Security Deposit" name="security_deposit" mask={insightUtils.currencyMask()} optional={true} />
                                    :
                                    <FormItem label="Security Deposit" name="security_deposit">
                                        <div className="text-left">{depositCharge ? <Link to={insightRoutes.financialChargeEdit(depositCharge.hash_id)}><i className="fal fa-pencil"></i> {insightUtils.numberToCurrency(values.security_deposit)}</Link> : insightUtils.numberToCurrency(values.security_deposit)}</div>
                                    </FormItem>
                                }
                            </div>

                            <div className="form-row">

                                {!lease.move_in_on ?
                                    <>
                                        <FormItem label="Lease Term" name="lease_term">
                                            <BasicDropdown name="lease_term" options={constants.lease_term_options} />
                                        </FormItem>

                                        {values.lease_term == "other" && <FormItem label="Enter Months" name="lease_term_other" />}

                                        {lease.previous_lease_id && lease.lease_start_on && lease.lease_term != -1 ?
                                            <FormItem label="Lease Start Date" name="lease_start_on">
                                                <div className="text-left">{insightUtils.formatDate(values.lease_start_on)}</div>
                                            </FormItem>
                                        :
                                            <FormItem label="Lease Start Date" name="lease_start_on" optional={!values.lease_end_on}>
                                                <DatePicker className="form-input form-input-white" selected={values.lease_start_on} onChange={(date) => setFieldValue("lease_start_on", date)} />
                                            </FormItem>
                                        }
                                        <FormItem label="Lease End Date" name="lease_end_on" optional={!values.lease_start_on || values.lease_term == -1}>
                                            <DatePicker className="form-input form-input-white" selected={values.lease_end_on} openToDate={values.lease_start_on ? moment(values.lease_start_on).add(Math.abs((values.lease_term == "other" ? values.lease_term_other : values.lease_term) || 12), 'months').toDate() : null} onChange={(date) => setFieldValue("lease_end_on", date)} />
                                        </FormItem>

                                        {values.lease_term != "other" && <div className="form-item"></div>}

                                    </>
                                    :
                                    <>
                                        <FormItem label="Lease Term" name="lease_term">
                                            <div className="text-left">{values.lease_term == "other" ? values.lease_term_other + " Months" : insightUtils.getLabel(values.lease_term, constants.lease_term_options)}</div>
                                        </FormItem>
                                        <FormItem label="Lease Start Date" name="lease_start_on">
                                            <div className="text-left">{insightUtils.formatDate(values.lease_start_on)}</div>
                                        </FormItem>
                                        <FormItem label="Lease End Date" name="lease_end_on" optional={!values.lease_start_on || values.lease_term == -1}>
                                            <DatePicker className="form-input form-input-white" selected={values.lease_end_on} openToDate={values.lease_start_on ? moment(values.lease_start_on).add(Math.abs((values.lease_term == "other" ? values.lease_term_other : values.lease_term) || 12), 'months').toDate() : null} onChange={(date) => setFieldValue("lease_end_on", date)} />
                                        </FormItem>
                                        <div className="form-item"></div>
                                    </>
                                }


                            </div>
                            <div className="form-row">
                                {lease.move_in_on &&
                                    <FormItem label="Move-in Date" name="move_in_on">
                                        <div className="text-left">{insightUtils.formatDate(values.move_in_on)}</div>
                                    </FormItem>
                                }

                                {lease.move_out_on &&
                                    [constants.lease_statuses.former.key].indexOf(lease.status) >= 0 ?
                                    <FormItem label="Move-out Date" name="move_out_on">
                                        <DatePicker className="form-input form-input-white" selected={values.move_out_on} onChange={(date) => setFieldValue("move_out_on", date)} />
                                    </FormItem>
                                    :
                                    <FormItem label="Move-out Date" name="move_out_on">
                                        <div className="text-left">{insightUtils.formatDate(values.move_out_on)}</div>
                                    </FormItem>
                                }

                                <div className="form-item"></div>

                            </div>

                            {(!values.lease_start_on || !values.lease_end_on) && lease.status == constants.lease_statuses.approved.key &&
                                <p className="text-center">Set the lease start and end dates in order to begin the move-in process.</p>
                            }

                            {lease.lease_start_on && !lease.move_in_on && lease.status == constants.lease_statuses.approved.key && <>

                                {currentSettings.items_required_for_move_in && <>
                                    <button className="btn btn-red" type="submit" disabled={isSubmitting} onClick={() => setAction("save")}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                    <div className="flex-row">&nbsp;</div>
                                    <hr/>
                                    <h3>Move-in Checklist</h3>
                                    <CheckBoxGroup name="move_in_checklist_items" options={items.filter((item) => (item.type == 'MoveInChecklistItem' && currentSettings.items_required_for_move_in.split(",").indexOf(item.id.toString()) >= 0)) } direction="row" handleOptionChange={pushMoveInChecklistUpdate} />
                                    <div className="flex-row">&nbsp;</div>
                                </>}

                                <hr/>
                                <h3>Charges</h3>
                                <MoveInChargesView lease={lease} />
                                <hr/>
                            </>}

                            {lease.lease_start_on && <LeaseDocumentsView lease={lease} />}

                            {lease.lease_start_on && !lease.move_in_on && lease.status == constants.lease_statuses.approved.key && <>

                                <h3>Process Move-In</h3>
                                <br />
                                <div className="flex-row flex-center">
                                    <FormItem label={"Send " + (lease.secondary_residents.length > 0 ? "Applicants" : "Applicant") + " Payment Link & Welcome Letter?"} name="send_lease_letter" optional={true}>
                                        <RadioButtonGroup name="send_lease_letter" options={[{id: "true", name: "Yes"}, {id: "false", name: "No"}]} direction="row-centered" />
                                    </FormItem>
                                </div>

                            </>
                            }

                            <div className="form-nav">
                                <a onClick={closeView} className="btn btn-gray"><span>Back</span></a>
                                {!lease.lease_start_on && values.lease_start_on && (values.lease_end_on || values.lease_term == -1) && lease.status == constants.lease_statuses.approved.key ?
                                    <a className="btn btn-red" disabled={isSubmitting} onClick={(e) => {setAction(constants.lease_actions.begin_move_in.key); setSubmitting(true); handleSubmit(e)}}><span>{!isSubmitting ? "Begin Move-in Process" : "Saving..."}</span></a>
                                    :
                                    (lease.lease_start_on && !lease.move_in_on && lease.status == constants.lease_statuses.approved.key ?
                                        <a className="btn btn-red" disabled={isSubmitting} onClick={(e) => {setAction(constants.lease_actions.process_move_in.key); setSubmitting(true); handleSubmit(e)}}><span>{!isSubmitting ? "Process Move-In" : "Saving..."}</span></a>
                                    :
                                        <>
                                            {lease.status == constants.lease_statuses.renewing.key ?
                                                <>
                                                    <a className="btn btn-gray" disabled={isSubmitting} onClick={(e) => {setAction(constants.lease_actions.cancel_renewal.key); setSubmitting(true); handleSubmit(e)}}><span>{!isSubmitting ? "Cancel Renewal" : "Saving..."}</span></a>
                                                    <a className="btn btn-red" disabled={isSubmitting} onClick={(e) => {setAction(constants.lease_actions.process_renewal.key); setSubmitting(true); handleSubmit(e)}}><span>{!isSubmitting ? "Complete Renewal" : "Saving..."}</span></a>
                                                </>
                                            :
                                                <button className="btn btn-red" type="submit" disabled={isSubmitting} onClick={() => setAction("save")}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                            }
                                        </>
                                    )
                                }
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
        }
        </>
    )}

export default LeaseEditPage;

