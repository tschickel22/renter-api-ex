import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForUnitListings = createAsyncThunk('results/searchForUnitListings', async ({propertyId, searchText, status: status}) => {
    console.log("START searchForUnitListings")

    const response = await client.post('/api/internal/unit_listings/search', {property_id: propertyId, search_text: searchText, status: status})
    console.log("END searchForUnitListings")
    return {data: response}

})


export const saveUnitListing = createAsyncThunk('results/saveUnitListing', async ({unitListing}) => {
    console.log("START saveUnitListing")

    let url = "/api/internal/unit_listings/" + unitListing.unit_id
    let method = "PUT"

    let response  = await client.call(method, url, {unit_listing: unitListing})

    console.log("END saveUnitListing")
    return {data: response}

})

export const saveUnitListings = createAsyncThunk('results/saveUnitListings', async ({propertyId, unitListings}) => {
    console.log("START saveUnitListings")

    let url = "/api/internal/unit_listings"
    let method = "POST"

    let response  = await client.call(method, url, {property_id: propertyId, unit_listings: unitListings})

    console.log("END saveUnitListings")
    return {data: response}

})


export const loadUnitListingsForDisplay = createAsyncThunk('results/loadUnitListingsForDisplay', async ({unitId}) => {
    console.log("START loadUnitListingsForDisplay")

    const response = await client.get('/api/internal/unit_listings/' + unitId )
    console.log("END loadUnitListingsForDisplay")
    return {data: response}

})

export const getPhotos = createAsyncThunk('results/getPhotos', async ({unitListingId}) => {
    console.log("START getPhotos")

    const response = await client.get("/api/internal/unit_listings/" + unitListingId + "/photos")
    console.log("END getPhotos")
    return {data: response}

})



const unitListingSlice = createSlice({
    name: 'unitListing',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = unitListingSlice.actions

export default unitListingSlice.reducer
