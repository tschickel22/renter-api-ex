import {createAsyncThunk, createSlice,} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const saveVendor = createAsyncThunk('results/saveVendor', async ({vendor}) => {
    console.log("START saveVendor")

    let url = "/api/internal/vendors"
    let method = "POST"

    if (vendor.id) {
        url += "/" + vendor.id
        method = "PUT"
    }

    const response = await client.call(method, url, {vendor: vendor})
    console.log("END saveVendor")
    return {data: response}

})

export const deleteVendor = createAsyncThunk('results/deleteVendor', async ({vendorId}) => {
    console.log("START deleteVendor ")

    const response = await client.delete("/api/internal/vendors/" + vendorId, {})
    console.log("END deleteVendor")
    return {data: response}
})



export const saveVendorCategory = createAsyncThunk('results/saveVendorCategory', async ({vendorCategory}) => {
    console.log("START saveVendorCategory")

    let url = "/api/internal/vendors/save_vendor_category"
    let method = "POST"

    const response = await client.call(method, url, {vendor_category: vendorCategory})
    console.log("END saveVendorCategory")
    return {data: response}

})

export const searchForVendors = createAsyncThunk('results/searchForVendors', async ({searchText}) => {
    console.log("START searchForVendors")

    const response = await client.post('/api/internal/vendors/search', {search_text: searchText})
    console.log("END searchForVendors")
    return {data: response}

})

export const loadVendor = createAsyncThunk('results/loadVendor', async ({vendorId}) => {
    console.log("START loadVendor")

    const response = await client.get("/api/internal/vendors/" + vendorId)
    console.log("END loadVendor")
    return {data: response}

})

export const getVendorInsuranceDeclarations = createAsyncThunk('results/getVendorInsuranceDeclarations', async ({vendorInsuranceId}) => {
    console.log("START getVendorInsuranceDeclarations")

    const response = await client.get("/api/internal/vendor_insurances/" + vendorInsuranceId + "/declarations")
    console.log("END getVendorInsuranceDeclarations")
    return {data: response}

})

export const getVendorLicenseLicenses = createAsyncThunk('results/getVendorLicenseLicenses', async ({vendorLicenseId}) => {
    console.log("START getVendorLicenseLicenses")

    const response = await client.get("/api/internal/vendor_licenses/" + vendorLicenseId + "/licenses")
    console.log("END getVendorLicenseLicenses")
    return {data: response}

})


const vendorSlice = createSlice({
    name: 'vendor',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = vendorSlice.actions

export default vendorSlice.reducer
