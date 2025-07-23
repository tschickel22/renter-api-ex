import React, {useEffect, useState} from 'react';
import FinancialNav from "./FinancialNav";
import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {deleteCharge, loadCharge, loadRentAndDepositCharges, saveCharge} from "../../../slices/chargeSlice";
import Modal from "../../shared/Modal";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import {useSelector} from "react-redux";
import BasicDropdown from "../../shared/BasicDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import {loadCurrentLeases} from "../../../slices/leaseSlice";
import DatePicker from "react-datepicker";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";

const ChargeEditModal = ({}) => {
    let navigate = useNavigate()
    let params = useParams()

    const rentChargeTypeId = 2
    const depositChargeTypeId = 3
    const lateFeeChargeTypeId = 5
    const protectedChargeTypes = [depositChargeTypeId, lateFeeChargeTypeId]

    const { chargeTypes, properties, constants } = useSelector((state) => state.company)

    const [leases, setLeases] = useState([])
    const [charge, setCharge] = useState(null)
    const [depositCharge, setDepositCharge] = useState(null)
    const [deletingCharge, setDeletingCharge] = useState(false)

    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async () => {

        /*
           Load Charge
         */
        if (!charge) {
            updateSelectedProperty("")

            if (params.chargeId) {
                const results = await store.dispatch(loadCharge({chargeId: params.chargeId})).unwrap()
                let newCharge = {...results.data.resident_charge}
                newCharge.due_on = insightUtils.parseDate(newCharge.due_on)
                setCharge(newCharge)
            }
            else if (params.leaseId) {
                let newCharge = Object.assign( insightUtils.emptyCharge(), {lease_id: params.leaseId, property_id: params.propertyId, send_resident_payment_link: false, proposed: params.isProposed == "true"})

                if (params.hideMonthly == "true") {
                    newCharge.frequency = constants.charge_frequencies.one_time.key
                }

                setCharge(newCharge)

                /*
                 Load Charges
               */
                const charge_results = await store.dispatch(loadRentAndDepositCharges({leaseId: params.leaseId})).unwrap()

                // Find the security deposit charges
                if (charge_results.data.deposit_charges && charge_results.data.deposit_charges.length > 0) {
                    setDepositCharge(charge_results.data.deposit_charges[0])
                }
            }
            else {
                setCharge(insightUtils.emptyCharge())
            }
        }
    }, []);

    function closeModal() {
        navigate(-1)
    }

    async function updateSelectedProperty(propertyId) {
        const results = await store.dispatch(loadCurrentLeases({propertyId: propertyId})).unwrap()
        const currentLeases = (results.data.leases || []).filter((lease) => {
            return lease.primary_resident
        }).map((lease) => {
            return {id: lease.hash_id, name: `${lease.primary_resident.resident.first_name} ${lease.primary_resident.resident.last_name}`}
        })

        setLeases(insightUtils.sortByName(currentLeases))

    }

    async function handleDeleteCharge() {
        await store.dispatch(deleteCharge({charge: charge})).unwrap()

        closeModal()
    }

    function getChargeTypes() {

        let newProtectedChargeTypes = [lateFeeChargeTypeId]

        // If we already have a deposit, don't allow a new one to be added
        if (params.chargeId || depositCharge) newProtectedChargeTypes.push(depositChargeTypeId)

        return chargeTypes.filter((ct) => (newProtectedChargeTypes.indexOf(ct.id) < 0))
    }

    function isSpecialCharge(values) {
        protectedChargeTypes.indexOf(values.charge_type_id) < 0 && !(values.charge_type_id == rentChargeTypeId && values.frequency == constants.charge_frequencies.monthly.key)
    }

    return (
        <>

            <div className="section">

                <div className="title-block">

                </div>

                <FinancialNav />

                {properties && chargeTypes && charge &&
                <Modal closeModal={closeModal}>

                    <h2>{params.chargeId ? "Edit" : "Create"} Resident Charge</h2>

                    {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                    <Formik
                        initialValues={charge}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setBaseErrorMessage("")

                            try {
                                const result = await store.dispatch(saveCharge({charge: values})).unwrap()
                                const response = result.data

                                console.log(response)

                                setSubmitting(false);

                                if (response.success) {
                                    closeModal()
                                }
                                else if (response.errors) {
                                    setErrors(response.errors)

                                    if (response.errors.base) {
                                        setBaseErrorMessage(response.errors.base)
                                    }

                                    insightUtils.scrollTo('errors')
                                }
                            }
                            catch(err) {
                                console.log("UH-OH", err)
                                setBaseErrorMessage("Unable to save charge")
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form>
                                <div className="add-property-wrap">

                                    {!params.leaseId && !params.chargeId &&
                                        <div className="form-row">

                                            <FormItem name="property_id">
                                                <AutocompleteDropdown name="property_id"
                                                                      label={<>Property<span>*</span></>}
                                                                      blankText="All Properties"
                                                                      options={properties}
                                                                      handleChange={updateSelectedProperty}
                                                />
                                            </FormItem>

                                            <FormItem name="lease_id">
                                                <AutocompleteDropdown name="lease_id" label={<>Resident<span>*</span></>} options={leases} blankText="-- Select Resident --" />
                                            </FormItem>
                                        </div>
                                    }

                                    <div className="form-row">
                                        <FormItem label="Type" name="charge_type_id">
                                            {protectedChargeTypes.indexOf(charge.charge_type_id) >= 0 ?
                                                <div className="text-left">{insightUtils.getLabel(charge.charge_type_id, chargeTypes)}</div>
                                                :
                                                <BasicDropdown name="charge_type_id" blankText="-- Select Type --" options={getChargeTypes()} />
                                            }
                                        </FormItem>

                                        {values.frequency == constants.charge_frequencies.one_time.key &&  <FormItem label="Amount" name="amount" mask={insightUtils.currencyMask(true)} />}
                                        {values.frequency != constants.charge_frequencies.one_time.key &&  <FormItem label="Amount" name="amount" mask={insightUtils.currencyMask(false)} />}

                                    </div>

                                    <div className="form-row">
                                        {!(params.hideMonthly == "true") && ((protectedChargeTypes.indexOf(parseInt(values.charge_type_id)) < 0 && ![depositChargeTypeId].includes(parseInt(values.charge_type_id)))) &&
                                            <FormItem label="Frequency" name="frequency">
                                                <RadioButtonGroup name="frequency" options={constants.charge_frequencies} direction="row" />
                                            </FormItem>
                                        }

                                        {!isSpecialCharge(values) &&
                                            <FormItem label="Description" name="description" optional={true} />
                                        }
                                    </div>

                                    <div className="form-row">

                                        <FormItem label={values.frequency == constants.charge_frequencies.one_time.key ? "Due Date" : "Start On"} name="due_on">
                                            <DatePicker className="form-input form-input-white" selected={values.due_on} onChange={(date) => setFieldValue("due_on", date)} />
                                        </FormItem>

                                        {values.frequency == constants.charge_frequencies.monthly.key &&
                                            <FormItem label="Prorate for Move-in/out?" name="prorated">
                                                <RadioButtonGroup name="prorated" options={insightUtils.yesNoOptions()} direction="row" />
                                            </FormItem>
                                        }
                                        {!params.leaseId && !params.chargeId &&
                                            <FormItem label="Send Resident Payment Link" name="send_resident_payment_link">
                                                <RadioButtonGroup name="send_resident_payment_link" options={insightUtils.yesNoOptions()} direction="row"/>
                                            </FormItem>
                                        }
                                    </div>


                                    <div className="form-row">
                                        &nbsp;
                                    </div>

                                    {!deletingCharge &&
                                        <div className="form-nav">
                                            <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                            {params.chargeId && <a onClick={() => (setDeletingCharge(true))} className="btn btn-gray"><span>Delete Charge</span></a>}
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                        </div>
                                    }
                                    {deletingCharge &&
                                        <>
                                            <div className="form-nav">
                                                Are you sure you want to delete this charge?
                                            </div>
                                            <div className="form-nav">
                                                <a onClick={() => (setDeletingCharge(false))} className="btn btn-gray"><span>No</span></a>
                                                <a onClick={() => (handleDeleteCharge())} className="btn btn-red"><span>Yes</span></a>
                                            </div>
                                        </>
                                    }
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Modal>
                }

            </div>

        </>

    )}

export default ChargeEditModal;

