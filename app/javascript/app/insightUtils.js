import {displayAlertMessage} from "../slices/dashboardSlice";
import {resendResidentEmail} from "../slices/leaseResidentSlice";
import store from "./store"
import createNumberMask from 'text-mask-addons/dist/createNumberMask'
import {useLocation} from "react-router-dom";
import React from "react";
import moment from "moment";
import insightRoutes from "./insightRoutes";

export default function insightUtils() {

}

insightUtils.numberPerPage = function() { return 25 }

insightUtils.numberToCurrency = function (num, precision) {
    precision =  precision || 0;
    if (num != null) return '$' + parseFloat(num, 10).toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    else return '';
}

insightUtils.numberToShortCurrency = function (num, symbol) {
    if ('' == symbol) {

    }
    else {
        symbol = symbol || "$"
    }

    if (!num) {
        return '';
    }
    else {
        if (num >= 10000000) {
            return symbol + Math.floor(num / 1000000).toString() + "M";
        }
        else if (num >= 1000000) {
            return symbol + (num / 1000000).toFixed(2) + "M";
        }
        else if (num >= 1000) {
            return symbol + Math.floor(num / 1000) + "K";
        }
        else {
            return symbol + num.toFixed();
        }
    }
}

insightUtils.numberWithCommas = function (num, precision) {
    precision =  precision || 0;
    if (num != null) return parseFloat(num, 10).toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    else return '';
}

insightUtils.getBedsLabel = function(beds) {
    if (beds && parseInt(beds) == -1) return "Studio"
    else return beds
}

insightUtils.sortByName = function(list) {
    if (!list) return [];
    return list.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
    });
}

insightUtils.sortNumberOrString = function(list, fieldName) {
    if (!list) return []
    return list.sort((a, b) => {
        const nameA = (a[fieldName] || "").toLowerCase().padStart(100, '0');
        const nameB = (b[fieldName] || "").toLowerCase().padStart(100, '0');
        return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
    });
}

insightUtils.ensureArray = function(data) {
    if (!data) {
        return []
    }
    else if (Array.isArray(data)) {
        return data
    }
    else {
        return [data]
    }
}

insightUtils.parseDate = function (dateStr) {
    if (dateStr instanceof Date) {
        return dateStr
    }
    else if (!dateStr) {
        return null;
    }

    let separator = null;

    if (dateStr.indexOf('-') >= 0) {
        // Expecting YYYY-MM-DD
        const parts = dateStr.split("-")
        const year = parts[0].length == 4 ? parts[0] : (parseInt(parts[0]) < 40 ? "20"+parts[0] : "19"+parts[0])
        return new Date(parseInt(year), parseInt(parts[1])-1, parseInt(parts[2]))
    }
    else if (dateStr.indexOf('/') >= 0) {
        // Expecting m/d/yyyy
        const parts = dateStr.split("/")
        const year = parts[2].length == 4 ? parts[2] : (parseInt(parts[2]) < 40 ? "20"+parts[2] : "19"+parts[2])
        return new Date(parseInt(year), parseInt(parts[0])-1, parseInt(parts[1]))
    }
    else {
        return null;
    }

}

insightUtils.parseDateTime = function (dateStr) {
    if (dateStr instanceof Date) {
        return dateStr
    }
    else if (!dateStr) {
        return null;
    }

    let separator = null;

    if (dateStr.indexOf('-') >= 0) {
        // Expecting YYYY-MM-DDTHH:MM:SS
        const dateAndTime = dateStr.split("T")
        const parts = dateAndTime[0].split("-")
        const timeParts = dateAndTime[1].split(":")
        const year = parts[0].length == 4 ? parts[0] : (parseInt(parts[0]) < 40 ? "20"+parts[0] : "19"+parts[0])
        return new Date(parseInt(year), parseInt(parts[1])-1, parseInt(parts[2]), parseInt(timeParts[0]), parseInt(timeParts[1]))
    }
    else if (dateStr.indexOf('/') >= 0) {
        // Expecting m/d/yyyy HH:MM:SS
        const dateAndTime = dateStr.split(" ")
        const parts = dateAndTime[0].split("/")
        const timeParts = dateAndTime[1].split(":")

        const year = parts[2].length == 4 ? parts[2] : (parseInt(parts[2]) < 40 ? "20"+parts[2] : "19"+parts[2])
        return new Date(parseInt(year), parseInt(parts[0])-1, parseInt(parts[1]), parseInt(timeParts[0]), parseInt(timeParts[1]))
    }
    else {
        return null;
    }

}

insightUtils.formatDate = function(dateStr) {

    if (!dateStr) {
        return dateStr
    }
    else if (Object.prototype.toString.call(dateStr) === "[object Date]") {
        return dateStr.toLocaleDateString("en-US")
    }
    else if (dateStr.indexOf('-') < 0) {
        return dateStr
    }

    let newDateStr = dateStr

    // Shave off the time
    if (newDateStr.indexOf('T') > 0) {
        newDateStr = newDateStr.split('T')[0]
    }

    // Expecting YYYY-MM-DD
    const parts = newDateStr.split("-")
    const year = parts[0].length == 4 ? parts[0] : (parseInt(parts[0]) < 40 ? "20"+parts[0] : "19"+parts[0])
    return parts[1]+"/"+parts[2]+"/"+year
}

insightUtils.todaysDate = function () {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}
insightUtils.isSameDay = function (d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
insightUtils.isDateInFuture = function (dateStr) {
    return (insightUtils.parseDate(dateStr).getTime() >= insightUtils.todaysDate().getTime())
}

insightUtils.clearNonNumerics = function (str) {
    return (str || '').toString().replace(/[^\d.-]/g, '');
}

insightUtils.validateEmail = function(email) {
    email = String(email).trim()
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

insightUtils.formatPhone = function(phone) {
    // If this is a 10 digit number, format it like NNN-NNN-NNNN
    if (phone && phone.length == 10) {
        return phone.slice(0,3) + "-" + phone.slice(3,6) + "-" + phone.slice(6,10)
    }
    else {
        return phone
    }
}

insightUtils.humanize = function(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}

insightUtils.arrayToObject = function(arr) {
    let newObject = new Object();

    if (arr) {
        arr.forEach(function(v, _i) {
            newObject[v] = null
        })
    }

    return newObject
}

insightUtils.intersect = function(array1, array2) {
    return (array1 || []).filter(value => (array2 || []).includes(value));
}
insightUtils.prepend = function(array, newItem) {
    let newArray =[...array]
    newArray.unshift(newItem)
    return newArray;
}
insightUtils.gatherErrors = function(data, fallbackError) {
    if (data.errors.base) {
        return data.errors.base
    }
    else if (typeof data.errors === 'object' && !Array.isArray(data.errors) && data.errors !== null) {
        const errors = Object.keys(data.errors).map((key) => {
            const error = data.errors[key]

            return key.replaceAll('_', ' ') + " " + error
        })

        return fallbackError + ": " +errors.join(", ")
    }
    else {
        return fallbackError
    }
}

insightUtils.addError = function(errors, model, index, field, error) {
    if (!errors[model]) errors[model] = {}
    if (!errors[model][index]) errors[model][index] = {}
    errors[model][index][field] = error
}

insightUtils.handleCloseIfClickedOutside = function(ref, isOpen, handleClose) {
    const checkIfClickedOutside = e => {
        // If the menu is open and the clicked target is not within the menu,
        // then close the menu
        if (isOpen && ref.current && !ref.current.contains(e.target) && (!e.target.className || e.target.className.indexOf("Autocomplete") < 0)) {
            handleClose()
        }
    }

    document.addEventListener("mousedown", checkIfClickedOutside)

    return () => {
        // Cleanup the event listener
        document.removeEventListener("mousedown", checkIfClickedOutside)
    }
}

insightUtils.propertyTypePretty = function(propertyType) {
    if (propertyType == "condo") return "Condo"
    else if (propertyType == "house") return "House"
    else if (propertyType == "apartment") return "Apartment"
    else if (propertyType == "duplex") return "Duplex"
    else return propertyType
}
insightUtils.isMultiFamily = function(propertyType) {
    if (propertyType == "condo") return false
    else return true
}
insightUtils.isStandardPercentage = function(percentage) {
    if (!percentage) return true
    if ([25, 50, 75, 100].indexOf(parseInt(percentage)) >= 0) return true
    else return false
}
insightUtils.findCurrentLease = function(leases) {
    return leases.find((lease) => (lease.status == "current" || lease.status == "future") && lease.primary_resident)
}
insightUtils.extractLeaseResidents = function(lease, includeMinors) {
    let leaseResidents = [lease.primary_resident]
    lease.secondary_residents.forEach((lr) => leaseResidents.push(lr))
    lease.guarantors.forEach((lr) => leaseResidents.push(lr))
    if (includeMinors) lease.minors.forEach((lr) => leaseResidents.push(lr))

    return leaseResidents
}
insightUtils.toOptions = function(constantObj, optionLabelName) {
    optionLabelName = optionLabelName || "name"
    if (Array.isArray(constantObj)) {
        let entries = constantObj.map((p) => ([(typeof p.id === 'number' ? p.id.toString() : p.id), p[optionLabelName]]))
        return entries // WHY SORT BY KEY?
    }
    else {
        let obj = new Object()

        Object.keys(constantObj).forEach((key) => {
            obj[key] = constantObj[key]['value']
        })

        return obj
    }
}
insightUtils.yesNoOptions = function() { return [{id: true, name: "Yes"}, {id: false, name: "No"}] }
insightUtils.getLabel = function(key, constantObj) {
    const options = insightUtils.toOptions(constantObj)
    if (Array.isArray(options)) {
        const match = options.find((opt) => (opt[0] == key))
        return match ? match[1] : key
    }
    else {
        return options[key] || key
    }
}
insightUtils.getLabels = function(keys, constantObj) {
    let keysArray = []

    if (Array.isArray(keys)) {
        keysArray = keys
    }
    else if (keys) {
        keysArray = keys.split(",")
    }

    const labels = keysArray.map((key) => (insightUtils.getLabel(key, constantObj)))
    return labels.join(", ")
}
insightUtils.getValue = function(values, name) {
    let value = null
    try {
      value = name.split('.').reduce((o,i)=>o[i],  values)
    }
    catch(e) {
    }

    return value
}
insightUtils.setValuesWithDotNotation = function(values, name, newValue) {
    return insightUtils.setValuesWithArray(values, name.split("."), newValue)
}
insightUtils.setValuesWithArray = function(values, path, newValue) {
    if (path.length === 1) values[path[0]] = newValue;
    else if (path.length === 0) throw error;
    else {
        if (values[path[0]])
            return insightUtils.setValuesWithArray(values[path[0]], path.slice(1), newValue);
        else {
            values[path[0]] = {};
            return insightUtils.setValuesWithArray(values[path[0]], path.slice(1), newValue);
        }
    }
}
insightUtils.handleForwardNavigation = function(route, location, navigate) {
    navigate(route, {state: {return_url: location.pathname + (window.location.search || '')}})
}
insightUtils.handleBackNavigation = function(route, location, navigate, newId) {
    if (location.state && location.state.return_url) {
        let newValues = {...location.state.values}

        // If we added a bank account, send it back to the calling form
        if (newId && location.state.field_to_update) insightUtils.setValuesWithDotNotation(newValues, location.state.field_to_update, newId)

        navigate(location.state.return_url, {state: {values: newValues, return_url: location.state.original_return_url}})
    }
    else {
        navigate(route)
    }
}

insightUtils.findActiveInsurance = function(insurances) {
    if (insurances) {
        if (insurances.length == 1) {
            return insurances[0]
        }
        else {
            const existingInsurance = insurances.find((i) => (i.status == "active"))

            // If we don't find an active policy, just return the first
            if (!existingInsurance) {
                console.log("Still no active policy out of", insurances)
                return insurances[0]
            }
            else {
                return existingInsurance
            }
        }
    }
}
insightUtils.getCurrentProperty = function(properties, params) {
    return params && (properties || []).find((property) => property.id == parseInt(params.propertyId))
}
insightUtils.countAllUnits = function(properties) {
    let total = 0;
    (properties || []).forEach((property) => total = total + property.units.length)
    return total
}
insightUtils.reopenApplication = async function(leaseResidentId) {
    return await insightUtils.sendLeaseResidentEmail(leaseResidentId, "application_reopened", "Application link was resent to applicant to edit.  You will be notified once it's been re-submitted.")
}
insightUtils.resendInvitation = async function(leaseResidentId) {
    return await insightUtils.sendLeaseResidentEmail(leaseResidentId, "invitation", "Invitation resent.")
}
insightUtils.sendPortalInvitation = async function(leaseResidentId) {
    return await insightUtils.sendLeaseResidentEmail(leaseResidentId, "portal_access_granted", "Invitation sent.")
}
insightUtils.sendLeaseResidentEmail = async function(leaseResidentId, emailType, message) {
    try {
        await store.dispatch(resendResidentEmail({leaseResidentId: leaseResidentId, emailType: emailType})).unwrap()
        store.dispatch(displayAlertMessage({message: message}))
        return true
    }
    catch(err) {
        console.log(err)
        store.dispatch(displayAlertMessage({message: "Could not send email."}))
    }

    return false
}

insightUtils.scrollTo = function (mode, container) {
    mode ||= "top"
    container ||= "main-container"
    let positionY = 0

    window.setTimeout(() => {
        if (mode == "errors" && document.getElementsByClassName('text-error').length > 0) {

            // Is the error inside of a modal? If so, we need to scroll a different container
            if (container == "main-container") {
                let a = document.getElementsByClassName('text-error')[0]
                let els = []
                while (a) {
                    els.unshift(a);
                    a = a.parentNode;
                    // Look for
                    if (a && a.classList && a.classList.contains("overlay-box-content")) container = "overlay-box-content"

                }
            }

            positionY = document.getElementsByClassName('text-error')[0].parentElement.offsetTop - 20
        }
        else if (mode == "top") {
            positionY = 0
        }
        else if (document.getElementsByClassName(mode) && document.getElementsByClassName(mode).length > 0) {
            positionY = document.getElementsByClassName(mode)[0].offsetTop - 20
        }

        document.getElementsByClassName(container)[0].scrollTo(0,positionY)
    }, 100)
}

insightUtils.useQuery = function() {
    const { search } = useLocation()

    return React.useMemo(() => new URLSearchParams(search), [search]);
}

insightUtils.trimCommunicationBody = function (body, wordCount) {
    if (body) {

        const parts = body.split(" ")

        if (parts.length > wordCount) {
            return parts.slice(0, wordCount).join(" ") + "..."
        }
        else {
            return body
        }
    }
}

insightUtils.resolvePath = function(object, path, defaultValue) {
    return path
    .split('.')
    .reduce((o, p) => {
        return o ? o[p] : null
    }, object) || defaultValue
}

insightUtils.calculateChargesTotal = function(charges) {
    let total = 0.0

    charges.forEach((charge) => {
        total += parseFloat(charge.prorated_amount || charge.amount, 2)
    })

    return total
}

insightUtils.getSettings = function(settings, propertyId) {
    const globalSetting = settings.find((setting) => !setting.property_id && !setting.company_id)
    const companySetting = settings.find((setting) => !setting.property_id && setting.company_id)
    let setting = companySetting || globalSetting

    if (propertyId) {
        const propertySetting = settings.find((setting) => propertyId == setting.property_id)
        if (propertySetting) setting = propertySetting
    }
    return setting
}

insightUtils.calculateFeesForResident = function (settings, paymentMethods, paymentMethodId, amount) {

    const parsedAmount = parseFloat(insightUtils.clearNonNumerics(amount))
    let method = ""
    let feeAmount = 0

    if (settings && paymentMethods && paymentMethodId && parsedAmount > 0) {
        // Figure out the payment method type
        if (paymentMethodId.toString().indexOf("new") >= 0) {
            method = paymentMethodId.replace("new_", "")
        }
        else {
            const selectedPaymentMethod = paymentMethods.find((pm) => (pm.id == paymentMethodId))

            if (selectedPaymentMethod) method = selectedPaymentMethod.method
        }

        if (method == "ach" && settings.resident_responsible_one_time_charges_ach) {
            feeAmount = settings.payment_fee_ach_resident
        }
        else if (method == "credit_card" && settings.resident_responsible_one_time_charges_credit_card) {
            feeAmount = parseFloat(settings.payment_fee_ach_resident) + (parseFloat(parsedAmount) * parseFloat(settings.payment_fee_credit_card_resident) / 100.0)
            feeAmount = insightUtils.roundTo95(feeAmount)
        }
        else if (method == "debit_card" && settings.resident_responsible_one_time_charges_debit_card) {
            feeAmount = settings.payment_fee_debit_card_resident
        }
    }

    return feeAmount
}

insightUtils.roundTo95 = function(fee) {
    const cents = parseInt(100.0 * (fee - parseInt(fee)))
    const dollarAmount = Math.floor(fee)

    if (cents > 95) {
        return dollarAmount + 1.95;
    }
    else {
        return dollarAmount + 0.95;
    }
}

insightUtils.parseParam = function(url, paramName) {
    if (url) {
        const parts = url.split('?')

        if (parts.length == 2) {
            let params = new URLSearchParams(parts[1])

            return params.get(paramName)
        }
    }
}

insightUtils.organizeConversations = function(communications, currentUser) {
    let newConversations = new Object();

    communications.forEach((communication) => {
        if (communication.related_object && communication.related_object_type == "LeaseResident") {
            const key =  insightUtils.isResident(currentUser) ? communication.property_id : communication.related_object.hash_id
            if (!newConversations[key]) newConversations[key] = {id: key, leaseResidentId: communication.related_object.hash_id, type: "inbox", leaseResident: communication.related_object, propertyId: communication.property_id, mostRecentCommunicationAt: null,  communications: [] }

            newConversations[key].communications.push(communication)

            if (!newConversations[key].mostRecentCommunicationAt || (newConversations[key].mostRecentCommunicationAt < communication.created_at)) newConversations[key].mostRecentCommunicationAt = communication.created_at
        }
    })

    Object.keys(newConversations).forEach((key) => {
        const conversation = newConversations[key]

        let twoWayConversation = false
        let anyDeleted = false

        conversation.communications.forEach((communication) => {
            if (communication.deleted_at) {
                anyDeleted = true
            }

            // Do we have messages from anyone else?
            if (insightUtils.isResident(currentUser)) {
                if (communication.to_type == "Resident") twoWayConversation = true
            }
            else {
                if (communication.to_type == "Property") twoWayConversation = true
            }
        })

        newConversations[key].two_way = twoWayConversation
    })

    return newConversations
}

insightUtils.shouldShow = function(optionalRequiredHide) {
    return (optionalRequiredHide == "optional" || optionalRequiredHide == "required")
}

insightUtils.isApplicationOpen = function(leaseResident, constants) {
    return leaseResident && [constants.lease_resident_steps.lead.key, constants.lease_resident_steps.invitation.key, constants.lease_resident_steps.occupant_details.key, constants.lease_resident_steps.applicant_details.key, constants.lease_resident_steps.agreement.key, constants.lease_resident_steps.payment.key, constants.lease_resident_steps.screening.key].indexOf(leaseResident.current_step) >= 0
}

insightUtils.isAdmin = function(currentUser) {
    return currentUser && currentUser.user_type == "admin"
}

insightUtils.isCompanyAdmin = function(currentUser) {
    return currentUser && currentUser.user_type == "company_admin"
}

insightUtils.isCompanyAdminAtLeast = function(currentUser) {
    return currentUser && (insightUtils.isCompanyAdmin(currentUser) || insightUtils.isAdmin(currentUser))
}

insightUtils.isCompanyUserAtLeast = function(currentUser) {
    return currentUser && (currentUser.user_type == "company_user" || insightUtils.isCompanyAdminAtLeast(currentUser))
}

insightUtils.isResident = function(currentUser) {
    return currentUser && (currentUser.user_type == "resident")
}

insightUtils.allTimeRange = {
    startDate: new Date(1900, 0, 1),
    endDate: moment().toDate()
}

insightUtils.lastYearDateRange = {
    startDate: moment().subtract(1, 'year').startOf('year').toDate(),
    endDate: moment().subtract(1, 'year').endOf('year').toDate(),
}

insightUtils.yearToDateRange = {
    startDate: moment().startOf('year').toDate(),
    endDate: moment().toDate()
}

insightUtils.last30DaysRange = {
    startDate: moment().subtract(30, 'days').toDate(),
    endDate: moment().toDate()
}


insightUtils.reportList = function () {
    return {
        aging: "Aging",
        balance_sheet: "Balance Sheet",
        general_ledger: "General Ledger",
        income_statement: "Income Statement",
        cash_flow_statement: "Statement Of Cash Flow",
        transactions: "Transaction Detail",
        deposits: "Deposit Detail",
        trial_balance: "Trial Balance",
        recurring_payments: "Auto-Pay Report",
        reconciliation: "Reconciliation History",
        rent_roll: "Rent Roll",
        expense_payments: "Bill Payments",
        expenses: "Expenses",
        vendor_payments: "Vendor Payments",
        property_owner_transactions: "Owner Transactions"
    }
}

insightUtils.emptyProperty = function() { return {name: "", property_type: "", ownership_type: ''}}
insightUtils.emptyUnit = function() { return {property_id: "", street: '', unit_number: '', floor_plan_name: '', beds: '', baths: '', city: '', state: '', zip: '', square_feet: ''}}
insightUtils.emptyUser = function () { return {user_role_id: "", first_name: "", last_name: "", email: "", cell_phone: "", password: ""}}
insightUtils.emptyUserRole = function () { return {name: "", user_type: "", listings: "", screening: "", expenses: "", payments: "", maintenance_requests: "", reports: ""}}
insightUtils.emptyPropertyOwner = function() { return {owner_type: '', name: ''}}
insightUtils.emptyPropertyOwnership = function() { return {property_owner_id: '', percentage: ''}}
insightUtils.emptyLeaseResident = function() { return {resident: {first_name: '', middle_name: '', last_name: '', suffix: '', email: '', phone_number: '', resident_pets: []}}}
insightUtils.emptyResidenceHistory = function() { return {id: '', street: '', city: '', state: '', zip: '', country: 'usa', months_at_address: '', residence_type: '', landlord_name: "", landlord_phone: "", landlord_email: "", monthly_rent: ""}}
insightUtils.emptyPaymentMethod = function() { return {method: '', billing_first_name: '', billing_last_name: '', nickname: '', billing_street: '', billing_city: '', billing_state: '', billing_zip: '', billing_agreement: '', credit_card_number: '', credit_card_expires_on: '', credit_card_cvv: '', ach_account_type: 'checking', ach_routing_number: '', ach_account_number: ''}}
insightUtils.emptyPayment = function() { return {payment_method_id: "",amount: "",fee: "",fee_responsibility: "",external_processing_fee: "",payment_at: "",extra_info: ""}}
insightUtils.emptyLeadInfo = function() { return {beds: "", baths: "", square_feet: "", lead_source_id: "", move_in_on: "", notes: ""}}
insightUtils.emptyCharge = function() { return {hash_id: '',property_id: '',lease_id: '',charge_type_id: '',description: '',frequency: 'one_time',prorated: false, amount: '', send_resident_payment_link: true, due_on: new Date()}}
insightUtils.emptyAccount = function() { return {code: '', name: '', account_category_id: '', description: ''}}
insightUtils.emptyBankAccount = function(accountPurpose) { return {account_purpose: accountPurpose, name: '', account_type: '', routing_number: '', account_number: '', account_number_confirmation: ''}}
insightUtils.emptyCompanyTaxpayerInfo = function() { return { name: "", business_name: "", tax_classification: "", llc_tax_classification: "", other_tax_classification: "", exempt_payee_code: "", exempt_from_facta: "", street: "", city_state_zip: "", requesters_name_and_address: "", account_numbers: "", ssn: "", ein: "", signature: "", } }
insightUtils.emptyMaintenanceRequest = function () {return {property_id: "", lease_id: "", resident_id: "", maintenance_request_category_id: "", title: "", description: "", status: "open", urgency: "normal", assigned_to_type_and_id: "", submitted_on: "", scheduled_on: "", closed_on: "", recurring: "", permission_to_enter: false, pets_in_unit: false, pet_description: ""}}
insightUtils.emptyResidentPet = function() { return {pet_type: '', breed: '', weight: '', color: '', name: ''}}
insightUtils.emptyResidentVehicle = function() { return {make: '', model: '', year: '', plate_number: ''}}
insightUtils.emptyExpenseAccountSplit = function() { return {account_id: '', amount: ''}}
insightUtils.emptyJournalEntrySplit = function() { return {account_id: '', debit_amount: '', credit_amount: ''}}
insightUtils.emptyExpensePropertySplit = function() { return {company_id: '', property_id: '', unit_id: '', amount: ''}}
insightUtils.emptyAccountReconciliation = function() { return {bank_account_id: '', begin_on: '', end_on: '', beginning_balance: '', ending_balance: ''}}
insightUtils.emptyAnnouncement = function() { return {subject: '', body: '', mediums: ['email', 'chat', 'text'], send_when: ''}}
insightUtils.emptyBulkCharge = function() { return {frequency: "", charge_type_id: "", due_on: "", end_on: "", amount: "", description: "", same_for_all: true, prorated: false}}
insightUtils.emptyVendor = function() { return {name: "", email: "", phone_number: "", vendor_category_id: "", vendor_category_name: "", status: "",  street: "", city: "", state: "", zip: "", billing_same_as_shipping: "", billing_street: "", billing_street_2: "", billing_city: "", billing_state: "", billing_zip: "", legal_business_dba: "", tax_classification: "", tax_id: "", tax_id_type: "ein", generate_1099: ""}}
insightUtils.emptyVendorInsurance = function() { return {insurance_type_id: "", effective_on: "", expires_on: "", insurance_company_name: "", policy_number: "", liability_limit: "", declarations_batch_number: ""}}
insightUtils.emptyVendorLicense = function() { return {license_type_id: "", effective_on: "", expires_on: "", license_number: "", issuing_agency: "", insurances_batch_number: ""}}
insightUtils.emptyCommunication = function() { return {subject: "", body: ""}}
insightUtils.phoneNumberMask = function() { return [/[1-9]/,/\d/,/\d/,"-",/\d/,/\d/,/\d/,"-",/\d/,/\d/,/\d/,/\d/]}
insightUtils.ssnMask = function() { return [/\d/,/\d/,/\d/,"-",/\d/,/\d/,"-",/\d/,/\d/,/\d/,/\d/]}
insightUtils.einMask = function() { return [/\d/,/\d/,"-",/\d/,/\d/,/\d/,/\d/,/\d/,/\d/,/\d/]}
insightUtils.dateMask = function() { return [/\d/,/\d/,"/",/\d/,/\d/,"/",/\d/,/\d/,/\d/,/\d/]}
insightUtils.zipMask = function() { return [/\d/,/\d/,/\d/,/\d/,/\d/]}
insightUtils.expirationDateMask = function() { return [/\d/,/\d/,"/",/\d/,/\d/]}
insightUtils.currencyMask = function(allowNegative) {
    const defaultMaskOptions = {
        prefix: '$',
        suffix: '',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ',',
        allowDecimal: true,
        decimalSymbol: '.',
        decimalLimit: 2, // how many digits allowed after the decimal
        integerLimit: 10, // limit length of integer numbers
        allowNegative: allowNegative,
        allowLeadingZeroes: false,
    }

    const currencyMask = createNumberMask({
        ...defaultMaskOptions
    })

    return currencyMask
}
insightUtils.centsMask = function(allowNegative) {
    const defaultMaskOptions = {
        prefix: '',
        suffix: '¢',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ',',
        allowDecimal: true,
        decimalSymbol: '.',
        decimalLimit: 1, // how many digits allowed after the decimal
        integerLimit: 2, // limit length of integer numbers
        allowNegative: allowNegative,
        allowLeadingZeroes: false,
    }

    const currencyMask = createNumberMask({
        ...defaultMaskOptions
    })

    return currencyMask
}
