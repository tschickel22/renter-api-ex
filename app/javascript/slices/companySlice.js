import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";
import {signInUser, signOutUser} from "./userSlice";
import {deactivateProperty, loadProperties, reactivateProperty, searchForProperties} from "./propertySlice";

const initialState = {

    constants: {},
    settingsConfig: {},
    settings: null,
    baseUrl: null,
    currentCompany: null,
    properties: null,
    items: null,
    floorPlanNames: null,
    chargeTypes: null,
    accountCategories: null,
    leadSources: null
}

export const loadCurrentCompany = createAsyncThunk('company/loadCurrentCompany', async (_) => {
    console.log("START loadCurrentCompany")

    const response = await client.get('/api/internal/companies/my')
    console.log("END loadCurrentCompany")
    return {data: response}

})

export const loadCompany = createAsyncThunk('company/loadCompany', async ({companyId}) => {
    console.log("START loadCompany")

    const response = await client.get("/api/internal/companies/" + companyId)
    console.log("END loadCompany")
    return {data: response}

})

export const saveCompany = createAsyncThunk('company/saveCompany', async ({company}) => {
    console.log("START saveCompany")

    const response = await client.put('/api/internal/companies/my', {company: company})
    console.log("END saveCompany")
    return {data: response}

})

export const loadCompanyTaxpayerInfo = createAsyncThunk('company/loadCompanyTaxpayerInfo', async (_) => {
    console.log("START loadCompanyTaxpayerInfo")

    const response = await client.get('/api/internal/companies/taxpayer_info')
    console.log("END loadCompanyTaxpayerInfo")
    return {data: response}

})

export const saveCompanyTaxpayerInfo = createAsyncThunk('company/saveCompanyTaxpayerInfo', async ({companyTaxpayerInfo}) => {
    console.log("START saveCompanyTaxpayerInfo")

    const response = await client.post('/api/internal/companies/save_taxpayer_info', {company_taxpayer_info: companyTaxpayerInfo})
    console.log("END saveCompanyTaxpayerInfo")
    return {data: response}

})

export const activateCompanyForPayments = createAsyncThunk('company/activateCompanyForPayments', async ({company}) => {
    console.log("START activateCompanyForPayments", company)

    let url = "/api/internal/companies/" + company.id + "/payments_activation"
    let response  = await client.post(url, {company: company})

    console.log("END activateCompanyForPayments")
    return {data: response}

})

export const searchForCompanies = createAsyncThunk('company/searchForCompanies', async ({searchText, page}) => {
    console.log("START searchForCompanies")

    const response = await client.post('/api/internal/companies/search', {search_text: searchText, page: page})
    console.log("END searchForCompanies")
    return {data: response}

})

export const loadSettings = createAsyncThunk('company/loadSettings', async ({propertyId}) => {
    console.log("START loadSettings")

    let url = '/api/internal/settings'

    const response = await client.get(url)
    console.log("END loadSettings")
    return {data: response}

})

export const loadSetting = createAsyncThunk('company/loadSetting', async ({mode, propertyId}) => {
    console.log("START loadSetting")

    let url = '/api/internal/settings/my?mode='+mode

    if (propertyId) url = url + "&property_id="+propertyId

    const response = await client.get(url)
    console.log("END loadSetting")
    return {data: response}

})

export const saveSetting = createAsyncThunk('company/saveSetting', async ({setting}) => {
    console.log("START saveSetting")

    let url = "/api/internal/settings"
    let response = null

    if (setting.id) {
        url += "/" + setting.id
        response  = await client.put(url, {setting: setting})
    }
    else {
        response = await client.post(url, {setting: setting})
    }

    console.log("END saveSetting")
    return {data: response}

})

export const saveItem = createAsyncThunk('company/saveItem', async ({itemName, itemType}) => {
    console.log("START saveItem")

    let url = "/api/internal/companies/save_item"
    let method = "POST"

    const response = await client.call(method, url, {name: itemName, type: itemType})
    console.log("END saveItem")
    return {data: response}

})


export const loadEmailTemplates = createAsyncThunk('company/loadEmailTemplates', async (_) => {
    console.log("START loadEmailTemplates")

    const response = await client.get("/api/internal/email_templates/")
    console.log("END loadEmailTemplates")
    return {data: response}

})

export const loadEmailTemplate = createAsyncThunk('company/loadEmailTemplate', async ({templateId}) => {
    console.log("START loadEmailTemplate")

    const response = await client.get("/api/internal/email_templates/"+templateId)
    console.log("END loadEmailTemplate")
    return {data: response}

})

export const getPaymentsActivationDocuments = createAsyncThunk('company/getPaymentsActivationDocuments', async ({companyId}) => {
    console.log("START getPaymentsActivationDocuments")

    const response = await client.get("/api/internal/companies/" + companyId + "/payments_activation_documents")
    console.log("END getPaymentsActivationDocuments")
    return {data: response}

})

export const loadHistories = createAsyncThunk(
    "company/loadHistories",
    // @ts-ignore
    async ({ mode, userId, leaseId, propertyId, companyId, includeSystemChanges, startDate, endDate }) => {
        let postData = {mode: mode}
        if (companyId) postData.company_id = companyId
        if (propertyId) postData.property_id = propertyId
        if (leaseId) postData.lease_id = leaseId
        if (userId) postData.user_id = userId
        if (includeSystemChanges) postData.include_system_changes = includeSystemChanges
        if (startDate) postData.start_date = startDate
        if (endDate) postData.end_date = endDate

        const response = await client.post("/api/internal/histories/search", postData)
        return { data: response };
    }
);

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        loadCompanyFromRails(state, action) {
            console.log("START loadCompanyFromRails")

            if (action.payload) {
                state.constants = action.payload.constants
                state.settings = action.payload.settings
                state.settingsConfig = action.payload.settingsConfig
                state.baseUrl = action.payload.baseUrl
                state.chargeTypes = action.payload.chargeTypes
                state.accountCategories = action.payload.accountCategories
                state.items = action.payload.items
                state.leadSources = action.payload.leadSources
                state.currentCompany = action.payload.currentCompany
            }

            console.log("END loadCompanyFromRails")
        },
        updateFloorPlanNames(state, action) {
            const {payload} = action
            const {newFloorPlanNames} = payload

            state.floorPlanNames = newFloorPlanNames
        },
        updateItems(state, action) {
            state.items = action.payload
        },
        updateCurrentCompanyFields(state, action) {
            let newCompany = Object.assign({}, state.currentCompany)

            Object.keys(action.payload).forEach((key) => {
                newCompany[key] = action.payload[key]
            })

            state.currentCompany = newCompany
        }
    },
    extraReducers: (builder) => {

        builder.addCase(loadProperties.pending, (state, _action) => {
            state.properties = null
        }),

        builder.addCase(loadProperties.fulfilled, (state, action) => {
            const {payload} = action
            const {data} = payload

            state.properties = data.properties
            state.floorPlanNames = data.floor_plan_names
        }),

        builder.addCase(loadSettings.fulfilled, (state, action) => {
            state.settings = action.payload.data.settings
        }),

        builder.addCase(loadCurrentCompany.fulfilled, (state, action) => {
            state.currentCompany = action.payload.data.company
        }),

        builder.addCase(deactivateProperty.fulfilled, (state, action) => {
            if (action.payload.data.success) {
                const newProperty = action.payload.data.property
                let existingProperties = Array.from(state.properties)
                const existingProperty = existingProperties.find((property) => (property.id == newProperty.id))

                // Is this a new setting or one that has been updated?
                if (existingProperty) {
                    existingProperties[existingProperties.indexOf(existingProperty)] = newProperty
                }

                state.properties = existingProperties
            }
        }),

        builder.addCase(reactivateProperty.fulfilled, (state, action) => {
            if (action.payload.data.success) {
                const newProperty = action.payload.data.property
                let existingProperties = Array.from(state.properties)
                const existingProperty = existingProperties.find((property) => (property.id == newProperty.id))

                // Is this a new setting or one that has been updated?
                if (existingProperty) {
                    existingProperties[existingProperties.indexOf(existingProperty)] = newProperty
                }

                state.properties = existingProperties
            }
        }),

        builder.addCase(saveSetting.fulfilled, (state, action) => {
            if (action.payload.data.success) {
                const newSetting = action.payload.data.setting
                let existingSettings = Array.from(state.settings)
                const existingSetting = existingSettings.find((setting) => (setting.id == newSetting.id))

                // Is this a new setting or one that has been updated?
                if (existingSetting) {
                    existingSettings[existingSettings.indexOf(existingSetting)] = newSetting
                }
                else {
                    existingSettings.push(newSetting)
                }

                state.settings = existingSettings
            }
        }),

        builder.addCase(saveCompany.fulfilled, (state, action) => {
            if (action && action.payload && action.payload.data && action.payload.data.company) state.currentCompany = action.payload.data.company
        }),

        builder.addCase(saveCompanyTaxpayerInfo.fulfilled, (state, action) => {
            if (action && action.payload && action.payload.data && action.payload.data.company) state.currentCompany = action.payload.data.company
        }),

        builder.addCase(signInUser.pending, (state, _action) => {
            state.currentCompany = null
            state.properties = null
        }),

        builder.addCase(signInUser.fulfilled, (state, action) => {
            state.currentCompany = action.payload.data.currentCompany
        }),

        builder.addCase(signOutUser.fulfilled, (state, action) => {
            state.currentCompany = null
            state.properties = null
        })

    }
})

export const {loadCompanyFromRails, updateFloorPlanNames, updateCurrentCompanyFields, updateItems} = companySlice.actions

export default companySlice.reducer
