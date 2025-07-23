import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";
import {signInUser, signOutUser} from "./userSlice";

const initialState = {
}

export const saveProperty = createAsyncThunk('results/saveProperty', async ({property}) => {
    console.log("START saveProperty")

    let url = "/api/internal/properties"
    let response = null

    if (property.id) {
        url += "/" + property.id
        response  = await client.put(url, {property: property})
    }
    else {
        response = await client.post(url, {property: property})
    }

    console.log("END saveProperty")
    return {data: response}

})

export const uploadProperties = createAsyncThunk('results/uploadProperties', async ({propertiesUpload}) => {
    console.log("START uploadProperties")

    // Create an object of formData
    let formData = new FormData();

    // Update the formData object
    formData.append(
        "properties_upload",
        propertiesUpload,
        propertiesUpload.name
    );

    // Request made to the backend api
    // Send formData object
    let response = await client.post("/api/internal/properties/upload", formData, {forUpload: true})

    console.log("END uploadProperties")
    return {data: response}

})


export const activatePropertyForScreening = createAsyncThunk('results/activatePropertyForScreening', async ({property}) => {
    console.log("START activatePropertyForScreening", property)

    let url = "/api/internal/properties/" + property.id + "/screening_activation"
    let response  = await client.post(url, {property: property})

    console.log("END activatePropertyForScreening")
    return {data: response}

})

export const deactivateProperty = createAsyncThunk('results/deactivateProperty', async ({property}) => {
    console.log("START deactivateProperty", property)

    let url = "/api/internal/properties/" + property.id + "/deactivate"
    let response  = await client.post(url, {})

    console.log("END deactivateProperty")
    return {data: response}

})

export const reactivateProperty = createAsyncThunk('results/reactivateProperty', async ({property}) => {
    console.log("START reactivateProperty", property)

    let url = "/api/internal/properties/" + property.id + "/reactivate"
    let response  = await client.post(url, {})

    console.log("END reactivateProperty")
    return {data: response}

})

export const loadProperties = createAsyncThunk('results/loadProperties', async () => {
    console.log("START loadProperties")

    const response = await client.get('/api/internal/properties')
    console.log("END loadProperties")
    return {data: response}

})

export const searchForProperties = createAsyncThunk('results/searchForProperties', async ({searchText, status}) => {
    console.log("START searchForProperties")

    const response = await client.post('/api/internal/properties/search', {search_text: searchText, status: status})
    console.log("END searchForProperties")
    return {data: response}

})

export const loadPropertyOwner = createAsyncThunk('results/loadPropertyOwner', async ({propertyOwnerId}) => {
    console.log("START loadPropertyOwner")

    const response = await client.get("/api/internal/property_owners/" + propertyOwnerId)
    console.log("END loadPropertyOwner")
    return {data: response}

})

export const searchForPropertyOwners = createAsyncThunk('results/searchForPropertyOwners', async ({searchText, page}) => {
    console.log("START searchForPropertyOwners")

    const response = await client.post('/api/internal/property_owners/search', {search_text: searchText, page: page})
    console.log("END searchForPropertyOwners")
    return {data: response}

})

export const savePropertyOwner = createAsyncThunk('results/savePropertyOwner', async ({propertyOwner}) => {
    console.log("START savePropertyOwner")

    let url = "/api/internal/property_owners"
    let method = "POST"

    if (propertyOwner.id) {
        url += "/" + propertyOwner.id
        method = "PUT"
    }

    const response = await client.call(method, url, {property_owner: propertyOwner})
    console.log("END savePropertyOwner")
    return {data: response}

})

export const loadResidents = createAsyncThunk('results/loadResidents', async ({propertyId}) => {
    console.log("START loadResidents", propertyId)

    let url = "/api/internal/properties/" + propertyId + "/residents"
    let response  = await client.get(url, {})

    console.log("END loadResidents")
    return {data: response}
})

export const loadScreeningAttestations = createAsyncThunk('results/loadScreeningAttestations', async ({propertyId}) => {
    console.log("START loadScreeningAttestations", propertyId)

    let url = "/api/internal/properties/" + propertyId + "/screening_attestations"
    let response  = await client.get(url, {})

    console.log("END loadScreeningAttestations")
    return {data: response}
})

export const saveScreeningAttestations = createAsyncThunk('results/saveScreeningAttestations', async ({propertyId, attestationData, attestationAnswers}) => {
    console.log("START saveScreeningAttestations")

    let response = response = await client.post(`/api/internal/properties/${propertyId}/save_screening_attestations`, {attestation_data: attestationData, attestation_answers: attestationAnswers})

    console.log("END saveScreeningAttestations")
    return {data: response}

})

export const deletePropertyOwner = createAsyncThunk('results/deletePropertyOwner', async ({propertyOwnerId}) => {
    console.log("START deletePropertyOwner")

    const response = await client.delete("/api/internal/property_owners/" + propertyOwnerId)
    console.log("END deletePropertyOwner")
    return {data: response}
})

const propertySlice = createSlice({
    name: 'property',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = propertySlice.actions

export default propertySlice.reducer
