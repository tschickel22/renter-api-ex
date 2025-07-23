import React from 'react';
import {useSelector} from "react-redux";
import PaymentMethodForm from "../../shared/PaymentMethodForm";


const ScreeningPaymentMethodForm = ({settingKey}) => {

    const { currentCompany } = useSelector((state) => state.company)

    return (
        <>
            <PaymentMethodForm existingPaymentMethods={currentCompany.payment_methods} excludeDebitCards={true} excludeCash={true} paymentMethodIdName="default_screening_payment_method_id" prefix="default_screening_payment_method." />
        </>

    )}

export default ScreeningPaymentMethodForm;



