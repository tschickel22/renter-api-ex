import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadResident = createAsyncThunk('results/loadResident', async ({residentId}) => {
    console.log("START loadResident ", residentId)

    const response = await client.get('/api/internal/residents/' + residentId )
    console.log("END loadResident")
    return {data: response}

})

export const saveResident = createAsyncThunk('results/saveResident', async ({resident}) => {
    console.log("START saveResident ", resident)

    const response = await client.call("PUT", "/api/internal/residents/" + resident.hash_id, {resident: resident})
    console.log("END saveResident")
    return {data: response}
})

export const uploadResidents = createAsyncThunk('results/uploadResidents', async ({residentsUpload}) => {
    console.log("START uploadResidents")

    // Create an object of formData
    let formData = new FormData();

    // Update the formData object
    formData.append(
        "residents_upload",
        residentsUpload,
        residentsUpload.name
    );

    // Request made to the backend api
    // Send formData object
    let response = await client.post("/api/internal/residents/upload", formData, {forUpload: true})

    console.log("END uploadResidents")
    return {data: response}

})

export const loadCreditReportingActivities= createAsyncThunk('results/loadCreditReportingActivities', async ({residentId}) => {
    console.log("START loadCreditReportingActivities ", residentId)

    const response = await client.get('/api/internal/residents/' + residentId + '/credit_reporting_activities' )
    console.log("END loadCreditReportingActivities")
    return {data: response}

})

const residentSlice = createSlice({
    name: 'resident',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = residentSlice.actions

export default residentSlice.reducer
