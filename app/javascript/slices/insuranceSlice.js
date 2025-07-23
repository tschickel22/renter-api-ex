import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadInsurance = createAsyncThunk('results/loadInsurance', async ({leaseId}) => {
    console.log("START loadInsurance ", leaseId)

    const response = await client.post('/api/internal/insurances/search', {lease_id: leaseId})
    console.log("END loadInsurance")
    return {data: response}

})

export const deleteInsurance = createAsyncThunk('results/deleteInsurance', async ({insurance}) => {
    console.log("START deleteInsurance")

    let response  = await client.delete("/api/internal/insurances/" + insurance.id, {})

    console.log("END deleteInsurance")
    return {data: response}

})

export const saveInsurance = createAsyncThunk('results/saveInsurance', async ({insurance}) => {
    console.log("START saveInsurance ", insurance)

    let url = "/api/internal/insurances"
    let method = "POST"

    if (insurance.id) {
        method = "PUT"
        url += "/"+ insurance.hash_id
    }

    const response = await client.call(method, url, {insurance: insurance})
    console.log("END saveInsurance")
    return {data: response}
})

export const switchInsurancePartner = createAsyncThunk('results/switchInsurancePartner', async ({insurance}) => {
    console.log("START switchInsurancePartner ", insurance)

    let url = "/api/internal/insurances/switch_api_partner"
    let method = "POST"

    const response = await client.call(method, url, {insurance: insurance})
    console.log("END switchInsurancePartner")
    return {data: response}
})

export const confirmInsurance = createAsyncThunk('results/confirmInsurance', async (_) => {
    console.log("START confirmInsurance")

    let url = "/api/internal/insurances/confirm"

    const response = await client.post(url, {})
    console.log("END confirmInsurance")
    return {data: response}
})


export const getDeclarations = createAsyncThunk('results/getDeclarations', async ({insuranceId}) => {
    console.log("START getDeclarations")

    const response = await client.get("/api/internal/insurances/" + insuranceId + "/declarations")
    console.log("END getDeclarations")
    return {data: response}

})


const insuranceSlice = createSlice({
    name: 'insurance',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = insuranceSlice.actions

export default insuranceSlice.reducer
