import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadTaxReportings = createAsyncThunk('results/loadTaxReportings', async ({reportYear, searchText}) => {
    console.log("START loadTaxReportings")

    const response = await client.post("/api/internal/tax_reporting/search", {report_year: reportYear, search_text: searchText}, {})
    console.log("END loadTaxReportings")
    return {data: response}

})

export const submitTaxReportings = createAsyncThunk('results/submitTaxReportings', async ({taxReportingIds}) => {
    console.log("START submitTaxReportings")

    const response = await client.post('/api/internal/tax_reporting/submit', {tax_reporting_ids: taxReportingIds})
    console.log("END submitTaxReportings")
    return {data: response}

})

const taxReportingSlice = createSlice({
    name: 'taxReporting',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {


    }
})

export const {} = taxReportingSlice.actions

export default taxReportingSlice.reducer
