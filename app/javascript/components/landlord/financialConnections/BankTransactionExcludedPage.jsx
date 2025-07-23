import React from 'react';
import BankTransactionPage from "./BankTransactionPage";
import {useSelector} from "react-redux";

const BankTransactionExcludedPage = ({}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <BankTransactionPage
            status={constants.bank_transaction_status_options.excluded.key}
            title="Excluded Transactions"
            multiActionLabel="Undo"
        />
    )
}

export default BankTransactionExcludedPage;

