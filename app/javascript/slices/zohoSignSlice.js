import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadZohoSignOAuthToken = createAsyncThunk('results/loadZohoSignIntegrationDetails', async (externalDocumentId) => {
    console.log("START loadZohoSignIntegrationDetails ")

    const response = await client.get(`/api/internal/zoho_sign/integration_details/${externalDocumentId}`)
    console.log("END loadZohoSignIntegrationDetails")
    return {data: response}

})

export const loadTemplates = createAsyncThunk('results/loadZohoSignTemplates', async ({propertyId}) => {
    console.log("START loadZohoSignTemplates ", propertyId)

    const response = await client.get("/api/internal/zoho_sign/templates")
    console.log("END loadZohoSignTemplates")
    return {data: response}

})

export const createTemplate = createAsyncThunk('results/loadZohoSignCreateTemplate', async ({ template }) => {
    console.log(template);
    console.log("START loadZohoSignCreateTemplate ", template)

    const response = await client.post( "/api/internal/zoho_sign/create_new_template", { template: template})
    console.log("END loadZohoSignCreateTemplate")
    return {data: response}

})

const zohoSignSlice = createSlice({
    name: 'zohoSign',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = zohoSignSlice.actions

export default zohoSignSlice.reducer
