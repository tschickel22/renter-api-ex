import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadResidentPet = createAsyncThunk('results/loadResidentPet', async ({residentPetId}) => {
    console.log("START loadResidentPet ", residentPetId)

    const response = await client.get('/api/internal/resident_pets/' + residentPetId )
    console.log("END loadResidentPet")
    return {data: response}

})

export const deleteResidentPet = createAsyncThunk('results/deleteResidentPet', async ({residentPet}) => {
    console.log("START deleteResidentPet")

    let response  = await client.delete("/api/internal/resident_pets/" + residentPet.id, {})

    console.log("END deleteResidentPet")
    return {data: response}

})


export const saveResidentPet = createAsyncThunk('results/saveResidentPet', async ({residentPet}) => {
    console.log("START saveResidentPet ", residentPet)

    let url = "/api/internal/resident_pets"
    let method = "POST"

    if (residentPet.id) {
        method = "PUT"
        url += "/"+ residentPet.id
    }

    const response = await client.call(method, url, {resident_pet: residentPet})
    console.log("END saveResidentPet")
    return {data: response}
})

const residentPetSlice = createSlice({
    name: 'residentPet',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = residentPetSlice.actions

export default residentPetSlice.reducer
