import EmailTemplateListPage from "../components/admin/EmailTemplateListPage";
import insightUtils from "./insightUtils";

export default function insightRoutes() { }

insightRoutes.dashboard = function() { return '/dashboard' }

insightRoutes.landlordSignIn = function() { return '/dashboard_users/sign_in' }
insightRoutes.landlordSignUp = function() { return '/dashboard_users/sign_up' }
insightRoutes.landlordForgotPassword = function() { return '/dashboard_users/forgot_password' }

insightRoutes.residentSignIn = function() { return '/portal/sign_in' }
insightRoutes.residentSignUp = function() { return '/portal/sign_up' }
insightRoutes.residentForgotPassword = function() { return '/portal/forgot_password' }

insightRoutes.residentApplicationEdit = function(leaseResidentId) { return '/portal/applications/' + leaseResidentId + '/edit' }

insightRoutes.companyList = function() { return '/companies' }
insightRoutes.companyEdit = function(companyId) { return '/companies/' + companyId + '/edit' }
insightRoutes.companyHistory = function(companyId) { return '/companies/' + companyId + '/history' }

insightRoutes.propertyList = function() { return '/properties/list' }
insightRoutes.propertyChooseAddMethod = function() { return '/properties/choose_add' }
insightRoutes.propertyNew = function() { return '/properties/new' }
insightRoutes.propertyUpload = function() { return '/properties/upload' }
insightRoutes.propertyShow = function(propertyId) { return '/properties/' + propertyId }
insightRoutes.propertyEdit = function(propertyId) { return '/properties/' + propertyId + '/edit' }
insightRoutes.propertyHistory = function(propertyId) { return '/properties/' + propertyId + '/history' }
insightRoutes.propertyScreeningAttestation = function(propertyId) { return '/properties/' + propertyId + '/screening_attestation' }

insightRoutes.propertyListingsShow = function(propertyListingId) { return '/property-listings/' + propertyListingId }
insightRoutes.propertyListingsPreview = function(propertyListingId) { return '/property-listings-do-not-share/' + propertyListingId }
insightRoutes.propertyListingList = function() { return '/property_listings/list' }
insightRoutes.propertyListingNew = function() { return '/property_listings/new' }
insightRoutes.propertyListingEdit = function(propertyId) { return '/property_listings/' + propertyId + '/edit' }
insightRoutes.unitListingShow = function(unitListingId, urlStub) { return urlStub ? '/available-to-rent/' + urlStub + '/' + unitListingId : '/available-to-rent/' + unitListingId }
insightRoutes.unitListingPreview = function(unitListingId, urlStub) { return urlStub ? '/listing-preview-do-not-share/' + urlStub + '/' + unitListingId : '/listing-preview-do-not-share/' + unitListingId }
insightRoutes.unitListingList = function(propertyId) { return '/property_listings/' + propertyId + '/units' }
insightRoutes.unitListingPhotosEdit = function(propertyId, unitId) { return '/property_listings/' + propertyId + '/units/' + unitId + '/photos'  }
insightRoutes.unitListingAmenitiesEdit = function(propertyId, unitId) { return '/property_listings/' + propertyId + '/units/' + unitId + '/amenities'  }
insightRoutes.unitListingDescriptionEdit = function(propertyId, unitId) { return '/property_listings/' + propertyId + '/units/' + unitId + '/description'  }

insightRoutes.accountReconciliationList = function() { return '/account_reconciliations/list' }
insightRoutes.accountReconciliationNew = function() { return '/account_reconciliations/new' }
insightRoutes.accountReconciliationEdit = function(accountReconciliationsId) { return '/account_reconciliations/' + accountReconciliationsId + '/edit' }

insightRoutes.financialConnectionList = function() { return '/financial_connections/list' }
insightRoutes.financialConnectionNew = function() { return '/financial_connections/new' }
insightRoutes.financialConnectionReview = function(bankAccountId) { return '/financial_connections/' + bankAccountId + '/review' }
insightRoutes.financialConnectionShowCategorized = function(bankAccountId) { return '/financial_connections/' + bankAccountId + '/show_categorized' }
insightRoutes.financialConnectionShowExcluded = function(bankAccountId) { return '/financial_connections/' + bankAccountId + '/show_excluded' }
insightRoutes.financialConnectionTransactionMatch = function(bankAccountId, bankTransactionId) { return '/financial_connections/' + bankAccountId + '/match/' + bankTransactionId }

insightRoutes.taxReportingList = function() { return '/tax_reporting/list' }

insightRoutes.expenseList = function() { return '/expenses/list' }
insightRoutes.expenseNew = function() { return '/expenses/new' }
insightRoutes.expenseEdit = function(expenseId) { return '/expenses/' + expenseId + '/edit' }

insightRoutes.bulkChargeList = function() { return '/bulk_charges/list' }
insightRoutes.bulkChargeNew = function() { return '/bulk_charges/new' }
insightRoutes.bulkChargeEdit = function(bulkChargeId) { return '/bulk_charges/' + bulkChargeId + '/edit' }
insightRoutes.bulkChargeEditLeases = function(bulkChargeId) { return '/bulk_charges/' + bulkChargeId + '/edit_leases' }

insightRoutes.announcementList = function() { return '/announcements/list' }
insightRoutes.announcementNew = function() { return '/announcements/new' }
insightRoutes.announcementEdit = function(announcementId) { return '/announcements/' + announcementId + '/edit' }
insightRoutes.announcementEditRecipients = function(announcementId) { return '/announcements/' + announcementId + '/edit_recipients' }
insightRoutes.announcementConfirmation = function(announcementId) { return '/announcements/' + announcementId + '/confirmation' }
insightRoutes.announcementShow = function(currentUser, announcementId) {
    const url = '/announcements/' + announcementId

    if (insightUtils.isResident(currentUser)) {
        return "/portal" + url
    }
    else {
        return url
    }
}

insightRoutes.mileageNew = function() { return '/expenses/mileage/new' }
insightRoutes.mileageEdit = function(mileageId) { return '/expenses/mileage/' + mileageId + '/edit' }

insightRoutes.billList = function() { return '/bills/list' }
insightRoutes.billNew = function() { return '/bills/new' }
insightRoutes.billEdit = function(billId) { return '/bills/' + billId + '/edit' }
insightRoutes.billPayment = function() { return '/bills/payments' }
insightRoutes.billPaymentVoid = function(billId) { return '/bills/payments/' + paymentId + '/void' }
insightRoutes.billCheckPrinting = function() { return '/bills/check_printing' }
insightRoutes.billCheckReprinting = function() { return '/bills/check_reprinting' }

insightRoutes.journalEntryList = function() { return '/journal_entries/list' }
insightRoutes.journalEntryNew = function() { return '/journal_entries/new' }
insightRoutes.journalEntryEdit = function(journalEntryId) { return '/journal_entries/' + journalEntryId + '/edit' }

insightRoutes.unitList = function(propertyId, status) { return status ? (propertyId ? '/properties/' + propertyId + '/units/list/' + status : '/units/list/' + status) : (propertyId ? '/properties/' + propertyId + '/units' : '/units') }
insightRoutes.unitNew = function(propertyId) { return propertyId ? '/properties/' + propertyId + '/units/new' : '/units/new'  }
insightRoutes.unitEdit = function(propertyId, unitId) { return '/properties/' + propertyId + '/units/' + unitId + '/edit' }

insightRoutes.applicationList = function(propertyId) { return propertyId ? '/properties/' + propertyId + '/applicants' : '/leases' }
insightRoutes.applicationEdit = function(leaseResidentId) { return '/applications/' + leaseResidentId + '/edit' }
insightRoutes.applicationViewReport = function(leaseResidentId, leaseResidentReportId) { return '/applications/' + leaseResidentId + '/reports/' + leaseResidentReportId }
insightRoutes.applicationPrint = function(leaseResidentId) { return '/print/' + leaseResidentId + '/resident_application' }

insightRoutes.leadList = function(propertyId) { return propertyId ? '/properties/' + propertyId + '/leads' : '/leads' }
insightRoutes.leadEdit = function(leadId) { return '/leads/' + leadId + '/edit' }
insightRoutes.leadNew = function(propertyId, unitId) { return propertyId && unitId ? '/leads/new/' + propertyId + '/' + unitId : (propertyId ? '/leads/new/' + propertyId : '/leads/new') }

insightRoutes.leaseEdit = function(leaseId) { return '/leases/' + leaseId + '/edit' }
insightRoutes.leaseCancelMoveIn = function(leaseId) { return '/leases/' + leaseId + '/cancel_move_in' }
insightRoutes.leaseShow = function(leaseId) { return '/leases/' + leaseId + '/show' }
insightRoutes.leaseAddResident = function(leaseId, leaseResidentType) { return '/leases/' + leaseId + '/residents/new/' + leaseResidentType}
insightRoutes.leaseMoveOutOrRenew = function(leaseId) { return '/leases/' + leaseId + '/move_out_renew' }
insightRoutes.leaseDocumentsShow = function(leaseId) { return '/leases/' + leaseId + '/documents' }
insightRoutes.leaseHistory = function(leaseId) { return '/leases/' + leaseId + '/history' }

insightRoutes.noteList = function() { return '/notes/list' }
insightRoutes.noteListForProperty = function(propertyId) { return '/notes/properties/' + propertyId }
insightRoutes.noteListForLease = function(leaseId) { return '/notes/leases/' + leaseId }
insightRoutes.noteNew = function() { return '/notes/new' }
insightRoutes.noteEdit = function(noteId) { return '/notes/'+noteId+'/edit' }
insightRoutes.noteNewForProperty = function(propertyId) { return '/notes/properties/' + propertyId + '/new' }
insightRoutes.noteNewForLease = function(leaseId) { return '/notes/leases/' + leaseId + '/new' }

insightRoutes.residentLedger = function(leaseId) { return '/leases/' + leaseId + '/ledger'}
insightRoutes.residentLedgerDetail = function(leaseId, ledgerItemId) { return '/leases/' + leaseId + '/ledger/' + ledgerItemId}
insightRoutes.residentLedgerEdit = function(leaseId, ledgerItemId) { return '/leases/' + leaseId + '/ledger/' + ledgerItemId + '/edit'}
insightRoutes.residentInvoiceList = function(leaseId) { return '/leases/' + leaseId + '/invoices' }
insightRoutes.residentInvoiceShow = function(leaseId, invoiceId) { return '/leases/' + leaseId + '/invoices/' + invoiceId }

insightRoutes.residentChooseAddMethod = function() { return '/residents/choose_add' }
insightRoutes.residentUpload = function() { return '/residents/upload' }
insightRoutes.residentNew = function() { return '/residents/new' }
insightRoutes.residentEdit = function(leaseId, leaseResidentId) { return '/leases/' + leaseId + '/lease_residents/' + leaseResidentId + '/edit'}
insightRoutes.residentPetNew = function(leaseId, residentId) { return '/leases/' + leaseId + '/resident_pets/new/' + residentId}
insightRoutes.residentPetEdit = function(leaseId, residentPetId) { return '/leases/' + leaseId + '/resident_pets/' + residentPetId + '/edit'}
insightRoutes.residentVehicleNew = function(leaseId, residentId) { return '/leases/' + leaseId + '/resident_vehicles/new/' + residentId}
insightRoutes.residentVehicleEdit = function(leaseId, residentVehicleId) { return '/leases/' + leaseId + '/resident_vehicles/' + residentVehicleId + '/edit'}

insightRoutes.propertyOwnerList = function() { return '/property_owners' }
insightRoutes.propertyOwnerNew = function() { return '/property_owners/new' }
insightRoutes.propertyOwnerEdit = function(propertyOwnerId) { return '/property_owners/' + propertyOwnerId + '/edit' }

insightRoutes.vendorList = function() { return '/vendors' }
insightRoutes.vendorNew = function() { return '/vendors/new' }
insightRoutes.vendorEdit = function(vendorId) { return '/vendors/' + vendorId + '/edit' }

insightRoutes.maintenanceRequestList = function() { return '/maintenance_requests' }
insightRoutes.maintenanceRequestNew = function() { return '/maintenance_requests/new' }
insightRoutes.maintenanceRequestEdit = function(maintenanceRequestId) { return '/maintenance_requests/' + maintenanceRequestId + '/edit' }

insightRoutes.screeningList = function() { return '/screenings' }
insightRoutes.screeningActivate = function() { return '/screenings/activate' }
insightRoutes.screeningNew = function(propertyId, unitId) { return propertyId && unitId ? '/screenings/new/' + propertyId + '/' + unitId : (propertyId ? '/screenings/new/' + propertyId : '/screenings/new') }
insightRoutes.screeningInviteLead = function(leaseResidentId) { return '/screenings/invite_lead/' + leaseResidentId }

insightRoutes.userList = function() { return '/dashboard_users' }
insightRoutes.userNew = function() { return '/dashboard_users/new' }
insightRoutes.userEdit = function(userId) { return '/dashboard_users/'+ userId + '/edit' }

insightRoutes.userRoleList = function() { return '/user_roles' }
insightRoutes.userRoleNew = function() { return '/user_roles/new' }
insightRoutes.userRoleEdit = function(userRoleId) { return '/user_roles/'+ userRoleId + '/edit' }

insightRoutes.accountList = function() { return '/accounts' }
insightRoutes.accountNew = function() { return '/accounts/new' }
insightRoutes.accountEdit = function(accountCode) { return '/accounts/'+ accountCode + '/edit' }
insightRoutes.propertyBankAccountList = function() { return '/accounts/property_bank_accounts' }

insightRoutes.bankAccountNew = function() { return '/bank_accounts/new' }
insightRoutes.bankAccountEdit = function(bankAccountId) { return '/bank_accounts/' + bankAccountId + '/edit' }

insightRoutes.reportList = function() { return '/reports' }
insightRoutes.reportRun = function(reportId, params) {
    let url = '/reports/' + reportId + '/run'

    if (params !== null) {
        if (typeof params === "object") {
            const queryString = new URLSearchParams(params).toString();
            url += "?" + queryString
        }
        else if (typeof params === "string") {
            url += "?" + params
        }
    }

    return url
}

insightRoutes.financialSummary = function() { return '/financials' }
insightRoutes.financialChargeNew = function(propertyId, leaseId, isProposedCharge, hideMonthly) { return leaseId ? '/financials/charges/new/' + propertyId + '/' + leaseId + '/' + (!!isProposedCharge) + '/' + (!!hideMonthly) : '/financials/charges/new' }
insightRoutes.financialChargeEdit = function(chargeId) { return '/financials/charges/' + chargeId + '/edit' }
insightRoutes.financialPaymentDueManual = function() { return '/financials/payments/due/manual' }
insightRoutes.financialPaymentDueAuto = function() { return '/financials/payments/due/auto' }
insightRoutes.financialPaymentEdit = function(paymentId) { return '/financials/payments/' + paymentId + '/edit' }
insightRoutes.financialPaymentNewChoose = function(leaseId, leaseResidentId) { return '/financials/payments/new/choose/' + leaseId + (leaseResidentId ? '/' + leaseResidentId : '') }
insightRoutes.financialPaymentNewAuto = function(leaseId, leaseResidentId) { return '/financials/payments/new/auto/' + leaseId + (leaseResidentId ? '/' + leaseResidentId : '') }

insightRoutes.onboardingPayments = function() { return '/onboarding/payments'}
insightRoutes.onboardingInsurance = function() { return '/onboarding/insurance'}
insightRoutes.onboardingLeaseDocs = function(tab='') { return tab ?  `/onboarding/lease_docs/${tab}` : '/onboarding/lease_docs'}
insightRoutes.onboardingSignDoc = function(externalId) { return `/onboarding/lease_docs/${externalId}/sign`}
insightRoutes.onboardingListings = function() { return '/onboarding/listings'}
insightRoutes.onboardingScreening = function() { return '/onboarding/screening'}
insightRoutes.onboardingCollections = function() { return '/onboarding/collections'}
insightRoutes.onboardingFinancialConnections = function() { return '/onboarding/financial_connections'}
insightRoutes.onboardingTaxReporting = function() { return '/onboarding/tax_reporting'}

insightRoutes.settingList = function(mode, propertyId) { return '/settings/' + mode  + (propertyId ? '/'+ propertyId : '') }
insightRoutes.settingEdit = function(mode, propertyId, settingGroupKey, redirectIfMissing) { return  insightRoutes.settingList(mode, propertyId) + '/'+settingGroupKey+'/edit' + (redirectIfMissing ? '/redirectIfMissing' : '') }

insightRoutes.adminEmailTemplateList = function() { return '/admin_setup/email_templates'}
insightRoutes.adminConsumerList = function() { return '/admin_setup/consumers' }
insightRoutes.adminUtilities = function() { return '/admin_setup/utilities'}

insightRoutes.upgradeForUnits = function() { return '/upgrade/units'}

insightRoutes.communicationCenter = function(currentUser, communicationType, propertyId, conversationId, action) {
    let parts = []
    if (communicationType) {
        parts.push(communicationType)

        if (insightUtils.isResident(currentUser)) {
            if (conversationId) {
                parts.push(conversationId)
            }
        }
        else if (propertyId) {
            parts.push(propertyId)

            if (conversationId) {
                parts.push(conversationId)

                if (action) {
                    parts.push(action)
                }
            }
        }
    }

    let url =  parts.length > 0 ? "/communications/" + parts.join("/") : "/communications"

    if (insightUtils.isResident(currentUser)) {
        return "/portal" + url
    }
    else {
        return url
    }
}
insightRoutes.residentListForProperty = function(propertyId, status, daysFrom, daysTo) { return insightRoutes.residentList(status, daysFrom, daysTo, propertyId) }
insightRoutes.residentList = function(status, daysFrom, daysTo, propertyId) {

    let pathParts = []

    if (propertyId) {
        pathParts.push('properties/' + propertyId + '/residents')
    }
    else {
        pathParts.push('residents/list')
    }

    if (status) {
        pathParts.push(status)

        if (!(daysFrom === undefined)) {
            pathParts.push(daysFrom)

            if (!(daysTo === undefined)) {
                pathParts.push(daysTo)
            }
        }
    }

    return '/' + pathParts.join('/')

}


/* RENTER PORTAL ROUTES */
insightRoutes.renterPortal = function() { return '/portal/'}
insightRoutes.renterProfileEdit = function() { return '/portal/profile/edit'}
insightRoutes.renterApplicationEdit = function(leaseResidentId) { return '/portal/applications/' + leaseResidentId + '/edit' }
insightRoutes.renterApplicationViewReport = function(leaseResidentId, leaseResidentReportId) { return '/portal/applications/' + leaseResidentId + '/reports/' + leaseResidentReportId }

insightRoutes.renterLeaseShow = function(leaseId) { return '/portal/leases/' + leaseId }
insightRoutes.renterLeaseDocumentsShow = function(leaseId) { return '/portal/leases/' + leaseId + '/documents' }
insightRoutes.renterLeaseDocumentSign = function(leaseId, externalId) { return `/portal/leases/${leaseId}/documents/${externalId}/sign` }
insightRoutes.renterMoveOutOrRenew = function(leaseId) { return '/portal/leases/' + leaseId + '/move_out_renew' }
insightRoutes.renterLedger = function(leaseId) { return '/portal/leases/' + leaseId + '/ledger'}
insightRoutes.renterLedgerDetail = function(leaseId, ledgerItemId) { return '/portal/leases/' + leaseId + '/ledger/' + ledgerItemId}
insightRoutes.renterPaymentNew = function(leaseId, leaseResidentId) { return '/portal/leases/' + leaseId + '/payments/' + leaseResidentId + '/one_time'}
insightRoutes.renterRecurringPaymentSchedule = function(leaseId, leaseResidentId) { return '/portal/leases/' + leaseId + '/payments/' + leaseResidentId + '/schedule'}
insightRoutes.renterRecurringPaymentEdit = function(leaseId, leaseResidentId) { return '/portal/leases/' + leaseId + '/payments/' + leaseResidentId + '/recurring'}
insightRoutes.cashPayCoupon = function(leaseResidentId) { return '/print/' + leaseResidentId + '/cash_pay_coupon' }

insightRoutes.renterMaintenanceRequestList = function() { return '/portal/maintenance_requests' }
insightRoutes.renterMaintenanceRequestNew = function() { return '/portal/maintenance_requests/new' }
insightRoutes.renterMaintenanceRequestEdit = function(maintenanceRequestId) { return '/portal/maintenance_requests/' + maintenanceRequestId + '/edit' }

insightRoutes.renterInsuranceStart = function(leaseId) { return '/portal/insurance/'+ leaseId + '/start' }
insightRoutes.renterInsuranceEdit = function(leaseId, apiPartnerId) { return '/portal/insurance/'+ leaseId + '/edit/' + apiPartnerId }
insightRoutes.renterInsuranceShow = function(leaseId) { return '/portal/insurance/'+ leaseId }

insightRoutes.renterPaymentMethodList = function(leaseId) { return '/portal/leases/' + leaseId + '/payment_methods'}
insightRoutes.renterPaymentMethodEdit = function(leaseId, paymentMethodId) { return '/portal/leases/' + leaseId + '/payment_methods/' + paymentMethodId + '/edit' }
insightRoutes.renterPaymentMethodNew = function(leaseId) { return '/portal/leases/' + leaseId + '/payment_methods/new' }

insightRoutes.renterCreditReportingOnboarding = function() { return '/portal/credit_reporting/onboarding' }
insightRoutes.renterCreditReportingActivate = function() { return '/portal/credit_reporting/activate' }
insightRoutes.renterCreditReportingActivityList = function() { return '/portal/credit_reporting/activities' }

insightRoutes.renterInvoiceList = function(leaseId) { return '/portal/leases/' + leaseId + '/invoices' }
insightRoutes.renterInvoiceShow = function(leaseId, invoiceId) { return '/portal/leases/' + leaseId + '/invoices/' + invoiceId }

