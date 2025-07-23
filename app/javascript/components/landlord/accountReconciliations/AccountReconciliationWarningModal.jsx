import React from 'react';
import {useFormikContext} from "formik";
import Modal from "../../shared/Modal";

const AccountReconciliationWarningModal = ({setIsConfirmingSave, handleConfirmedSave}) => {
    const formikProps = useFormikContext()

    return (
        <Modal closeModal={() => setIsConfirmingSave(false)}>
            <h2>Transaction Cleared</h2>
            <p className="text-center">
                You have changed a transaction that has already been
                reconciled. If you change this transaction now, when you reconcile
                your next statement your opening balance won't match your bank statement anymore.
            </p>
            <p className="text-center">Do you want to save your changes?</p>

            <div className="form-nav">
                <div onClick={() => setIsConfirmingSave(false)} className="btn btn-gray"><span>No</span></div>
                <div onClick={() => handleConfirmedSave(formikProps.values, { setSubmitting: formikProps.setSubmitting, setErrors: formikProps.setErrors })} className="btn btn-red"><span>{formikProps.isSubmitting ? "Processing..." : "Yes"}</span></div>
            </div>
        </Modal>

    )}

export default AccountReconciliationWarningModal;


