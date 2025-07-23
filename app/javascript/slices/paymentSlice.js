import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit'
import {client} from "../app/client";

const initialState = {

}


export const savePayments = createAsyncThunk('results/savePayments', async ({payments, manualPaymentOn}) => {
    console.log("START savePayments ", payments)

    const response = await client.post("/api/internal/payments/create_multiple", {payments: payments, manual_payment_on: manualPaymentOn})
    console.log("END savePayments")
    return {data: response}
})

export const loadExpensePayment = createAsyncThunk('results/loadExpensePayment', async ({paymentHashId}) => {
    console.log("START loadExpensePayment ", paymentHashId)

    const response = await client.get("/api/internal/expense_payments/" + paymentHashId )
    console.log("END loadExpensePayment")
    return {data: response}
})

export const voidExpensePayment = createAsyncThunk('results/voidExpensePayment', async ({paymentHashId}) => {
    console.log("START voidExpensePayment ", paymentHashId)

    const response = await client.post("/api/internal/expense_payments/" + paymentHashId  + '/void', {})
    console.log("END voidExpensePayment")
    return {data: response}
})

export const saveResidentPaymentMethod = createAsyncThunk('results/saveResidentPaymentMethod', async ({residentPaymentMethod, leaseResidentId}) => {
    console.log("START saveResidentPaymentMethod ", residentPaymentMethod)

    let response = null

    if (!residentPaymentMethod.hash_id) {
        response = await client.post("/api/internal/resident_payment_methods", {resident_payment_method: residentPaymentMethod, lease_resident_id: leaseResidentId})
    }
    else {
        response = await client.put("/api/internal/resident_payment_methods/" + residentPaymentMethod.hash_id, {resident_payment_method: residentPaymentMethod, lease_resident_id: leaseResidentId})
    }

    console.log("END saveResidentPaymentMethod")
    return {data: response}
})

export const saveCompanyPaymentMethod = createAsyncThunk('results/saveResidentPaymentMethod', async ({companyPaymentMethod}) => {
    console.log("START saveCompanyPaymentMethod ", companyPaymentMethod)

    const response = await client.post("/api/internal/company_payment_methods", {company_payment_method: companyPaymentMethod})
    console.log("END saveCompanyPaymentMethod")
    return {data: response}
})

export const loadResidentPaymentMethod = createAsyncThunk('results/loadResidentPaymentMethod', async ({paymentMethodId}) => {
    console.log("START loadResidentPaymentMethod ", paymentMethodId)

    const response = await client.get("/api/internal/resident_payment_methods/" + paymentMethodId)
    console.log("END loadResidentPaymentMethod")
    return {data: response}
})

export const loadResidentPaymentMethods = createAsyncThunk('results/loadResidentPaymentMethods', async ({leaseResidentId}) => {
    console.log("START loadResidentPaymentMethods ", leaseResidentId)

    const response = await client.post("/api/internal/resident_payment_methods/search", {lease_resident_id: leaseResidentId})
    console.log("END loadResidentPaymentMethods")
    return {data: response}
})

export const deleteResidentPaymentMethod = createAsyncThunk('results/deleteResidentPaymentMethod', async ({paymentMethodId}) => {
    console.log("START deleteResidentPaymentMethod ", paymentMethodId)

    const response = await client.delete("/api/internal/resident_payment_methods/" + paymentMethodId)
    console.log("END deleteResidentPaymentMethod")
    return {data: response}
})



export const payScreeningFee = createAsyncThunk('results/payScreeningFee', async ({residentPaymentMethodId, leaseResidentId}) => {
    console.log("START payScreeningFee ", leaseResidentId)

    const response = await client.post("/api/internal/payments/pay_screening_fee", {resident_payment_method_id: residentPaymentMethodId, lease_resident_id: leaseResidentId})
    console.log("END payScreeningFee")
    return {data: response}
})

export const payApplicationFee = createAsyncThunk('results/payApplicationFee', async ({residentPaymentMethodId, leaseResidentId}) => {
    console.log("START payApplicationFee ", residentPaymentMethodId)

    const response = await client.post("/api/internal/payments/pay_application_fee", {resident_payment_method_id: residentPaymentMethodId, lease_resident_id: leaseResidentId})
    console.log("END payApplicationFee")
    return {data: response}
})

export const loadApplicationFee = createAsyncThunk('results/loadApplicationFee', async ({leaseResidentId}) => {
    console.log("START loadApplicationFee ", leaseResidentId)

    const response = await client.post("/api/internal/payments/application_fee", {lease_resident_id: leaseResidentId})
    console.log("END loadApplicationFee")
    return {data: response}
})

export const makePayment = createAsyncThunk('results/makePayment', async ({residentPaymentMethodId, leaseResidentId, amount}) => {
    console.log("START makePayment ", residentPaymentMethodId)

    const response = await client.post("/api/internal/payments/make_one_time_payment", {resident_payment_method_id: residentPaymentMethodId, lease_resident_id: leaseResidentId, amount: amount})
    console.log("END makePayment")
    return {data: response}
})

export const refundPayment = createAsyncThunk('results/refundPayment', async ({paymentId}) => {
    console.log("START refundPayment ")

    const response = await client.post("/api/internal/payments/" + paymentId + "/refund", {})
    console.log("END refundPayment")
    return {data: response}
})

export const deletePayment = createAsyncThunk('results/deletePayment', async ({paymentId}) => {
    console.log("START deletePayment ")

    const response = await client.delete("/api/internal/payments/" + paymentId, {})
    console.log("END deletePayment")
    return {data: response}
})

export const loadPaymentSchedule = createAsyncThunk('results/loadPaymentSchedule', async ({leaseResidentId, recurringPaymentFrequency, recurringPaymentDayOfWeek, recurringPaymentStartsOn}) => {
    console.log("START loadPaymentSchedule ")

    const response = await client.post('/api/internal/payments/payment_schedule', {lease_resident_id: leaseResidentId, recurring_payment_frequency: recurringPaymentFrequency, recurring_payment_day_of_week: recurringPaymentDayOfWeek, recurring_payment_starts_on: recurringPaymentStartsOn})
    console.log("END loadPaymentSchedule")
    return {data: response}
})

export const signUpForRecurringPayments = createAsyncThunk('results/signUpForRecurringPayments', async ({residentPaymentMethodId, leaseResidentId, recurringPaymentFrequency, recurringPaymentDayOfWeek, recurringPaymentStartsOn}) => {
    console.log("START signUpForRecurringPayments ", residentPaymentMethodId)

    const response = await client.post("/api/internal/payments/sign_up_for_recurring_payments", {resident_payment_method_id: residentPaymentMethodId, lease_resident_id: leaseResidentId, recurring_payment_frequency: recurringPaymentFrequency, recurring_payment_day_of_week: recurringPaymentDayOfWeek, recurring_payment_starts_on: recurringPaymentStartsOn})
    console.log("END signUpForRecurringPayments")
    return {data: response}
})


const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

    }
})

export const {} = paymentSlice.actions

export default paymentSlice.reducer
