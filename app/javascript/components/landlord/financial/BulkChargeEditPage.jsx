import React, {useEffect, useState} from 'react';

import {useNavigate, useParams} from "react-router-dom";
import store from "../../../app/store";
import {Form, Formik} from "formik";
import insightUtils from "../../../app/insightUtils";
import FormItem from "../../shared/FormItem";
import insightRoutes from "../../../app/insightRoutes";
import BasicDropdown from "../../shared/BasicDropdown";
import {useSelector} from "react-redux";
import {deleteBulkCharge, loadBulkCharge, saveBulkCharge} from "../../../slices/chargeSlice";
import DatePicker from "react-datepicker";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import moment from "moment/moment";
import Modal from "../../shared/Modal";
import {displayAlertMessage} from "../../../slices/dashboardSlice";

const BulkChargeEditPage = ({}) => {
    const navigate = useNavigate()
    const params = useParams()

    const protectedChargeTypes = [3,5]

    const { constants, chargeTypes } = useSelector((state) => state.company)

    const [bulkCharge, setBulkCharge] = useState(null)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")
    const [deletingBulkCharge, setDeletingBulkCharge] = useState(null)
    const [deletingSubmitted, setDeletingSubmitted] = useState(false)

    useEffect(async () => {

        let newBulkCharge = null;
        /*
           Load Bulk Charge
         */
        if (params.bulkChargeId) {
            const results = await store.dispatch(loadBulkCharge({bulkChargeId: params.bulkChargeId})).unwrap()

            newBulkCharge = results.data.bulk_charge
            newBulkCharge.due_on = insightUtils.parseDate(newBulkCharge.due_on)
            newBulkCharge.end_on = insightUtils.parseDate(newBulkCharge.end_on)
        }
        else {
            newBulkCharge = insightUtils.emptyBulkCharge()
        }

        setBulkCharge(newBulkCharge)

    }, []);


    async function handleDelete() {
        setDeletingSubmitted(true)
        const results = await store.dispatch(deleteBulkCharge({bulkChargeId: deletingBulkCharge.hash_id})).unwrap()

        if (results.data.success) {
            store.dispatch(displayAlertMessage({message: "Bulk Charge Deleted"}))
        }
        else {
            store.dispatch(displayAlertMessage({message: results.data.errors.base}))
        }

        navigate(insightRoutes.bulkChargeList())

    }

    function closeView(newBulkCharge) {
        navigate(insightRoutes.bulkChargeEditLeases(newBulkCharge.hash_id))
    }

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        try {

            const result = await store.dispatch(saveBulkCharge({bulkCharge: values})).unwrap()
            const response = result.data

            console.log(response)

            setSubmitting(false);

            if (response.success) {
                closeView(response.bulk_charge)
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
            setBaseErrorMessage("Unable to save bulk charge")
            setSubmitting(false);
        }
    }

    return (
        <>

            <div className="section">
                <img className="section-img" src="/images/photo-accounting.jpg"/>
                {bulkCharge &&
                    <>
                        <h2>{params.bulkChargeId ? "Edit" : "Create"} Bulk Charge</h2>

                        {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                        <Formik
                            initialValues={bulkCharge}
                            onSubmit={handleFormikSubmit}
                        >
                            {({isSubmitting, values, setFieldValue}) => (
                                <Form>


                                    <div className="form-row">
                                        <FormItem formItemClass="form-item-25" label="Type" name="charge_type_id">
                                            <BasicDropdown name="charge_type_id" blankText="-- Select Type --" options={chargeTypes.filter((ct) => (protectedChargeTypes.indexOf(ct.id) < 0))}/>
                                        </FormItem>

                                        <FormItem formItemClass="form-item-25" label="Frequency" name="frequency">
                                            <BasicDropdown name="frequency" options={constants.charge_frequencies} direction="row"/>
                                        </FormItem>

                                        <FormItem formItemClass="form-item-25" label={values.frequency == constants.charge_frequencies.monthly.key ? "Start On" : "Due Date"} name="due_on">
                                            <DatePicker className="form-input form-input-white" selected={values.due_on} onChange={(date) => setFieldValue("due_on", date)} minDate={moment().add(1, 'days').toDate()} />
                                        </FormItem>

                                        {values.frequency == constants.charge_frequencies.monthly.key ?
                                            <FormItem formItemClass="form-item-25" label="End Date" name="end_on">
                                                <DatePicker className="form-input form-input-white" selected={values.end_on} onChange={(date) => setFieldValue("end_on", date)} minDate={values.due_on ? moment(values.due_on).add(1, 'month').toDate() : moment().add(1, 'days').add(1, 'month').toDate()} />
                                            </FormItem>
                                            :
                                            <div className="form-item form-item-25">&nbsp;</div>
                                        }
                                    </div>

                                    <div className="form-row">
                                        <FormItem formItemClass="form-item-25" label="Same Amount for All?" name="same_for_all">
                                            <RadioButtonGroup name="same_for_all" options={insightUtils.yesNoOptions()}/>
                                        </FormItem>
                                        <FormItem formItemClass="form-item-25" label="Charge Amount" name="amount" mask={insightUtils.currencyMask(true)} helpText={values.same_for_all ? "" : "You will be able to edit for each lease"}/>
                                        <FormItem formItemClass="form-item-25" label="Description" name="description"/>

                                        {values.frequency == constants.charge_frequencies.monthly.key ?
                                            <FormItem formItemClass="form-item-25" label="Prorate for Move-in/out?" name="prorated">
                                                <RadioButtonGroup name="prorated" options={insightUtils.yesNoOptions()}/>
                                            </FormItem>
                                            :
                                            <div className="form-item form-item-25">&nbsp;</div>
                                        }
                                    </div>

                                    <div className="form-nav">
                                        <a onClick={() => navigate(insightRoutes.bulkChargeList())} className="btn btn-gray"><span>Cancel</span></a>
                                        {bulkCharge.status_pretty == "Scheduled" && <a className="btn btn-gray" onClick={() => setDeletingBulkCharge(bulkCharge)}> <span>Delete</span></a>}
                                        <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Continue" : "Continuing..."}</span></button>
                                    </div>

                                </Form>
                            )}
                        </Formik>
                    </>
                }

            </div>

            {deletingBulkCharge && <Modal closeModal={() => setDeletingBulkCharge(null)}>
                <h2>Delete Bulk Charge?</h2>
                <p className="text-center">Are you sure you want to delete this bulk charge?</p>

                <div className="form-nav">
                    <div onClick={() => setDeletingBulkCharge(null)} className="btn btn-gray"><span>Cancel</span></div>
                    <div onClick={() => handleDelete()} className="btn btn-red"><span>{deletingSubmitted ? "Processing..." : "Delete"}</span></div>
                </div>
            </Modal>}
        </>

    )
}

export default BulkChargeEditPage;

