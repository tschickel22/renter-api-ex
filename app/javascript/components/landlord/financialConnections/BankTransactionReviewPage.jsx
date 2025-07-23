import React from 'react';
import BankTransactionPage from "./BankTransactionPage";
import {useSelector} from "react-redux";

const BankTransactionReviewPage = ({}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <BankTransactionPage
            status={constants.bank_transaction_status_options.new.key}
            title="Transactions"
            multiActionLabel="Exclude"
        />
    )
}

export default BankTransactionReviewPage;

