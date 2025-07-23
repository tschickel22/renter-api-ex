import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const runReport = createAsyncThunk('results/runReport', async ({reportId, reportParams, format}) => {
    console.log("START runReport")
    const response = await client.post('/api/internal/reports/' + reportId +'/run', {report: reportParams, format: format})
    console.log("END runReport")
    return {data: response}

})

const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = reportSlice.actions

export default reportSlice.reducer
