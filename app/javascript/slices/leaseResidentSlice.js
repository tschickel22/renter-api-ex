import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadLeaseResident = createAsyncThunk('results/loadLeaseResident', async ({leaseResidentId}) => {
    console.log("START loadLeaseResident ", leaseResidentId)

    const response = await client.get('/api/internal/lease_residents/' + leaseResidentId )
    console.log("END loadLeaseResident")
    return {data: response}

})

export const loadLeaseResidentReport = createAsyncThunk('results/loadLeaseResidentReport', async ({leaseResidentId, leaseResidentReportId}) => {
    console.log("START loadLeaseResidentReport ", leaseResidentId)

    const response = await client.get('/api/internal/lease_residents/' + leaseResidentId + '/reports/' + leaseResidentReportId )
    console.log("END loadLeaseResidentReport")
    return {data: response}

})

export const saveReportDisclaimerAcceptance = createAsyncThunk('results/saveReportDisclaimerAcceptance', async ({leaseResidentId, leaseResidentReportId}) => {
    console.log("START saveReportDisclaimerAcceptance ", leaseResidentId)

    const response = await client.post('/api/internal/lease_residents/' + leaseResidentId + '/reports/' + leaseResidentReportId  + '/accept_disclaimer', {})
    console.log("END saveReportDisclaimerAcceptance")
    return {data: response}

})

export const saveLeaseResident = createAsyncThunk('results/saveLeaseResident', async ({leaseResident, leaseAction}) => {
    console.log("START saveLeaseResident ", leaseResident)

    let method = "POST"
    let url = "/api/internal/lease_residents"

    if (leaseResident.hash_id) {
        url += "/" + leaseResident.hash_id
        method = "PUT"
    }

    const response = await client.call(method, url, {lease_resident: leaseResident, lease_action: leaseAction})
    console.log("END saveLeaseResident")
    return {data: response}
})

export const deleteLeaseResident = createAsyncThunk('results/deleteLeaseResident', async ({leaseResident}) => {
    console.log("START deleteLeaseResident ", leaseResident)

    const response = await client.call("DELETE", "/api/internal/lease_residents/" + leaseResident.hash_id)
    console.log("END deleteLeaseResident")
    return {data: response}
})


export const searchForLeaseResidents = createAsyncThunk('results/searchForLeaseResidents', async ({mode, searchText}) => {
    console.log("START searchForLeaseResidents ", searchText)

    const response = await client.post('/api/internal/lease_residents/search', {mode: mode, search_text: searchText} )
    console.log("END searchForLeaseResidents")
    return {data: response}
})

export const loadValidationQuestions = createAsyncThunk('results/loadValidationQuestions', async ({leaseResidentId}) => {
    console.log("START loadValidationQuestions ", leaseResidentId)

    const response = await client.get('/api/internal/lease_residents/' + leaseResidentId + '/validation_questions' )
    console.log("END loadValidationQuestions")
    return {data: response}
})

export const checkValidationAnswers = createAsyncThunk('results/checkValidationAnswers', async ({leaseResidentId, examId, answers}) => {
    console.log("START checkValidationAnswers ", leaseResidentId)

    const response = await client.post('/api/internal/lease_residents/' + leaseResidentId + '/validation_answers', {exam_id: examId, answers: answers} )
    console.log("END checkValidationAnswers")
    return {data: response}
})

export const requestLeaseResidentReports = createAsyncThunk('results/requestLeaseResidentReports', async ({leaseResidentId}) => {
    console.log("START requestLeaseResidentReports ", leaseResidentId)

    const response = await client.get('/api/internal/lease_residents/' + leaseResidentId + '/request_reports' )
    console.log("END requestLeaseResidentReports")
    return {data: response}
})

export const resendResidentEmail = createAsyncThunk('results/resendResidentEmail', async ({leaseResidentId, emailType}) => {
    console.log("START resendResidentEmail ", leaseResidentId, emailType)

    const response = await client.post('/api/internal/lease_residents/' + leaseResidentId + '/resend_email', {email_type: emailType} )
    console.log("END resendResidentEmail")
    return {data: response}

})

export const requestFullAccess = createAsyncThunk('results/requestFullAccess', async ({leaseResidentId}) => {
    console.log("START requestFullAccess ", leaseResidentId)

    const response = await client.post('/api/internal/lease_residents/' + leaseResidentId + '/request_full_access', {} )
    console.log("END requestFullAccess")
    return {data: response}

})

export const requestElectronicPayments = createAsyncThunk('results/requestElectronicPayments', async ({leaseResidentId}) => {
    console.log("START requestElectronicPayments ", leaseResidentId)

    const response = await client.post('/api/internal/lease_residents/' + leaseResidentId + '/request_electronic_payments', {} )
    console.log("END requestElectronicPayments")
    return {data: response}

})


const leaseResidentSlice = createSlice({
    name: 'leaseResident',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = leaseResidentSlice.actions

export default leaseResidentSlice.reducer
