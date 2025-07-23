import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const savePropertyBankAccounts = createAsyncThunk('results/savePropertyBankAccounts', async ({operatingBankAccounts, depositBankAccounts, useSameBankAccountForDeposits}) => {
    console.log("START savePropertyBankAccounts")

    const response = await client.post('/api/internal/companies/save_property_bank_accounts', {use_same_bank_account_for_deposits: useSameBankAccountForDeposits, operating_bank_accounts: operatingBankAccounts, deposit_bank_accounts: depositBankAccounts})
    console.log("END saveCompanyTaxpayerInfo")
    return {data: response}

})

export const searchForBankAccounts = createAsyncThunk('results/searchForBankAccounts', async ({searchText}) => {
    console.log("START searchForBankAccounts")

    const response = await client.post('/api/internal/bank_accounts/search', { search_text: searchText})
    console.log("END searchForBankAccounts")
    return {data: response}

})

export const loadBankAccount = createAsyncThunk('results/loadBankAccount', async ({bankAccountId}) => {
    console.log("START loadBankAccount ", bankAccountId)

    let url = "/api/internal/bank_accounts/" + bankAccountId

    const response = await client.get(url)
    console.log("END loadBankAccount")
    return {data: response}

})

export const loadBankAccountForAccountId = createAsyncThunk('results/loadBankAccountForAccountId', async ({accountId}) => {
    console.log("START loadBankAccountForAccountId ", accountId)

    let url = "/api/internal/bank_accounts/" + accountId + "/for_account"

    const response = await client.get(url)
    console.log("END loadBankAccountForAccountId")
    return {data: response}

})



export const saveBankAccount = createAsyncThunk('results/saveBankAccount', async ({bankAccount}) => {
    console.log("START saveBankAccount ", bankAccount)

    let url = "/api/internal/bank_accounts"
    let method = "POST"

    if (bankAccount.hash_id) {
        url += "/" + bankAccount.hash_id
        method = "PUT"
    }

    const response = await client.call(method, url, {bank_account: bankAccount})
    console.log("END saveBankAccount")
    return {data: response}

})

export const loadReconcilableAccounts = createAsyncThunk('results/loadReconcilableAccounts', async (_) => {
    console.log("START loadReconcilableAccounts")

    const response = await client.get('/api/internal/bank_accounts/reconcilable')
    console.log("END loadReconcilableAccounts")
    return {data: response}

})

const bankAccountSlice = createSlice({
    name: 'bankAccount',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = bankAccountSlice.actions

export default bankAccountSlice.reducer
