import React, {useEffect, useState} from 'react';
import store from "../../../app/store";
import {loadBankTransactions} from "../../../slices/financialConnectionSlice";
import FinancialNav from "../financial/FinancialNav";
import {loadBankAccount} from "../../../slices/bankAccountSlice";
import Modal from "../../shared/Modal";
import {useParams} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import BankTransactionRow from "./BankTransactionRow";
import BankTransactionNav from "./BankTransactionNav";
import {useSelector} from "react-redux";
import BankTransactionActionForm from "./BankTransactionActionForm";
import BankTransactionDateRangeFilter from "./BankTransactionDateRangeFilter";
import {setSearchText} from "../../../slices/userSlice";
import BankTransactionMultipleActionForm from "./BankTransactionMultipleActionForm";
import insightUtils from "../../../app/insightUtils";


const BankTransactionPage = ({title, status, multiActionLabel}) => {

    const params = useParams()

    const { constants } = useSelector((state) => state.company)
    const { startDate, endDate, searchText } = useSelector((state) => state.user)

    const [selectedTransactionIds, setSelectedTransactionIds] = useState([])
    const [confirmableTransactionIds, setConfirmableTransactionIds] = useState([])
    const [allTransactions, setAllTransactions] = useState([])
    const [reviewingTransaction, setReviewingTransaction] = useState(null)
    const [reviewingTransactions, setReviewingTransactions] = useState(null)
    const [multiReviewMode, setMultiReviewMode] = useState(null)

    const [bankAccount, setBankAccount] = useState(null)

    const [reloadTable, setReloadTable] = useState(0)

    useEffect(async() => {
        const results = await store.dispatch(loadBankAccount({bankAccountId: params.bankAccountId})).unwrap()

        setBankAccount(results.data.bank_account)

    }, [])

    async function runSearch(text) {
        store.dispatch(setSearchText({searchText: text}))

        const results = await store.dispatch(loadBankTransactions({bankAccountId: params.bankAccountId, status: status, searchText: text, fromDate: startDate, toDate: endDate})).unwrap()

        // Update the selected transactions
        const newSelections = selectedTransactionIds.filter((id) => results.data.bank_transactions.find((txn) => txn.id == id))
        const newConfirmableTransactionIds = results.data.bank_transactions.filter((txn) => txn.related_object_hash_id).map((t) => t.id)

        setSelectedTransactionIds(newSelections)
        setConfirmableTransactionIds(newConfirmableTransactionIds)

        setAllTransactions(results.data.bank_transactions)

        return {total: results.data.bank_transactions.length, objects: results.data.bank_transactions}
    }

    function generateTableRow(bankTransaction, key) {
        return (<BankTransactionRow key={key} bankTransaction={bankTransaction} bankAccount={bankAccount} setReviewingTransaction={setReviewingTransaction} selected={selectedTransactionIds} setSelected={setSelectedTransactionIds} />)
    }

    function getColumns() {
        if (status == constants.bank_transaction_status_options.excluded.key) {
            return [
                {label: "Date", class: "st-col-15", sort_by: "transacted_at", selectAll: handleSelectAllTransactions},
                {label: "Property", class: "st-col-15 hidden-md", sort_by: "company_or_property_name"},
                {label: "Description", class: "st-col-15 hidden-md", sort_by: "description"},
                {label: "Amount", class: "st-col-15 text-right", sort_by: "amount"},
                {label: "Action", class: "st-col-15 text-center"}
            ]
        }
        else {
            return [
                {label: "Date", class: "st-col-15", sort_by: "transacted_at", selectAll: handleSelectAllTransactions},
                {label: "Property", class: "st-col-15 hidden-md", sort_by: "company_or_property_name"},
                {label: "Description", class: "st-col-15 hidden-md", sort_by: "description"},
                {label: "Assigned To", class: "st-col-15 hidden-md"},
                {label: "Amount", class: "st-col-15 text-right", sort_by: "amount"},
                {label: "Action", class: "st-col-15 text-center"}
            ]
        }
    }

    function handleSelectAllTransactions() {
        const allTransactionIds = allTransactions.map((t) => t.id)

        if (selectedTransactionIds.length < allTransactionIds.length) {
            setSelectedTransactionIds(allTransactionIds)
        }
        else {
            setSelectedTransactionIds([])
        }
    }

    function handleReviewMultiple(newMultiReviewMode) {
        let selectedTransactionObjects = allTransactions.filter((transaction) => selectedTransactionIds.includes(transaction.id))

        // If we are confirming, we can only confirm the ones that have a related object
        if (newMultiReviewMode == "confirm") {
            selectedTransactionObjects = selectedTransactionObjects.filter((transaction) => transaction.related_object_hash_id)
        }

        setReviewingTransactions(selectedTransactionObjects)
        setMultiReviewMode(newMultiReviewMode)
    }

    return (
        <>
            {bankAccount &&
                <ListPage
                    title={title}
                    subTitle={`for ${bankAccount.name}`}
                    titleImage={<img className="section-img" src="/images/photo-bank-transactions.jpg"/>}
                    nav={<><FinancialNav/><BankTransactionNav bankAccount={bankAccount} status={status} /><br/></>}
                    addButton={<BankTransactionDateRangeFilter reloadTable={reloadTable} setReloadTable={setReloadTable} />}
                    secondaryNav={(selectedTransactionIds && selectedTransactionIds.length > 0) &&
                        <div className="text-left" style={{marginTop: "10px"}}>
                            <a onClick={() => handleReviewMultiple(status == constants.bank_transaction_status_options.new.key ? "exclude" : "undo")} className="btn btn-red">{multiActionLabel} ({selectedTransactionIds.length})</a>

                            {status == constants.bank_transaction_status_options.new.key && insightUtils.intersect(confirmableTransactionIds, selectedTransactionIds).length > 0 &&
                                <>&nbsp;<a onClick={() => handleReviewMultiple("confirm")} className="btn btn-red">Confirm ({insightUtils.intersect(confirmableTransactionIds, selectedTransactionIds).length})</a></>
                            }
                        </div>
                    }
                    runSearch={runSearch}
                    initialSearchText={searchText}
                    reloadWhenChanges={reloadTable}
                    hideNavCol={true}
                    noDataMessage={"You have no transactions"}
                    columns={getColumns()}
                    allSelected={selectedTransactionIds.length > 0 && selectedTransactionIds.length == allTransactions.length}
                    generateTableRow={generateTableRow}
                />}

            {reviewingTransactions && <Modal closeModal={() => setReviewingTransaction(null)} extraClassName="overlay-box-large">
                <BankTransactionMultipleActionForm mode={multiReviewMode} bankAccount={bankAccount} bankTransactions={reviewingTransactions} setBankTransactions={setReviewingTransactions} setReloadTable={setReloadTable} />
            </Modal>}

            {reviewingTransaction && <Modal closeModal={() => setReviewingTransaction(null)} extraClassName="overlay-box-large">
                <BankTransactionActionForm mode={status == constants.bank_transaction_status_options.new.key ? "review" : "undo"} bankAccount={bankAccount} bankTransaction={reviewingTransaction} setBankTransaction={setReviewingTransaction} reloadTable={reloadTable} setReloadTable={setReloadTable} />
            </Modal>}

        </>

    )
}


export default BankTransactionPage;

