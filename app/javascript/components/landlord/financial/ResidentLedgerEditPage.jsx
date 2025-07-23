import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import Modal from "../../shared/Modal";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import insightRoutes from "../../../app/insightRoutes";
import {deleteCharge, deleteLedgerItem, loadLedgerItemDetails, saveCharge, saveLedgerItem} from "../../../slices/chargeSlice";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import AutocompleteDropdown from "../../shared/AutocompleteDropdown";
import BasicDropdown from "../../shared/BasicDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import DatePicker from "react-datepicker";
import {useSelector} from "react-redux";


const ResidentLedgerEditPage = ({}) => {

    let params = useParams();

    const [ledgerItem, setLedgerItem] = useState(null)
    const [charge, setCharge] = useState(null)
    const [deletingLedgerItem, setDeletingLedgerItem] = useState(false)
    const [baseErrorMessage, setBaseErrorMessage] = useState("")

    useEffect(async() => {

        /*
           Load Ledger Item
         */
        const ledger_item_results = await store.dispatch(loadLedgerItemDetails({leaseId: params.leaseId, ledgerItemId: params.ledgerItemId})).unwrap()
        setLedgerItem(ledger_item_results.data.ledger_item)
        setCharge(ledger_item_results.data.charge)

    }, []);

    async function handleFormikSubmit(values, { setSubmitting, setErrors }) {
        setBaseErrorMessage("")

        try {
            const result = await store.dispatch(saveLedgerItem({ledgerItem: values})).unwrap()
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
    }

    async function handleDeleteLedgerItem() {
        await store.dispatch(deleteLedgerItem({ledgerItem: ledgerItem})).unwrap()

        closeModal()
    }

    function closeModal() {
        document.location.href = (insightRoutes.residentLedger(params.leaseId))
    }

    return (
        <>
            <Modal extraClassName="overlay-box-small" closeModal={closeModal}>
                {ledgerItem && <div className="section">
                <div className="text-left">
                    {charge && <>
                        <h1>{ledgerItem.description}</h1>

                        <div className="form-row">
                            <div className="form-item">
                                <label>Ledger #:</label> {ledgerItem.hash_id}
                            </div>
                        </div>


                        {baseErrorMessage && <div className="text-error">{baseErrorMessage}</div>}

                        <Formik
                            initialValues={ledgerItem}
                            onSubmit={handleFormikSubmit}
                        >
                            {({ isSubmitting, values, setFieldValue }) => (
                                <Form>
                                    <div className="add-property-wrap">

                                        <div className="form-row">
                                            <FormItem label="Amount" name="amount" mask={insightUtils.currencyMask(true)} />
                                        </div>

                                        {false &&
                                        <div className="form-row">
                                            <FormItem label="Transaction Date" name="transaction_at">
                                                <DatePicker className="form-input form-input-white" selected={insightUtils.formatDate(values.transaction_at)} onChange={(date) => setFieldValue("transaction_at", date)} />
                                            </FormItem>
                                        </div>
                                        }

                                        {!deletingLedgerItem &&
                                        <div className="form-nav">
                                            <a onClick={closeModal} className="btn btn-gray"><span>Cancel</span></a>
                                            <a onClick={() => (setDeletingLedgerItem(true))} className="btn btn-gray"><span>Delete Item</span></a>
                                            <button className="btn btn-red" type="submit" disabled={isSubmitting}><span>{!isSubmitting ? "Save" : "Saving..."}</span></button>
                                        </div>
                                        }
                                        {deletingLedgerItem &&
                                        <>
                                            <div className="form-nav">
                                                Are you sure you want to delete this ledger item?
                                            </div>
                                            <div className="form-nav">
                                                <a onClick={() => (setDeletingLedgerItem(false))} className="btn btn-gray"><span>No</span></a>
                                                <a onClick={() => (handleDeleteLedgerItem())} className="btn btn-red"><span>Yes</span></a>
                                            </div>
                                        </>
                                        }
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </>}
                    </div>
                </div>
                }
            </Modal>
        </>
    )}

export default ResidentLedgerEditPage;
