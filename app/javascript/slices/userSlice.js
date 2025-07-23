import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";
import {saveResident} from "./residentSlice";
import moment from "moment";


const initialState = {
    currentUser: null,
    currentActualUser: null,
    userStateLoaded: false,

    startDate: moment(new Date()).subtract(30, 'days').format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
    searchText: ""
}

export const signInUser = createAsyncThunk('results/signInUser', async ({email, password}) => {
    console.log("START signInUser ", email)

    const response = await client.post("/users/sign_in", {user: {email: email, password: password}})
    console.log("END signInUser")
    return {data: response}

})

export const signOutUser = createAsyncThunk('results/signOutUser', async (_) => {
    console.log("START signOutUser ")

    const response = await client.delete("/users/sign_out")

    console.log("END signOutUser")
    return {data: response}

})

export const sendForgotPasswordInstructions = createAsyncThunk('results/sendForgotPasswordInstructions', async ({email}) => {
    console.log("START sendForgotPasswordInstructions ", email)

    const response = await client.post("/users/password", {user: {email: email}})
    console.log("END sendForgotPasswordInstructions")
    return {data: response}

})

export const savePassword = createAsyncThunk('results/savePassword', async ({password, passwordConfirmation, resetPasswordToken}) => {
    console.log("START savePassword ")

    const response = await client.put("/users/password", {user: {password: password, password_confirmation: passwordConfirmation, reset_password_token: resetPasswordToken}})
    console.log("END savePassword")
    return {data: response}

})

export const searchForUsers = createAsyncThunk('results/searchForUsers', async ({searchText, userRoleName, page}) => {
    console.log("START searchForUsers ", searchText)

    const response = await client.post("/api/internal/users/search", {search_text: searchText, user_role_name: userRoleName, page: page})
    console.log("END searchForUsers")
    return {data: response}

})

// This is to be used when signing up
export const createUser = createAsyncThunk('results/createUser', async ({user}) => {
    console.log("START createUser ", user)

    const response = await client.post("/users", {user: user})
    console.log("END createUser")
    return {data: response}

})

export const loadUser = createAsyncThunk('results/loadUser', async ({userId}) => {
    console.log("START loadUser")

    const response = await client.get("/api/internal/users/" + userId)
    console.log("END loadUser")
    return {data: response}

})

export const saveUser = createAsyncThunk('results/saveUser', async ({user}) => {
    console.log("START saveUser")

    let response = null

    if (user.hash_id) {
        response = await client.put("/api/internal/users/" + user.hash_id, {user: user})
    }
    else {
        response = await client.post("/api/internal/users", {user: user})
    }

    console.log("END saveUser")
    return {data: response}

})

export const deleteUser = createAsyncThunk('results/deleteUser', async ({user}) => {
    console.log("START deleteUser")

    let response  = await client.delete("/api/internal/users/" + user.hash_id, {})

    console.log("END deleteUser")
    return {data: response}

})

export const searchForUserRoles = createAsyncThunk('results/searchForUserRoles', async ({searchText}) => {
    console.log("START searchForUserRoles")

    const response = await client.post('/api/internal/user_roles/search', {search_text: searchText})
    console.log("END searchForUserRoles")
    return {data: response}

})


export const loadUserRole = createAsyncThunk('results/loadUser', async ({userRoleId}) => {
    console.log("START loadUserRole")

    const response = await client.get("/api/internal/user_roles/" + userRoleId)
    console.log("END loadUserRole")
    return {data: response}

})

export const saveUserRole = createAsyncThunk('results/saveUserRole', async ({userRole}) => {
    console.log("START saveUserRole")

    let response = null

    if (userRole.hash_id) {
        response = await client.put("/api/internal/user_roles/" + userRole.hash_id, {user_role: userRole})
    }
    else {
        response = await client.post("/api/internal/user_roles", {user_role: userRole})
    }

    console.log("END saveUserRole")
    return {data: response}

})

export const upgradeUserSubscription = createAsyncThunk('results/upgradeUserSubscription', async ({planCode}) => {
    console.log("START upgradeUserSubscription ", planCode)

    const response = await client.post("/api/internal/users/upgrade_subscription", {plan_code: planCode})
    console.log("END upgradeUserSubscription")
    return {data: response}

})

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        loadUserFromRails(state, action) {
            console.log("START loadUserFromRails")

            if (action.payload) {
                state.currentUser = action.payload.currentUser
                state.currentActualUser = action.payload.currentActualUser
                state.userStateLoaded = true

                if (state.currentActualUser && state.currentUser && state.currentActualUser.id == state.currentUser.id) {
                    pendo.initialize({
                        visitor: {
                            id:         state.currentUser.id,   // Required if user is logged in, default creates anonymous ID
                            email:      state.currentUser.email, // Recommended if using Pendo Feedback, or NPS Email
                            full_name:  state.currentUser.name, // Recommended if using Pendo Feedback
                            role:       state.currentUser.user_type,
                            company_id:       state.currentUser.company_id
                        },

                        account: {
                            id:           state.currentUser.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
                            name:         state.currentUser.name
                            // is_paying:    // Recommended if using Pendo Feedback
                            // monthly_value:// Recommended if using Pendo Feedback
                            // planLevel:    // Optional
                            // planPrice:    // Optional
                            // creationDate: // Optional

                            // You can add any additional account level key-values here,
                            // as long as it's not one of the above reserved names.
                        }
                    });
                }
            }

            console.log("END loadUserFromRails")
        },

        setDates(state, action) {
            state.startDate = action.payload.startDate
            state.endDate = action.payload.endDate
        },
        setSearchText(state, action) {
            state.searchText = action.payload.searchText
        }
    },
    extraReducers: (builder) => {
        builder.addCase(signInUser.pending, (state, _action) => {
            state.currentUser = null
            state.currentActualUser = null
        }),

        builder.addCase(signInUser.fulfilled, (state, action) => {
            state.currentUser = action.payload.data.currentUser
            state.currentActualUser = action.payload.data.currentUser
        }),

        builder.addCase(signOutUser.fulfilled, (state, action) => {
            state.currentUser = null
            state.currentActualUser = null
            document.querySelector('meta[name="csrf-token"]').content = action.payload.data.new_csrf
        }),

        builder.addCase(saveResident.fulfilled, (state, action) => {
            // If we just saved a resident and it's this user's, update key data
            if (state.currentUser.id == action.payload.data.resident.user_id) {
                let newCurrentUser = Object.assign({}, state.currentUser)
                newCurrentUser.email = action.payload.data.resident.email
                newCurrentUser.first_name = action.payload.data.resident.first_name
                newCurrentUser.last_name = action.payload.data.resident.last_name

                state.currentUser = newCurrentUser

            }

        })
    }
})

export const {loadUserFromRails, setDates, setSearchText} = userSlice.actions

export default userSlice.reducer
