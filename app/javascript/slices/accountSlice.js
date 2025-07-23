import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadAccount = createAsyncThunk('results/loadAccount', async ({accountCode}) => {
    console.log("START loadAccount ", accountCode)

    const response = await client.get( "/api/internal/accounts/" + accountCode.toString().replace(".", "-"))
    console.log("END loadAccount")
    return {data: response}

})

export const saveAccount = createAsyncThunk('results/saveAccount', async ({account}) => {
    console.log("START saveAccount ", account)

    let url = "/api/internal/accounts"
    let method = "POST"

    if (account.id) {
        url += "/" + account.id
        method = "PUT"
    }

    const response = await client.call(method, url, {account: account})
    console.log("END saveAccount")
    return {data: response}

})

export const searchForAccounts = createAsyncThunk('results/searchForAccounts', async ({searchText, includeBalances}) => {
    console.log("START searchForAccounts")

    const response = await client.post('/api/internal/accounts/search', { search_text: searchText, include_balances: includeBalances})
    console.log("END searchForAccounts")
    return {data: response}

})

const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = accountSlice.actions

export default accountSlice.reducer
