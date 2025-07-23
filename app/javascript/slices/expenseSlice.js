import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}

export const loadExpense = createAsyncThunk('results/loadExpense', async ({expenseId}) => {
    console.log("START loadExpense", expenseId)

    let response  = await client.get("/api/internal/expenses/"+expenseId)

    console.log("END loadExpense")
    return {data: response}

})

export const saveExpense = createAsyncThunk('results/saveExpense', async ({expense}) => {
    console.log("START saveExpense")

    let url = "/api/internal/expenses"
    let method = "POST"

    if (expense.hash_id) {
        url += "/" + expense.hash_id
        method = "PUT"
    }

    let response  = await client.call(method, url, {expense: expense})

    console.log("END saveExpense")
    return {data: response}

})

export const saveExpensePayments = createAsyncThunk('results/saveExpensePayments', async ({payments}) => {
    console.log("START saveExpensePayments ", payments)

    const response = await client.post("/api/internal/expense_payments/create_multiple", {payments: payments})
    console.log("END saveExpensePayments")
    return {data: response}
})

export const deleteExpense = createAsyncThunk('results/deleteExpense', async ({expenseId}) => {
    console.log("START deleteExpense ")

    const response = await client.delete("/api/internal/expenses/" + expenseId, {})
    console.log("END deleteExpense")
    return {data: response}
})


export const loadExpensePrintView = createAsyncThunk('results/loadExpensePrintView', async ({expense}) => {
    console.log("START loadExpensePrintView")

    let response  = await client.get("/api/internal/expenses/" + expense.hash_id + "/print?hide_buttons=true", {forDownload: true})

    console.log("END loadExpensePrintView")
    return {data: response}

})

export const searchForExpenses = createAsyncThunk('results/searchForExpenses', async ({searchText, excludeRecurring, propertyId, status, type, mode, startDate, endDate}) => {
    console.log("START searchForExpenses")

    const response = await client.post('/api/internal/expenses/search', {search_text: searchText, exclude_recurring: excludeRecurring, property_id: propertyId, status: status, type: type, mode: mode, start_date: startDate, end_date: endDate})
    console.log("END searchForExpenses")
    return {data: response}

})

export const getReceipts = createAsyncThunk('results/getReceipts', async ({expenseId}) => {
    console.log("START getReceipts")

    const response = await client.get("/api/internal/expenses/" + expenseId + "/receipts")
    console.log("END getReceipts")
    return {data: response}

})


const expenseSlice = createSlice({
    name: 'expense',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {

    }
})

export const {} = expenseSlice.actions

//export default expenseSlice.reducer
