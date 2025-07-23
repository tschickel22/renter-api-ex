import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const startFinancialConnectionSession = createAsyncThunk('results/startFinancialConnectionSession', async () => {
    console.log("START startFinancialConnectionSession")

    const response = await client.post('/api/internal/financial_connections/start', {})
    console.log("END startFinancialConnectionSession")
    return {data: response}

})

export const storeFinancialConnectionSession = createAsyncThunk('results/storeFinancialConnectionSession', async ({financialConnectionSession}) => {
    console.log("START storeFinancialConnectionSession")

    const response = await client.post('/api/internal/financial_connections/store', {financial_connection_session: financialConnectionSession})
    console.log("END storeFinancialConnectionSession")
    return {data: response}

})

export const saveAccountMapping = createAsyncThunk('results/saveAccountMapping', async ({bankAccountMapping}) => {
    console.log("START saveAccountMapping")

    const response = await client.post('/api/internal/financial_connections/save_account_mapping', {bank_account_mapping: bankAccountMapping})
    console.log("END saveAccountMapping")
    return {data: response}

})

export const saveAccountUnlinking = createAsyncThunk('results/saveAccountUnlinking', async ({bankAccountIds}) => {
    console.log("START saveAccountUnlinking")

    const response = await client.post('/api/internal/financial_connections/save_account_unlinking', {bank_account_ids: bankAccountIds})
    console.log("END saveAccountUnlinking")
    return {data: response}

})

export const loadBankTransaction = createAsyncThunk('results/loadBankTransaction', async ({bankAccountId, bankTransactionId}) => {
    console.log("START loadBankTransaction")

    const response = await client.get('/api/internal/financial_connections/' + bankAccountId + '/bank_transaction?bank_transaction_id='+bankTransactionId, {})
    console.log("END loadBankTransaction")
    return {data: response}

})

export const loadBankTransactions = createAsyncThunk('results/loadBankTransactions', async ({bankAccountId, status, searchText, fromDate, toDate}) => {
    console.log("START loadBankTransactions")

    const response = await client.post('/api/internal/financial_connections/' + bankAccountId + '/bank_transactions', {status: status, search_text: searchText, from_date: fromDate, to_date: toDate})
    console.log("END loadBankTransactions")
    return {data: response}

})

export const loadBankTransactionMatches = createAsyncThunk('results/loadBankTransactionMatches', async ({bankAccountId, bankTransactionId, searchText, fromDate, toDate}) => {
    console.log("START loadBankTransactionMatches", bankAccountId, bankTransactionId, searchText, fromDate, toDate)

    const response = await client.post('/api/internal/financial_connections/' + bankAccountId + '/bank_transaction_matches', {bank_transaction_id: bankTransactionId, search_text: searchText, from_date: fromDate, to_date: toDate})
    console.log("END loadBankTransactionMatches")
    return {data: response}

})

export const saveBankTransactionMatch = createAsyncThunk('results/saveBankTransactionMatch', async ({bankAccountId, bankTransactionId, relatedObjectId, relatedObjectType}) => {
    console.log("START saveBankTransactionMatch")

    const response = await client.post('/api/internal/financial_connections/' + bankAccountId + '/save_bank_transaction_match', {bank_transaction_id: bankTransactionId, related_object_id: relatedObjectId, related_object_type: relatedObjectType})
    console.log("END saveBankTransactionMatch")
    return {data: response}

})

export const updateBankTransactionStatus = createAsyncThunk('results/updateBankTransactionStatus', async ({bankAccountId, bankTransactionId, bankTransactionIds, bankTransactionMapping, status}) => {
    console.log("START updateBankTransactionStatus")

    bankTransactionIds =  bankTransactionIds || [bankTransactionId]

    const response = await client.post('/api/internal/financial_connections/' + bankAccountId + '/update_bank_transaction_status', {bank_transaction_ids: bankTransactionIds, bank_transaction_mapping: bankTransactionMapping, status: status})

    console.log("END updateBankTransactionStatus")
    return {data: response}

})

const financialConnectionSlice = createSlice({
    name: 'financialConnection',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {


    }
})

export const {} = financialConnectionSlice.actions

export default financialConnectionSlice.reducer
