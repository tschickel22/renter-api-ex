import React from 'react';
import BankTransactionPage from "./BankTransactionPage";
import {useSelector} from "react-redux";

const BankTransactionCategorizedPage = ({}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <BankTransactionPage
            status={constants.bank_transaction_status_options.categorized.key}
            title="Categorized Transactions"
            multiActionLabel="Undo"
        />
    )
}

export default BankTransactionCategorizedPage;

