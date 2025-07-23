import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadResidentVehicle = createAsyncThunk('results/loadResidentVehicle', async ({residentVehicleId}) => {
    console.log("START loadResidentVehicle ", residentVehicleId)

    const response = await client.get('/api/internal/resident_vehicles/' + residentVehicleId )
    console.log("END loadResidentVehicle")
    return {data: response}

})

export const deleteResidentVehicle = createAsyncThunk('results/deleteResidentVehicle', async ({residentVehicle}) => {
    console.log("START deleteResidentVehicle")

    let response  = await client.delete("/api/internal/resident_vehicles/" + residentVehicle.id, {})

    console.log("END deleteResidentVehicle")
    return {data: response}

})

export const saveResidentVehicle = createAsyncThunk('results/saveResidentVehicle', async ({residentVehicle}) => {
    console.log("START saveResidentVehicle ", residentVehicle)

    let url = "/api/internal/resident_vehicles"
    let method = "POST"

    if (residentVehicle.id) {
        method = "PUT"
        url += "/"+ residentVehicle.id
    }

    const response = await client.call(method, url, {resident_vehicle: residentVehicle})

    console.log("END saveResidentVehicle")
    return {data: response}
})


const residentVehicleSlice = createSlice({
    name: 'residentVehicle',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = residentVehicleSlice.actions

export default residentVehicleSlice.reducer
