import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadAccountReconciliation = createAsyncThunk('results/loadAccountReconciliation', async ({accountReconciliationId}) => {
    console.log("START loadAccountReconciliation ", accountReconciliationId)

    const response = await client.get( "/api/internal/account_reconciliations/" + accountReconciliationId)

    console.log("END loadAccountReconciliation")
    return {data: response}

})

export const loadAccountReconciliations = createAsyncThunk('results/loadAccountReconciliations', async ({accountReconciliationId}) => {
    console.log("START loadAccountReconciliations", accountReconciliationId)

    let response  = await client.get("/api/internal/account_reconciliations/"+accountReconciliationId)

    console.log("END loadAccountReconciliations")
    return {data: response}

})

export const loadAccountEntriesForReconciliation = createAsyncThunk('results/loadAccountEntriesForReconciliation', async ({accountReconciliationId}) => {
    console.log("START loadAccountEntriesForReconciliation ", accountReconciliationId)

    const response = await client.get( "/api/internal/account_reconciliations/" + accountReconciliationId + "/account_entries")

    console.log("END loadAccountEntriesForReconciliation")
    return {data: response}

})

export const saveAccountReconciliation = createAsyncThunk('results/saveAccountReconciliation', async ({accountReconciliation}) => {
    console.log("START saveAccountReconciliation")

    let url = "/api/internal/account_reconciliations"
    let method = "POST"

    if (accountReconciliation.hash_id) {
        url += "/" + accountReconciliation.hash_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {account_reconciliation: accountReconciliation})

    console.log("END saveAccountReconciliation")
    return {data: response}

})

export const finalizeAccountReconciliation = createAsyncThunk('results/finalizeAccountReconciliation', async ({accountReconciliation}) => {
    console.log("START finalizeAccountReconciliation")

    let url = "/api/internal/account_reconciliations/" + accountReconciliation.hash_id + "/finalize"

    let response  = await client.put(url, {account_reconciliation: accountReconciliation})

    console.log("END saveAccountReconciliation")
    return {data: response}

})


export const findMostRecentReconciliation = createAsyncThunk('results/findMostRecentReconciliation', async ({bankAccountId}) => {
    console.log("START findMostRecentReconciliation")

    const response = await client.post('/api/internal/account_reconciliations/find_most_recent', {bank_account_id: bankAccountId})

    console.log("END findMostRecentReconciliation")
    return {data: response}

})

export const searchForAccountReconciliations = createAsyncThunk('results/searchForAccountReconciliations', async ({searchText, bankAccountId, startDate, endDate}) => {
    console.log("START searchForAccountReconciliations")

    const response = await client.post('/api/internal/account_reconciliations/search', {search_text: searchText, bank_account_id: bankAccountId, start_date: startDate, end_date: endDate})
    console.log("END searchForAccountReconciliations")
    return {data: response}

})

const accountReconciliationSlice = createSlice({
    name: 'accountReconciliation',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = accountReconciliationSlice.actions
