import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadCharge = createAsyncThunk('results/loadCharge', async ({chargeId}) => {
    console.log("START loadCharge ", chargeId)

    const response = await client.get( "/api/internal/charges/" + chargeId)
    console.log("END loadCharge")
    return {data: response}

})

export const saveCharge = createAsyncThunk('results/saveCharge', async ({charge}) => {
    console.log("START saveCharge ", charge)

    let url = "/api/internal/charges"
    let method = "POST"

    if (charge.hash_id) {
        url += "/" + charge.hash_id
        method = "PUT"
    }

    const response = await client.call(method, url, {charge: charge})
    console.log("END saveCharge")
    return {data: response}
})

export const deleteCharge = createAsyncThunk('results/deleteCharge', async ({charge}) => {
    console.log("START deleteCharge")

    let response  = await client.delete("/api/internal/charges/" + charge.hash_id, {})

    console.log("END deleteCharge")
    return {data: response}

})


export const loadChargesAndLedgerItems = createAsyncThunk('results/loadChargesAndLedgerItems', async ({leaseId, mode}) => {
    console.log("START loadChargesAndLedgerItems ", leaseId)

    let url = "/api/internal/charges/"+leaseId+"/charges_and_ledger_items"

    if (mode) url = url + "?mode=" + mode

    const response = await client.call("GET", url)
    console.log("END loadChargesAndLedgerItems")
    return {data: response}
})

export const loadRentAndDepositCharges = createAsyncThunk('results/loadRentAndDepositCharges', async ({leaseId}) => {
    console.log("START loadRentAndDepositCharges ", leaseId)

    let url = "/api/internal/charges/"+leaseId+"/rent_and_deposit_charges"

    const response = await client.call("GET", url)
    console.log("END loadRentAndDepositCharges")
    return {data: response}
})

export const loadLedgerItemDetails = createAsyncThunk('results/loadLedgerItemDetails', async ({leaseId,ledgerItemId}) => {
    console.log("START loadLedgerItemDetails ", leaseId, ledgerItemId)

    let url = "/api/internal/charges/"+leaseId+"/ledger_item_details/"+ledgerItemId

    const response = await client.call("GET", url)
    console.log("END loadLedgerItemDetails")
    return {data: response}
})

export const loadLeaseForLedgerItem = createAsyncThunk('results/loadLeaseForLedgerItem', async ({ledgerItemId}) => {
    console.log("START loadLeaseForLedgerItem ", ledgerItemId)

    const response = await client.get( "/api/internal/ledger_items/" + ledgerItemId + "/lookup_lease")
    console.log("END loadLeaseForLedgerItem")
    return {data: response}
})

export const saveLedgerItem = createAsyncThunk('results/saveLedgerItem', async ({ledgerItem}) => {
    console.log("START saveLedgerItem ", ledgerItem)

    const response = await client.put("/api/internal/ledger_items/" + ledgerItem.hash_id, {ledger_item: ledgerItem})
    console.log("END saveLedgerItem")
    return {data: response}
})

export const deleteLedgerItem = createAsyncThunk('results/deleteLedgerItem', async ({ledgerItem}) => {
    console.log("START deleteLedgerItem")

    let response  = await client.delete("/api/internal/ledger_items/" + ledgerItem.hash_id, {})

    console.log("END deleteLedgerItem")
    return {data: response}

})

export const searchForBulkCharges = createAsyncThunk('results/searchForBulkCharges', async ({searchText}) => {
    console.log("START searchForBulkCharges")

    const response = await client.post('/api/internal/bulk_charges/search', { search_text: searchText})
    console.log("END searchForBulkCharges")
    return {data: response}

})

export const loadBulkCharge = createAsyncThunk('results/loadBulkCharge', async ({bulkChargeId}) => {
    console.log("START loadBulkCharge ", bulkChargeId)

    const response = await client.get( "/api/internal/bulk_charges/" + bulkChargeId)
    console.log("END loadBulkCharge")
    return {data: response}

})

export const saveBulkCharge = createAsyncThunk('results/saveBulkCharge', async ({bulkCharge}) => {
    console.log("START saveBulkCharge ", bulkCharge)

    let url = "/api/internal/bulk_charges"
    let method = "POST"

    if (bulkCharge.hash_id) {
        url += "/" + bulkCharge.hash_id
        method = "PUT"
    }

    const response = await client.call(method, url, {bulk_charge: bulkCharge})
    console.log("END saveBulkCharge")
    return {data: response}
})

export const saveBulkChargeLeases = createAsyncThunk('results/saveBulkChargeLeases', async ({bulkChargeId, bulkChargeLeases}) => {
    console.log("START saveBulkChargeLeases ", bulkChargeId)

    let url = "/api/internal/bulk_charges/" + bulkChargeId + "/save_leases"

    const response = await client.post(url, {bulk_charge: {bulk_charge_leases: bulkChargeLeases}})
    console.log("END saveBulkChargeLeases")
    return {data: response}
})

export const deleteBulkCharge = createAsyncThunk('results/deleteBulkCharge', async ({bulkChargeId}) => {
    console.log("START deleteBulkCharge")

    let response  = await client.delete("/api/internal/bulk_charges/" + bulkChargeId, {})

    console.log("END deleteBulkCharge")
    return {data: response}

})



const chargeSlice = createSlice({
    name: 'charge',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = chargeSlice.actions

export default chargeSlice.reducer
