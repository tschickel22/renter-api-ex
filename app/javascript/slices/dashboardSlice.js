import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {
    globalFormUpdate: null,
    alertMessage: "",
    alertLinkText: "",
    alertUrl: "",
    alertNavigateState: null,
    alertHideCloseOption: false,
    isMobileDevice: false,
    railsEnv: "",
    offerInsurance: true
}

export const loadDashboard = createAsyncThunk('results/loadDashboard', async () => {
    console.log("START loadDashboard")

    const response = await client.get('/api/internal/dashboard')

    console.log("END loadDashboard")
    return {data: response}

})

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        loadDashboardFromRails(state, action) {
            state.isMobileDevice = (window.innerWidth <= 992)

            if (action.payload) {
                state.railsEnv = action.payload.railsEnv
                state.offerInsurance = action.payload.offerInsurance
            }
        },
        displayAlertMessage(state, action) {
            state.alertMessage = action.payload.message
            state.alertLinkText = action.payload.linkText
            state.alertUrl = action.payload.url
            state.alertHideCloseOption = action.payload.hideCloseOption
            state.alertNavigateState = {state: action.payload.navigateState}

        },
        updateIsMobileDevice(state, action) {
            state.isMobileDevice = action.payload;
        },
    },
    extraReducers: (builder) => {

    }
})

export const {displayAlertMessage, loadDashboardFromRails, updateIsMobileDevice} = dashboardSlice.actions

export default dashboardSlice.reducer
