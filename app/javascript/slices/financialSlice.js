import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const getFinancialSummary = createAsyncThunk('results/getFinancialSummary', async ({startDate, endDate, propertyId, searchText}) => {
    console.log("START getFinancialSummary")

    const response = await client.post('/api/internal/financials/summary', {start_date: startDate, end_date: endDate, property_id: propertyId, search_text: searchText})
    console.log("END getFinancialSummary")
    return {data: response}

})

const financialSlice = createSlice({
    name: 'financial',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {


    }
})

export const {} = financialSlice.actions

export default financialSlice.reducer
