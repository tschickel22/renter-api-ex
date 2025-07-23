import React, {useEffect, useState} from 'react';
import store from "../../../app/store";
import {loadBankTransaction, loadBankTransactionMatches, saveBankTransactionMatch} from "../../../slices/financialConnectionSlice";
import {loadBankAccount} from "../../../slices/bankAccountSlice";
import {Form, Formik} from "formik";
import FormItem from "../../shared/FormItem";
import {useNavigate, useParams} from "react-router-dom";
import ListPage from "../../shared/ListPage";
import insightRoutes from "../../../app/insightRoutes";
import RadioButtonGroup from "../../shared/RadioButtonGroup";
import insightUtils from "../../../app/insightUtils";
import BankTransactionMatchRow from "./BankTransactionMatchRow";
import {DateRangePicker} from "react-date-range";
import BankTransactionActionForm from "./BankTransactionActionForm";
import moment from "moment/moment";
import BankTransactionDateRangeFilter from "./BankTransactionDateRangeFilter";


const BankTransactionMatchPage = ({}) => {

    const navigate = useNavigate()
    const params = useParams()

    const [bankTransaction, setBankTransaction] = useState(null)
    const [bankAccount, setBankAccount] = useState(null)
    const [reloadTable, setReloadTable] = useState(0)

    const [localStartDate, setLocalStartDate] = useState(moment(new Date()).format("YYYY-MM-DD"))
    const [localEndDate, setLocalEndDate] = useState(moment(new Date()).format("YYYY-MM-DD"))

    useEffect(async() => {
        let results = await store.dispatch(loadBankAccount({bankAccountId: params.bankAccountId})).unwrap()
        const newBankAccount = results.data.bank_account

        results = await store.dispatch(loadBankTransaction({bankAccountId: params.bankAccountId, bankTransactionId: params.bankTransactionId})).unwrap()

        setLocalStartDate(moment(results.data.bank_transaction.transacted_at).subtract(2, 'days').format("YYYY-MM-DD"))
        setLocalEndDate(moment(results.data.bank_transaction.transacted_at).add(2, 'days').format("YYYY-MM-DD"))
        setBankTransaction(results.data.bank_transaction)
        setBankAccount(newBankAccount)

    }, [])

    async function runSearch(text) {
        const results = await store.dispatch(loadBankTransactionMatches({bankAccountId: params.bankAccountId, bankTransactionId: params.bankTransactionId, searchText: text, fromDate: localStartDate, toDate: localEndDate})).unwrap()

        console.log(results)

        return {total: results.data.related_objects.length, objects: results.data.related_objects}
    }

    function generateTableRow(relatedObject, key) {
        return (<BankTransactionMatchRow key={key} relatedObject={relatedObject} handleMatch={handleMatch}  />)
    }

    async function handleMatch(relatedObject) {
        // Match these items up and return
        await store.dispatch(saveBankTransactionMatch({bankAccountId: params.bankAccountId, bankTransactionId: params.bankTransactionId, relatedObjectId: relatedObject.id, relatedObjectType: relatedObject.type})).unwrap()

        closeView()
    }

    function closeView() {
        if (location.state && location.state.return_url) {
            navigate(location.state.return_url)
        }
        else {
            navigate(insightRoutes.financialConnectionReview(params.bankAccountId))
        }
    }

    function relatedObjectDate(relatedObject) {
        if (relatedObject.type == "Expense") {
            return relatedObject.paid_on
        }
        else {
            return relatedObject.date
        }
    }

    return (
        <>
            {bankAccount && bankTransaction && <>
                <ListPage
                title={`${bankTransaction.description}`}
                subTitle={<><strong>{insightUtils.formatDate(bankTransaction.transacted_at)}:</strong> {insightUtils.numberToCurrency(bankTransaction.amount, 2)}</>}
                titleImage={<img className="section-img" src="/images/photo-bank-transactions.jpg"/>}
                addButton={<BankTransactionDateRangeFilter localStartDate={localStartDate} setLocalStartDate={setLocalStartDate} localEndDate={localEndDate} setLocalEndDate={setLocalEndDate} reloadTable={reloadTable} setReloadTable={setReloadTable} />}
                runSearch={runSearch}
                reloadWhenChanges={reloadTable}
                noDataMessage={"You have no matching transactions"}
                columns={[
                    {label: "Date", class: "st-col-15", sort_by: "date", data_type: 'function', sort_by_function: relatedObjectDate},
                    {label: "Property", class: "st-col-15", sort_by: "company_or_property_name"},
                    {label: "Description", class: "st-col-15", sort_by: "description"},
                    {label: "Amount", class: "st-col-15 text-right", sort_by: "amount"},
                    {label: "Action", class: "st-col-15 text-center"}
                ]}
                generateTableRow={generateTableRow}
                afterTableContent={<BankTransactionActionForm mode="match" bankAccount={bankAccount} bankTransaction={bankTransaction} setBankTransaction={closeView} setReloadTable={closeView} />}
            />

            </>}
        </>
    )
}


export default BankTransactionMatchPage;

