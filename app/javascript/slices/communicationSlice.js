import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadCommunication = createAsyncThunk('results/loadCommunication', async ({communicationId}) => {
    console.log("START loadCommunication", communicationId)

    let response  = await client.get("/api/internal/communications/"+communicationId)

    console.log("END loadCommunication")
    return {data: response}

})

export const searchForCommunications = createAsyncThunk('results/searchForCommunications', async ({searchText, type, subType, relatedObjectType, relatedObjectHashId, propertyId, format}) => {
    console.log("START searchForCommunications", relatedObjectHashId)

    const response = await client.post('/api/internal/communications/search', {search_text: searchText, related_object_type: relatedObjectType, related_object_hash_id: relatedObjectHashId, type: type, sub_type: subType, property_id: propertyId, format: format})
    console.log("END searchForCommunications")
    return {data: response}

})

export const loadConversations = createAsyncThunk('results/loadConversations', async ({searchText, propertyId}) => {
    console.log("START loadConversations")

    const response = await client.post('/api/internal/communications/conversations', {search_text: searchText, property_id: propertyId})
    console.log("END loadConversations")
    return {data: response}

})


export const saveCommunication = createAsyncThunk('results/saveCommunication', async ({communication, relatedObjectType, relatedObjectHashId}) => {
    console.log("START saveCommunication")

    let url = "/api/internal/communications"
    let method = "POST"

    if (communication.hash_id) {
        url += "/" + communication.hash_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {communication: communication, related_object_type: relatedObjectType, related_object_hash_id: relatedObjectHashId})

    console.log("END saveCommunication")
    return {data: response}

})

export const markCommunicationAsRead = createAsyncThunk('results/markCommunicationAsRead', async ({communication}) => {
    console.log("START markCommunicationAsRead")

    let response  = await client.post("/api/internal/communications/" + communication.hash_id + "/read", {})

    console.log("END markCommunicationAsRead")
    return {data: response}

})

export const markConversationAsRead = createAsyncThunk('results/markConversationAsRead', async ({relatedObjectHashId, relatedObjectType, type}) => {
    console.log("START markConversationAsRead", relatedObjectType, relatedObjectHashId)

    let response  = await client.post("/api/internal/communications/" + relatedObjectHashId + "/mark_conversation_read", {type: type, related_object_type: relatedObjectType})

    console.log("END markConversationAsRead")
    return {data: response}

})

export const trashCommunication = createAsyncThunk('results/trashCommunication', async ({communication}) => {
    console.log("START trashCommunication")

    let response  = await client.post("/api/internal/communications/" + communication.hash_id + "/trash", {})

    console.log("END trashCommunication")
    return {data: response}

})


export const deleteCommunication = createAsyncThunk('results/deleteCommunication', async ({communication}) => {
    console.log("START deleteCommunication")

    let response  = await client.delete("/api/internal/communications/" + communication.hash_id, {})

    console.log("END deleteCommunication")
    return {data: response}

})

export const trashConversation = createAsyncThunk('results/trashConversation', async ({leaseResidentId, type}) => {
    console.log("START trashConversation")

    let response  = await client.post("/api/internal/communications/" + leaseResidentId + "/trash_conversation", {type: type})

    console.log("END trashConversation")
    return {data: response}

})

export const deleteConversation = createAsyncThunk('results/deleteConversation', async ({leaseResidentId, type}) => {
    console.log("START deleteConversation")

    let response  = await client.post("/api/internal/communications/" + leaseResidentId + "/destroy_conversation", {type: type})

    console.log("END deleteConversation")
    return {data: response}

})




const communicationSlice = createSlice({
    name: 'communication',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = communicationSlice.actions

export default communicationSlice.reducer
