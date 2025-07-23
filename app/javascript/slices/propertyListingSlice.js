import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForPropertyListings = createAsyncThunk('results/searchForPropertyListings', async ({propertyId, searchText, status, propertyListingId, entireCompany}) => {
    console.log("START searchForPropertyListings")

    let post_data = null

    if (propertyListingId) {
        post_data = {property_listing_id: propertyListingId, entire_company: entireCompany}
    }
    else {
        post_data = {property_id: propertyId, search_text: searchText, status: status}
    }

    const response = await client.post('/api/internal/property_listings/search', post_data)

    console.log("END searchForPropertyListings")
    return {data: response}

})


export const savePropertyListing = createAsyncThunk('results/savePropertyListing', async ({propertyListing}) => {
    console.log("START savePropertyListing")

    let url = "/api/internal/property_listings"
    let method = "POST"

    if (propertyListing.hash_id) {
        url += "/" + propertyListing.property_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {property_listing: propertyListing})

    console.log("END savePropertyListing")
    return {data: response}

})

export const loadPropertyListing = createAsyncThunk('results/loadPropertyListing', async ({propertyId}) => {
    console.log("START loadPropertyListing")

    const response = await client.get('/api/internal/property_listings/' + propertyId )
    console.log("END loadPropertyListing")
    return {data: response}

})

export const getPhotos = createAsyncThunk('results/getPhotos', async ({propertyListingId}) => {
    console.log("START getPhotos")

    const response = await client.get("/api/internal/property_listings/" + propertyListingId + "/photos")
    console.log("END getPhotos")
    return {data: response}

})



const propertyListingSlice = createSlice({
    name: 'propertyListing',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = propertyListingSlice.actions

export default propertyListingSlice.reducer
