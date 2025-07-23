import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadJournalEntry = createAsyncThunk('results/loadJournalEntry', async ({journalEntryId}) => {
    console.log("START loadJournalEntry", journalEntryId)

    let response  = await client.get("/api/internal/journal_entries/"+journalEntryId)

    console.log("END loadJournalEntry")
    return {data: response}

})

export const saveJournalEntry = createAsyncThunk('results/saveJournalEntry', async ({journalEntry}) => {
    console.log("START saveJournalEntry")

    let url = "/api/internal/journal_entries"
    let method = "POST"

    if (journalEntry.hash_id) {
        url += "/" + journalEntry.hash_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {journal_entry: journalEntry})

    console.log("END saveJournalEntry")
    return {data: response}

})

export const deleteJournalEntry = createAsyncThunk('results/deleteJournalEntry', async ({journalEntry}) => {
    console.log("START deleteJournalEntry")

    let response  = await client.delete("/api/internal/journal_entries/" + journalEntry.hash_id, {})

    console.log("END deleteJournalEntry")
    return {data: response}

})

export const searchForJournalEntries = createAsyncThunk('results/searchForJournalEntries', async ({searchText, excludeRecurring, status}) => {
    console.log("START searchForJournalEntries")

    const response = await client.post('/api/internal/journal_entries/search', {search_text: searchText, exclude_recurring: excludeRecurring, status: status})
    console.log("END searchForJournalEntries")
    return {data: response}

})

export const getDocuments = createAsyncThunk('results/getDocuments', async ({journalEntryId}) => {
    console.log("START getDocuments")

    const response = await client.get("/api/internal/journal_entries/" + journalEntryId + "/documents")
    console.log("END getDocuments")
    return {data: response}

})


const journalEntrySlice = createSlice({
    name: 'journalEntry',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = journalEntrySlice.actions

//export default journalEntrySlice.reducer
