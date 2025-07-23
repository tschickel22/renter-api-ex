import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadMaintenanceRequest = createAsyncThunk('results/loadMaintenanceRequest', async ({maintenanceRequestId, editMode}) => {
    console.log("START loadMaintenanceRequest", maintenanceRequestId)

    let response  = await client.get("/api/internal/maintenance_requests/"+maintenanceRequestId+"?edit_mode="+editMode)

    console.log("END loadMaintenanceRequest")
    return {data: response}

})

export const loadMaintenanceRequestAssignees = createAsyncThunk('results/loadMaintenanceRequestAssignees', async (_) => {
    console.log("START loadMaintenanceRequestAssignees")

    let response  = await client.get("/api/internal/maintenance_requests/assignees")

    console.log("END loadMaintenanceRequestAssignees")
    return {data: response}

})



export const saveMaintenanceRequest = createAsyncThunk('results/saveMaintenanceRequest', async ({maintenanceRequest, editMode}) => {
    console.log("START saveMaintenanceRequest")

    let url = "/api/internal/maintenance_requests"
    let method = "POST"

    if (maintenanceRequest.hash_id) {
        url += "/" + maintenanceRequest.hash_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {maintenance_request: maintenanceRequest, edit_mode: editMode})

    console.log("END saveMaintenanceRequest")
    return {data: response}

})

export const closeMaintenanceRequest = createAsyncThunk('results/closeMaintenanceRequest', async ({maintenanceRequest}) => {
    console.log("START closeMaintenanceRequest")

    let response  = await client.post("/api/internal/maintenance_requests/" + maintenanceRequest.hash_id + "/close", {})

    console.log("END closeMaintenanceRequest")
    return {data: response}

})

export const loadMaintenanceRequestPrintView = createAsyncThunk('results/loadMaintenanceRequestPrintView', async ({maintenanceRequest}) => {
    console.log("START loadMaintenanceRequestPrintView")

    let response  = await client.get("/api/internal/maintenance_requests/" + maintenanceRequest.hash_id + "/print?hide_buttons=true", {forDownload: true})

    console.log("END loadMaintenanceRequestPrintView")
    return {data: response}

})

export const searchForMaintenanceRequests = createAsyncThunk('results/searchForMaintenanceRequests', async ({searchText, excludeRecurring, status}) => {
    console.log("START searchForMaintenanceRequests")

    const response = await client.post('/api/internal/maintenance_requests/search', {search_text: searchText, exclude_recurring: excludeRecurring, status: status})
    console.log("END searchForMaintenanceRequests")
    return {data: response}

})

const maintenanceRequestSlice = createSlice({
    name: 'maintenanceRequest',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = maintenanceRequestSlice.actions

export default maintenanceRequestSlice.reducer
