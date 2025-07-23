import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForUnits = createAsyncThunk('results/searchForUnits', async ({propertyId, searchText, status: status}) => {
    console.log("START searchForUnits")

    const response = await client.post('/api/internal/units/search', {property_id: propertyId, search_text: searchText, status: status})
    console.log("END searchForUnits")
    return {data: response}

})


export const loadUnit = createAsyncThunk('results/loadUnit', async ({unitId}) => {
    console.log("START loadUnit")

    const response = await client.get('/api/internal/units/' + unitId )
    console.log("END loadUnit")
    return {data: response}

})

export const deleteUnit = createAsyncThunk('results/deleteUnit', async ({unitId}) => {
    console.log("START deleteUnit")

    const response = await client.delete("/api/internal/units/" + unitId, {})
    console.log("END deleteUnit")
    return {data: response}

})




const unitSlice = createSlice({
    name: 'unit',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {

    }
})

export const {} = unitSlice.actions

export default unitSlice.reducer
