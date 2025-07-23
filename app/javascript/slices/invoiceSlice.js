import {createAsyncThunk, createSlice,} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForInvoices = createAsyncThunk('results/searchForInvoices', async ({leaseId, searchText}) => {
    console.log("START searchForInvoices")

    const response = await client.post('/api/internal/invoices/search', {lease_id: leaseId, search_text: searchText})
    console.log("END searchForInvoices")
    return {data: response}

})

export const loadInvoice = createAsyncThunk('results/loadInvoice', async ({invoiceId}) => {
    console.log("START loadInvoice")

    const response = await client.get("/api/internal/invoices/" + invoiceId)
    console.log("END loadInvoice")
    return {data: response}

})

export const generateBarCode = createAsyncThunk('results/generateBarCode', async ({leaseResidentId}) => {
    console.log("START generateBarCode")

    const response = await client.get(`/print/${leaseResidentId}/cash_pay_coupon_bar_code.json`)
    console.log("END generateBarCode")
    return {data: response}

})

const invoiceSlice = createSlice({
    name: 'invoice',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = invoiceSlice.actions

export default invoiceSlice.reducer
