import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const searchForAnnouncements = createAsyncThunk('results/searchForAnnouncements', async ({searchText}) => {
    console.log("START searchForAnnouncements")

    const response = await client.post('/api/internal/announcements/search', {search_text: searchText})
    console.log("END searchForAnnouncements")
    return {data: response}

})

export const loadAnnouncement = createAsyncThunk('results/loadAnnouncement', async ({announcementId}) => {
    console.log("START loadAnnouncement")

    const response = await client.get('/api/internal/announcements/' + announcementId)
    console.log("END loadAnnouncement")
    return {data: response}

})

export const loadAnnouncementRecipientLeaseResidents = createAsyncThunk('results/loadAnnouncementRecipientLeaseResidents', async ({announcementId, searchText}) => {
    console.log("START loadAnnouncementRecipientLeaseResidents")

    const response = await client.post('/api/internal/announcements/' + announcementId + '/recipient_lease_residents', {search_text: searchText})
    console.log("END loadAnnouncementRecipientLeaseResidents")
    return {data: response}

})



export const saveAnnouncement = createAsyncThunk('results/saveAnnouncement', async ({announcement}) => {
    console.log("START saveAnnouncement")

    let url = "/api/internal/announcements"
    let method = "POST"

    if (announcement.id) {
        url += "/" + announcement.hash_id
        method = "PUT"
    }

    const response = await client.call(method, url, {announcement: announcement})
    console.log("END saveAnnouncement")
    return {data: response}

})

export const sendAnnouncement = createAsyncThunk('results/sendAnnouncement', async ({announcementId}) => {
    console.log("START sendAnnouncement")

    const response = await client.post("/api/internal/announcements/"+announcementId+"/queue_for_delivery", {})
    console.log("END sendAnnouncement")
    return {data: response}

})

export const saveAnnouncementRecipients = createAsyncThunk('results/saveAnnouncementRecipients', async ({announcementId, announcementRecipients}) => {
    console.log("START saveAnnouncementRecipients")

    const response = await client.post('/api/internal/announcements/' + announcementId + '/save_recipients', {announcement: {announcement_recipients: announcementRecipients}})
    console.log("END saveAnnouncementRecipients")
    return {data: response}

})

export const cloneAnnouncement = createAsyncThunk('results/cloneAnnouncement', async ({announcementId}) => {
    console.log("START cloneAnnouncement")

    const response = await client.post('/api/internal/announcements/' + announcementId + '/clone', {})
    console.log("END cloneAnnouncement")
    return {data: response}

})

export const deleteAnnouncement = createAsyncThunk('results/deleteAnnouncement', async ({announcementId}) => {
    console.log("START deleteAnnouncement")

    const response = await client.delete('/api/internal/announcements/' + announcementId )
    console.log("END deleteAnnouncement")
    return {data: response}

})

export const getAnnouncementAttachments = createAsyncThunk('results/getAnnouncementAttachments', async ({announcementId}) => {
    console.log("START getAnnouncementAttachments")

    const response = await client.get("/api/internal/announcements/" + announcementId + "/attachments")
    console.log("END getAnnouncementAttachments")
    return {data: response}

})


const announcementSlice = createSlice({
    name: 'announcement',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = announcementSlice.actions
//export default expenseSlice.reducer
