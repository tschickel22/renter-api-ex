import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForUnprintedChecks = createAsyncThunk('results/searchForUnprintedChecks', async () => {
    console.log("START searchForUnprintedChecks")

    const response = await client.post('/api/internal/printed_checks/search', {status: "queued"})
    console.log("END searchForUnprintedChecks")
    return {data: response}

})

export const searchForPrintedChecks = createAsyncThunk('results/searchForPrintedChecks', async () => {
    console.log("START searchForPrintedChecks")

    const response = await client.post('/api/internal/printed_checks/search', {status: "printed"})
    console.log("END searchForPrintedChecks")
    return {data: response}

})

export const saveUnprintedChecks = createAsyncThunk('results/saveUnprintedChecks', async ({printedChecks}) => {
    console.log("START saveUnprintedChecks ", printedChecks)

    const response = await client.post("/api/internal/printed_checks/update_unprinted_checks", {printed_checks: printedChecks})
    console.log("END saveUnprintedChecks")
    return {data: response}
})

export const deleteUnprintedChecks = createAsyncThunk('results/deleteUnprintedChecks', async ({printedChecks}) => {
    console.log("START deleteUnprintedChecks ", printedChecks)

    const response = await client.post("/api/internal/printed_checks/delete_unprinted_checks", {printed_checks: printedChecks})
    console.log("END deleteUnprintedChecks")
    return {data: response}
})

export const reprintChecks = createAsyncThunk('results/reprintChecks', async ({printedChecks}) => {
    console.log("START reprintChecks ", printedChecks)

    const response = await client.post("/api/internal/printed_checks/reprint_checks", {printed_checks: printedChecks})
    console.log("END reprintChecks")
    return {data: response}
})

const printedCheckSlice = createSlice({
    name: 'printedCheck',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = printedCheckSlice.actions
//export default expenseSlice.reducer
