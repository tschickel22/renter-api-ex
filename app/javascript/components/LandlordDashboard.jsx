import React, {useEffect} from 'react';
import {Route, Routes} from "react-router-dom";
import LandlordSideBar from "./shared/LandlordSideBar";
import TopBar from "./shared/TopBar";
import {useSelector} from "react-redux";
import LandlordSignInPage from "./landlord/users/LandlordSignInPage";
import PropertyListPage from "./landlord/companies/PropertyListPage";
import PropertyEditModal from "./landlord/companies/PropertyEditModal";
import LandlordSignUpStart from "./landlord/users/LandlordSignUpStart";
import insightRoutes from "../app/insightRoutes";
import PropertyShowPage from "./landlord/companies/PropertyShowPage";
import BasePage from "./landlord/companies/BasePage";
import UnitListPage from "./landlord/companies/UnitListPage";
import ApplicationEditPage from "./landlord/leases/ApplicationEditPage";
import ApplicationListPage from "./landlord/leases/ApplicationListPage";
import UnitEditModal from "./landlord/companies/UnitEditModal";
import LeaseShowPage from "./landlord/leases/LeaseShowPage";
import LeaseEditPage from "./landlord/leases/LeaseEditPage";
import ScreeningListPage from "./landlord/leases/ScreeningListPage";
import CompanyEditModal from "./landlord/companies/CompanyEditModal";
import UserListPage from "./landlord/users/UserListPage";
import ScreeningNewPage from "./landlord/leases/ScreeningNewPage";
import ApplicationViewReportPage from "./landlord/leases/ApplicationViewReportPage";
import LeadListPage from "./landlord/leases/LeadListPage";
import AlertMessageModal from "./shared/AlertMessageModal";
import ResidentEditModal from "./landlord/leases/ResidentEditModal";
import ResidentAddModal from "./landlord/leases/ResidentAddModal";
import ResidentPetEditModal from "./landlord/leases/ResidentPetEditModal";
import ResidentVehicleEditModal from "./landlord/leases/ResidentVehicleEditModal";
import FinancialSummaryPage from "./landlord/financial/FinancialSummaryPage";
import ChargeEditModal from "./landlord/financial/ChargeEditModal";
import PaymentsOnboardingPage from "./landlord/onboarding/payments/PaymentsOnboardingPage";
import SettingListPage from "./landlord/settings/SettingListPage";
import SettingEditPage from "./landlord/settings/SettingEditPage";
import PaymentDuePage from "./landlord/financial/PaymentDuePage";
import InsuranceOnboardingPage from "./landlord/onboarding/insurance/InsuranceOnboardingPage";
import ScreeningOnboardingPage from "./landlord/onboarding/screening/ScreeningOnboardingPage";
import CollectionsOnboardingPage from "./landlord/onboarding/collections/CollectionsOnboardingPage";
import LeaseDocsOnboardingPage from "./landlord/onboarding/lease_docs/LeaseDocsOnboardingPage";
import ListingsOnboardingPage from "./landlord/onboarding/listings/ListingsOnboardingPage";
import PaymentNewPage from "./landlord/financial/PaymentNewPage";
import CompanyListPage from "./landlord/companies/CompanyListPage";
import DashboardLandingRedirector from "./DashboardLandingRedirector";
import VendorListPage from "./landlord/vendors/VendorListPage";
import VendorEditPage from "./landlord/vendors/VendorEditPage";
import MaintenanceRequestListPage from "./landlord/maintenanceRequests/MaintenanceRequestListPage";
import MaintenanceRequestEditPage from "./landlord/maintenanceRequests/MaintenanceRequestEditPage";
import EmailTemplateListPage from "./admin/EmailTemplateListPage";
import CommunicationsCenterPage from "./landlord/communications/CommunicationsCenterPage";
import ResidentLedgerPage from "./landlord/financial/ResidentLedgerPage";
import ResidentLedgerDetailPage from "./landlord/financial/ResidentLedgerDetailPage";
import LeaseCancelMoveInPage from "./landlord/leases/LeaseCancelMoveInPage";
import LeaseMoveOutOrRenewPage from "./landlord/leases/LeaseMoveOutOrRenewPage";
import ReportRunPage from "./landlord/reports/ReportRunPage";
import ForgotPasswordPage from "./landlord/users/ForgotPasswordPage";
import ChangePasswordPage from "./landlord/users/ChangePasswordPage";
import AccountListPage from "./landlord/financial/AccountListPage";
import AccountEditModal from "./landlord/financial/AccountEditModal";
import PaymentsPropertyBankAccountsView from "./landlord/onboarding/payments/PaymentsPropertyBankAccountsView";
import PropertyChooseAdditionMethodModal from "./landlord/companies/PropertyChooseAdditionMethodModal";
import PropertyUploadPage from "./landlord/companies/PropertyUploadPage";
import ResidentUploadPage from "./landlord/leases/ResidentUploadPage";
import ResidentChooseAdditionMethodModal from "./landlord/leases/ResidentChooseAdditionMethodModal";
import ResidentAddPage from "./landlord/leases/ResidentAddPage";
import ExpenseListPage from "./landlord/expenses/ExpenseListPage";
import ExpenseEditPage from "./landlord/expenses/ExpenseEditPage";
import BankAccountEditPage from "./landlord/financial/BankAccountEditPage";
import JournalEntryListPage from "./landlord/journal_entries/JournalEntryListPage";
import JournalEntryEditPage from "./landlord/journal_entries/JournalEntryEditPage";
import SubscriptionPricingPage from "./landlord/subscriptions/SubscriptionPricingPage";
import SubscriptionThankYouPage from "./landlord/subscriptions/SubscriptionThankYouPage";
import SubscriptionInactivePage from "./landlord/subscriptions/SubscriptionInactivePage";
import PropertyListingListPage from "./landlord/listings/PropertyListingListPage";
import PropertyListingEditPage from "./landlord/listings/PropertyListingEditPage";
import UnitListingListPage from "./landlord/listings/UnitListingListPage";
import UnitListingPhotosEditPage from "./landlord/listings/UnitListingPhotosEditPage";
import UnitListingAmenitiesEditPage from "./landlord/listings/UnitListingAmenitiesEditPage";
import UnitListingDescriptionEditPage from "./landlord/listings/UnitListingDescriptionEditPage";
import PropertyListingNewPage from "./landlord/listings/PropertyListingNewPage";
import UnitListingShowPage from "./renter/listings/UnitListingShowPage";
import PropertyListingShowPage from "./renter/listings/PropertyListingShowPage";
import insightUtils from "../app/insightUtils";
import UserEditPage from "./landlord/users/UserEditPage";
import UserRoleListPage from "./landlord/users/UserRoleListPage";
import UserRoleEditPage from "./landlord/users/UserRoleEditPage";
import PropertyOwnerEditPage from "./landlord/companies/PropertyOwnerEditPage";
import PropertyOwnerListPage from "./landlord/companies/PropertyOwnerListPage";
import DashboardPage from "./landlord/dashboard/DashboardPage";
import ResidentListPage from "./landlord/leases/ResidentListPage";
import ResidentLedgerEditPage from "./landlord/financial/ResidentLedgerEditPage";
import AccountReconciliationListPage from "./landlord/accountReconciliations/AccountReconciliationListPage";
import AccountReconciliationAddPage from "./landlord/accountReconciliations/AccountReconciliationAddPage";
import AccountReconciliationEditPage from "./landlord/accountReconciliations/AccountReconciliationEditPage";
import ExpensePaymentListPage from "./landlord/expenses/ExpensePaymentListPage";
import CheckPrintingListPage from "./landlord/expenses/CheckPrintingListPage";
import ExpensePaymentVoidPage from "./landlord/expenses/ExpensePaymentVoidPage";
import AnnouncementListPage from "./landlord/communications/AnnouncementListPage";
import AnnouncementEditPage from "./landlord/communications/AnnouncementEditPage";
import AnnouncementRecipientEditPage from "./landlord/communications/AnnouncementRecipientEditPage";
import AnnouncementConfirmationPage from "./landlord/communications/AnnouncementConfirmationPage";
import AnnouncementShowPage from "./landlord/communications/AnnouncementShowPage";
import ConsumerListPage from "./admin/ConsumerListPage";
import BulkChargeListPage from "./landlord/financial/BulkChargeListPage";
import BulkChargeEditPage from "./landlord/financial/BulkChargeEditPage";
import BulkChargeLeaseEditPage from "./landlord/financial/BulkChargeLeaseEditPage";
import {updateIsMobileDevice} from "../slices/dashboardSlice";
import store from "../app/store";
import UtilitiesPage from "./admin/UtilitiesPage";
import FinancialConnectionListPage from "./landlord/financialConnections/FinancialConnectionListPage";
import FinancialConnectionBasePage from "./landlord/financialConnections/FinancialConnectionBasePage";
import BankTransactionReviewPage from "./landlord/financialConnections/BankTransactionReviewPage";
import FinancialConnectionsOnboardingPage from "./landlord/onboarding/./financialConnections/FinancialConnectionsOnboardingPage";
import BankTransactionExcludedPage from "./landlord/financialConnections/BankTransactionExcludedPage";
import BankTransactionCategorizedPage from "./landlord/financialConnections/BankTransactionCategorizedPage";
import BankTransactionMatchPage from "./landlord/financialConnections/BankTransactionMatchPage";
import DocumentIframe from "./landlord/onboarding/lease_docs/DocumentIframe";
import DocumentsListPage from './renter/DocumentsListPage';
import CompanyEditPage from "./landlord/companies/CompanyEditPage";
import TaxReportingBasePage from "./landlord/taxReporting/TaxReportingBasePage";
import TaxReportingOnboardingPage from "./landlord/onboarding/taxReporting/TaxReportingOnboardingPage";
import TaxReportingListPage from "./landlord/taxReporting/TaxReportingListPage";
import PropertyScreeningAttestationPage from "./landlord/companies/PropertyScreeningAttestationPage";
import NoteListPage from "./landlord/communications/NoteListPage";
import NoteEditPage from "./landlord/communications/NoteEditPage";
import HistoryPage from "./landlord/reports/HistoryPage";
import InvoiceListPage from "./renter/invoices/InvoiceListPage";
import InvoiceShowPage from "./renter/invoices/InvoiceShowPage";

const LandlordDashboard = ({}) => {

    const { currentUser, userStateLoaded } = useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)

    useEffect(() => {

        // Residents should not be here. Send them to the portal
        if (insightUtils.isResident(currentUser)) {
            window.document.location.href = '/portal?from-dashboard=true'
        }

    }, [currentUser]);

    function handleWindowSizeChange() {
        store.dispatch(
            updateIsMobileDevice(
                window.innerWidth <= 768
            )
        );
    }

    useEffect(() => {
        handleWindowSizeChange();
        window.addEventListener("resize", handleWindowSizeChange);
        return () => {
            window.removeEventListener("resize", handleWindowSizeChange);
        };
    }, []);

    return (
        <>
            {userStateLoaded && <>
                <div className="landscape-warning"><img src="/images/logo-ri.svg" alt="Renter Insight" /><div>Renter Insight is best used in portrait mode. Please rotate your phone.</div></div>
                <div className="main-wrapper">
                {!currentUser && <>
                    <Routes>
                        <Route path={insightRoutes.landlordSignUp()} element={<LandlordSignUpStart />} />
                        <Route path="dashboard_users/forgot_password"  element={<ForgotPasswordPage />}/>
                        <Route path="users/password/edit"  element={<ChangePasswordPage />}/>
                        <Route path="vendor_maintenance_requests/:maintenanceRequestId/:editMode" element={<div className="main-container landlord-portal"><MaintenanceRequestEditPage /></div>} />
                        <Route path="*" element={<LandlordSignInPage />}/>
                    </Routes>
                </>}
                {currentUser && <>
                    <LandlordSideBar />
                    <TopBar />

                    <div className="main-container landlord-portal">
                        {(!currentCompany || [constants.subscription_statuses.active.key].indexOf(currentCompany.subscription_status) < 0) ?
                            <>
                                {currentCompany && [constants.subscription_statuses.inactive.key, constants.subscription_statuses.cancelled.key].indexOf(currentCompany.subscription_status) >= 0 ?
                                    <Routes>
                                        <Route path="/">
                                            <Route path="*" element={<SubscriptionInactivePage/>}/>
                                        </Route>
                                    </Routes>
                                    :
                                    <Routes>
                                        <Route path="/">
                                            <Route path="*" element={<SubscriptionPricingPage mode="setup" />}/>
                                        </Route>
                                    </Routes>
                                }
                                </>
                            :
                            <Routes>
                                <Route path="/">
                                    <Route index element={<DashboardLandingRedirector />} />
                                    <Route path="dashboard" element={<BasePage />}>
                                        <Route index element={<DashboardPage />} />
                                    </Route>

                                    <Route path="announcements" element={<BasePage />}>
                                            {currentCompany.subscription_frequency == constants.subscription_frequencies.free.key ?
                                            <>
                                                <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                                <Route path ="*" element={<SubscriptionPricingPage mode="upgrade" />} />
                                            </>
                                        :
                                            <>
                                                <Route index element={<AnnouncementListPage />} />
                                                <Route path="list" element={<AnnouncementListPage />} />
                                                <Route path="new" element={<AnnouncementEditPage />} />
                                                <Route path=":announcementId" element={<AnnouncementShowPage />} />
                                                <Route path=":announcementId/edit" element={<AnnouncementEditPage />} />
                                                <Route path=":announcementId/edit_recipients" element={<AnnouncementRecipientEditPage />} />
                                                <Route path=":announcementId/confirmation" element={<AnnouncementConfirmationPage />} />
                                            </>
                                        }
                                    </Route>

                                    <Route path="properties" element={<BasePage />}>
                                        <Route index element={<PropertyListPage />} />
                                        <Route path="list" element={<PropertyListPage />} />
                                        <Route path="choose_add" element={<PropertyChooseAdditionMethodModal />} />
                                        <Route path="new" element={<PropertyEditModal />} />
                                        <Route path="upload" element={<PropertyUploadPage />} />
                                        <Route path=":propertyId" element={<PropertyShowPage />} />
                                        <Route path=":propertyId/edit" element={<PropertyEditModal />} />
                                        <Route path=":propertyId/screening_attestation" element={<PropertyScreeningAttestationPage />} />
                                        <Route path=":propertyId/units" element={<BasePage />}>
                                            <Route index element={<UnitListPage />} />
                                            <Route path="new" element={<UnitEditModal />} />
                                            <Route path=":unitId/edit" element={<UnitEditModal />} />
                                        </Route>
                                        <Route path=":propertyId/applicants" element={<BasePage />}>
                                            <Route index element={<ApplicationListPage />} />
                                        </Route>
                                        <Route path=":propertyId/residents" element={<BasePage />}>
                                            <Route index element={<ResidentListPage />} />
                                        </Route>
                                        <Route path=":propertyId/leads" element={<LeadListPage />} />
                                        <Route path=":propertyId/history" element={<HistoryPage mode="property" />} />
                                    </Route>

                                    <Route path="units" element={<BasePage />}>
                                        <Route index element={<UnitListPage />} />
                                        <Route path="list">
                                            <Route index element={<UnitListPage />} />
                                            <Route path=":status" element={<UnitListPage />} />
                                        </Route>
                                        <Route path="new" element={<UnitEditModal />} />
                                        <Route path=":unitId/edit" element={<UnitEditModal />} />
                                    </Route>

                                    <Route path="property_owners" element={<BasePage />}>
                                        <Route index element={<PropertyOwnerListPage />} />
                                        <Route path="new" element={<PropertyOwnerEditPage />} />
                                        <Route path=":propertyOwnerId/edit" element={<PropertyOwnerEditPage />} />
                                    </Route>

                                    <Route path="property_listings" element={<BasePage />}>
                                        <Route index element={<PropertyListingListPage />} />
                                        <Route path="list" element={<PropertyListingListPage />} />
                                        <Route path="new" element={<PropertyListingNewPage />} />
                                        <Route path="new/:propertyId" element={<PropertyListingNewPage />} />
                                        <Route path=":propertyId/edit" element={<PropertyListingEditPage />}  />
                                        <Route path=":propertyId/units" element={<BasePage />} >
                                            <Route index element={<UnitListingListPage />} />
                                            <Route path=":unitId/photos" element={<UnitListingPhotosEditPage />}/>
                                            <Route path=":unitId/amenities" element={<UnitListingAmenitiesEditPage />}/>
                                            <Route path=":unitId/description" element={<UnitListingDescriptionEditPage />}/>
                                        </Route>
                                        <Route path=":propertyId" element={<BasePage />} />
                                    </Route>

                                    <Route path="expenses" element={<BasePage />}>
                                        <Route index element={<ExpenseListPage type={ExpenseListPage.TYPE_EXPENSE} />} />
                                        <Route path="list" element={<ExpenseListPage type={ExpenseListPage.TYPE_EXPENSE} />} />
                                        <Route path="new" element={<ExpenseEditPage type={ExpenseListPage.TYPE_EXPENSE} />} />
                                        <Route path=":expenseId/edit" element={<ExpenseEditPage />} />

                                        <Route path="mileage" element={<BasePage />}>
                                            <Route path="new" element={<ExpenseEditPage />} />
                                            <Route path=":expenseId/edit" element={<ExpenseEditPage />} />
                                        </Route>
                                    </Route>

                                    <Route path="bills" element={<BasePage />}>
                                        {currentCompany.subscription_frequency == constants.subscription_frequencies.free.key ?
                                            <>
                                                <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                                <Route path ="*" element={<SubscriptionPricingPage mode="upgrade" />} />
                                            </>
                                        :
                                            <>
                                                <Route index element={<ExpenseListPage type={ExpenseListPage.TYPE_BILL} />} />
                                                <Route path="list" element={<ExpenseListPage type={ExpenseListPage.TYPE_BILL} />} />
                                                <Route path="new" element={<ExpenseEditPage type={ExpenseListPage.TYPE_BILL} />} />
                                                <Route path=":expenseId/edit" element={<ExpenseEditPage />} />
                                                <Route path="payments" element={<ExpensePaymentListPage />} />
                                                <Route path="payments/:paymentId/void" element={<ExpensePaymentVoidPage />} />
                                                <Route path="check_printing" element={<CheckPrintingListPage mode="print" />} />
                                                <Route path="check_reprinting" element={<CheckPrintingListPage mode="reprint" />} />
                                            </>
                                        }
                                    </Route>

                                    <Route path="journal_entries" element={<BasePage />}>
                                        <Route index element={<JournalEntryListPage />} />
                                        <Route path="list" element={<JournalEntryListPage />} />
                                        <Route path="new" element={<JournalEntryEditPage />} />
                                        <Route path=":journalEntryId/edit" element={<JournalEntryEditPage />} />
                                    </Route>

                                    <Route path="leases" element={<BasePage />}>
                                        <Route index element={<ApplicationListPage />} />
                                        <Route path=":leaseId">
                                            <Route index element={<LeaseShowPage />} />
                                            <Route path="show" element={<LeaseShowPage />} />
                                            <Route path="edit" element={<LeaseEditPage />} />
                                            <Route path="cancel_move_in" element={<LeaseCancelMoveInPage />} />
                                            <Route path="move_out_renew" element={<LeaseMoveOutOrRenewPage />} />
                                            <Route path="lease_residents/:leaseResidentId/edit" element={<ResidentEditModal />} />
                                            <Route path="residents/new/:leaseResidentType" element={<ResidentAddModal />} />
                                            <Route path="resident_pets/new/:residentId" element={<ResidentPetEditModal />} />
                                            <Route path="resident_pets/:residentPetId/edit" element={<ResidentPetEditModal />} />
                                            <Route path="resident_vehicles/new/:residentId" element={<ResidentVehicleEditModal />} />
                                            <Route path="resident_vehicles/:residentVehicleId/edit" element={<ResidentVehicleEditModal />} />
                                            <Route path="ledger" element={<ResidentLedgerPage />}>
                                                <Route path=":ledgerItemId" element={<ResidentLedgerDetailPage />} />
                                                <Route path=":ledgerItemId/edit" element={<ResidentLedgerEditPage />} />
                                            </Route>
                                            <Route path="invoices" element={<BasePage />}>
                                                <Route index element={<InvoiceListPage />} />
                                                <Route path="list" element={<InvoiceListPage />} />
                                                <Route path=":invoiceId" element={<InvoiceShowPage />} />
                                            </Route>
                                            <Route path="documents" element={<DocumentsListPage />} />
                                            <Route path="history" element={<HistoryPage mode="lease" />} />
                                        </Route>
                                    </Route>

                                    <Route path="notes" element={<BasePage />}>
                                        <Route index element={<NoteListPage />} />
                                        <Route path="list" element={<NoteListPage />} />
                                        <Route path="new" element={<NoteEditPage />}/>
                                        <Route path=":noteId/edit" element={<NoteEditPage />}/>
                                        <Route path="properties/:propertyId">
                                            <Route index element={<NoteListPage />} />
                                            <Route path="new" element={<NoteEditPage />}/>
                                        </Route>
                                        <Route path="leases/:leaseId">
                                            <Route index element={<NoteListPage />} />
                                            <Route path="new" element={<NoteEditPage />}/>
                                        </Route>
                                    </Route>

                                    <Route path="residents" element={<BasePage />}>
                                        <Route index element={<ResidentListPage />} />
                                        <Route path="list">
                                            <Route index element={<ResidentListPage />} />
                                            <Route path=":status" element={<ResidentListPage />} />
                                            <Route path=":status/:daysFrom" element={<ResidentListPage />} />
                                            <Route path=":status/:daysFrom/:daysTo" element={<ResidentListPage />} />
                                        </Route>
                                        <Route path="new" element={<ResidentAddPage />} />
                                        <Route path="choose_add" element={<ResidentChooseAdditionMethodModal />} />
                                        <Route path="upload" element={<ResidentUploadPage />} />
                                    </Route>

                                    <Route path="accounts" element={<BasePage />}>
                                        <Route index element={<AccountListPage />} />
                                        <Route path="new" element={<AccountEditModal />} />
                                        <Route path=":accountCode/edit" element={<AccountEditModal />} />
                                        <Route path="property_bank_accounts" element={<PaymentsPropertyBankAccountsView />} />
                                    </Route>

                                    <Route path="companies" element={<BasePage />}>
                                        <Route path="my/edit" element={<CompanyEditPage />} />
                                        <Route path="my/history" element={<HistoryPage mode="company" />} />
                                    </Route>


                                    <Route path="account_reconciliations" element={<BasePage />}>
                                        <Route index element={<AccountReconciliationListPage />} />
                                        <Route path="list" element={<AccountReconciliationListPage />} />
                                        <Route path="new" element={<AccountReconciliationAddPage />} />
                                        <Route path=":accountReconciliationId/edit" element={<AccountReconciliationEditPage />} />
                                    </Route>

                                    <Route path="applications" element={<BasePage />}>
                                        <Route index element={<ApplicationListPage />} />
                                        <Route path=":leaseResidentId/edit" element={<ApplicationEditPage />} />
                                        <Route path=":leaseResidentId/reports/:leaseResidentReportId" element={<ApplicationViewReportPage />} />
                                    </Route>

                                    <Route path="bank_accounts" element={<BasePage />}>
                                        <Route path="new" element={<BankAccountEditPage />} />
                                        <Route path=":bankAccountId/edit" element={<BankAccountEditPage />} />
                                    </Route>

                                    <Route path="bulk_charges" element={<BasePage />}>
                                        <Route index element={<BulkChargeListPage />} />
                                        <Route path="list" element={<BulkChargeListPage />} />
                                        <Route path="new" element={<BulkChargeEditPage />} />
                                        <Route path=":bulkChargeId/edit" element={<BulkChargeEditPage />} />
                                        <Route path=":bulkChargeId/edit_leases" element={<BulkChargeLeaseEditPage />} />
                                    </Route>

                                    <Route path="communications">
                                        {currentCompany.subscription_frequency == constants.subscription_frequencies.free.key ?
                                            <>
                                                <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                                <Route path ="*" element={<SubscriptionPricingPage mode="upgrade" />} />
                                            </>
                                            :
                                            <>
                                                <Route index element={<CommunicationsCenterPage />} />
                                                <Route path=":communicationType/:propertyId/:conversationId/:action" element={<CommunicationsCenterPage />} />
                                                <Route path=":communicationType/:propertyId/:conversationId" element={<CommunicationsCenterPage />} />
                                                <Route path=":communicationType/:propertyId" element={<CommunicationsCenterPage />} />
                                                <Route path=":communicationType" element={<CommunicationsCenterPage />} />
                                            </>
                                        }
                                    </Route>

                                    <Route path="financial_connections" element={<FinancialConnectionBasePage />}>
                                        <Route index element={<FinancialConnectionListPage />} />
                                        <Route path="list" element={<FinancialConnectionListPage />} />
                                        <Route path="new" element={<FinancialConnectionListPage />} />
                                        <Route path=":bankAccountId/review" element={<BankTransactionReviewPage />} />
                                        <Route path=":bankAccountId/show_categorized" element={<BankTransactionCategorizedPage />} />
                                        <Route path=":bankAccountId/show_excluded" element={<BankTransactionExcludedPage />} />
                                        <Route path=":bankAccountId/match/:bankTransactionId" element={<BankTransactionMatchPage />} />
                                    </Route>

                                    <Route path="leads" element={<BasePage />}>
                                        <Route index element={<LeadListPage />} />
                                        <Route path="new" element={<ScreeningNewPage mode="leads" />} />
                                        <Route path="new/:propertyId" element={<ScreeningNewPage mode="leads" />} />
                                        <Route path="new/:propertyId/:unitId" element={<ScreeningNewPage mode="leads" />} />
                                        <Route path=":leaseResidentId/edit" element={<ScreeningNewPage mode="leads" />} />
                                    </Route>

                                    <Route path="maintenance_requests">
                                        <Route index element={<MaintenanceRequestListPage />} />
                                        <Route path="new" element={<MaintenanceRequestEditPage />} />
                                        <Route path=":maintenanceRequestId/edit" element={<MaintenanceRequestEditPage />} />
                                    </Route>

                                    <Route path="screenings" element={<BasePage />}>
                                        <Route index element={<ScreeningListPage />} />
                                        <Route path="new/:propertyId/:unitId" element={<ScreeningNewPage />} />
                                        <Route path="new/:propertyId" element={<ScreeningNewPage />} />
                                        <Route path="new" element={<ScreeningNewPage />} />
                                        <Route path="invite_lead/:leaseResidentId" element={<ScreeningNewPage />} />
                                        <Route path="activate" element={<CompanyEditModal mode="screening-activation" />} />
                                    </Route>

                                    <Route path ="property-listings-do-not-share">
                                        <Route index element={<BasePage />}/>
                                        <Route path=":urlStub/:propertyListingId" element={<PropertyListingShowPage inPreviewMode={true} />}/>
                                        <Route path=":propertyListingId" element={<PropertyListingShowPage inPreviewMode={true} />}/>
                                    </Route>

                                    <Route path ="listing-preview-do-not-share">
                                        <Route path=":urlStub/:unitListingId" element={<UnitListingShowPage inPreviewMode={true} />}/>
                                        <Route path=":unitListingId" element={<UnitListingShowPage inPreviewMode={true} />}/>
                                    </Route>

                                    <Route path="subscriptions" element={<BasePage />}>
                                        <Route path="thank_you" element={<SubscriptionThankYouPage />} />
                                    </Route>

                                    <Route path="tax_reporting" element={<TaxReportingBasePage />}>
                                        <Route index element={<TaxReportingListPage />} />
                                        <Route path="list" element={<TaxReportingListPage />} />
                                    </Route>

                                    <Route path="upgrade" element={<BasePage />}>
                                        <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                        <Route path ="units" element={<SubscriptionPricingPage mode="upgrade" message="units" />} />
                                    </Route>

                                    {insightUtils.isCompanyUserAtLeast(currentUser) &&
                                        <>
                                            <Route path="vendors">
                                                <Route index element={<VendorListPage />} />
                                                <Route path="new" element={<VendorEditPage />} />
                                                <Route path=":vendorId/edit" element={<VendorEditPage />} />
                                            </Route>

                                            <Route path="reports">
                                                <Route index element={<BasePage />} />
                                                <Route path=":reportId/run" element={<ReportRunPage />} />
                                            </Route>

                                            <Route path="financials" element={<BasePage />}>
                                                <Route index element={<FinancialSummaryPage />} />
                                                <Route path="charges/new/:propertyId/:leaseId/:isProposed/:hideMonthly" element={<ChargeEditModal />} />
                                                <Route path="charges/new" element={<ChargeEditModal />} />
                                                <Route path="charges/:chargeId/edit" element={<ChargeEditModal />} />
                                                <Route path="payments">
                                                    <Route path="due/:mode" element={<PaymentDuePage />} />
                                                    <Route path="new/:mode/:leaseId/:leaseResidentId" element={<PaymentNewPage />} />
                                                    <Route path="new/:mode/:leaseId" element={<PaymentNewPage />} />
                                                </Route>
                                            </Route>
                                            <Route path="onboarding" element={<BasePage />}>
                                                <Route path="payments">
                                                    <Route index element={<PaymentsOnboardingPage />} />
                                                    <Route path="property_bank_accounts" element={<PaymentsPropertyBankAccountsView />} />
                                                </Route>
                                                <Route path="insurance">
                                                    <Route index element={<InsuranceOnboardingPage />} />
                                                </Route>
                                                <Route path="screening">
                                                    <Route index element={<ScreeningOnboardingPage />} />
                                                </Route>
                                                <Route path="collections">
                                                    <Route index element={<CollectionsOnboardingPage />} />
                                                </Route>
                                                <Route path="lease_docs">
                                                    <Route index element={<LeaseDocsOnboardingPage />} />
                                                    <Route
                                                      index
                                                      element={<LeaseDocsOnboardingPage />}
                                                    />
                                                    <Route
                                                      path=":tab"
                                                      element={<LeaseDocsOnboardingPage />}
                                                    />
                                                    <Route path=":record_type/:id">
                                                      <Route
                                                        path="edit"
                                                        element={<DocumentIframe />}
                                                      />
                                                      {/* <Route
                                                        path="sign"
                                                        element={<DocumentSignature />}
                                                      /> */}
                                                    </Route>
                                                </Route>
                                                <Route path="listings">
                                                    <Route index element={<ListingsOnboardingPage />} />
                                                </Route>
                                                <Route path="financial_connections">
                                                    <Route index element={<FinancialConnectionsOnboardingPage />} />
                                                </Route>
                                                <Route path="tax_reporting">
                                                    <Route index element={<TaxReportingOnboardingPage />} />
                                                </Route>
                                            </Route>
                                            <Route path="settings/:mode" element={<BasePage />}>
                                                <Route index element={<SettingListPage />} />
                                                <Route path=":propertyId" element={<SettingListPage />} />
                                                <Route path=":propertyId/:settingGroupKey/edit/redirectIfMissing" element={<SettingEditPage redirectIfMissing={true} />} />
                                                <Route path=":propertyId/:settingGroupKey/edit" element={<SettingEditPage />} />
                                                <Route path=":settingGroupKey/edit" element={<SettingEditPage />} />
                                            </Route>
                                        </>
                                    }

                                    {insightUtils.isCompanyAdminAtLeast(currentUser) &&
                                    <>
                                        <Route path="dashboard_users" element={<BasePage />}>
                                            {currentCompany.subscription_frequency == constants.subscription_frequencies.free.key ?
                                                <>
                                                    <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                                    <Route path ="*" element={<SubscriptionPricingPage mode="upgrade" />} />
                                                </>
                                            :
                                                <>
                                                    <Route index element={<UserListPage />} />
                                                    <Route path="new" element={<UserEditPage />} />
                                                    <Route path=":userId/edit" element={<UserEditPage />} />
                                                </>
                                            }
                                        </Route>
                                        <Route path="user_roles" element={<BasePage />}>
                                            {currentCompany.subscription_frequency == constants.subscription_frequencies.free.key ?
                                            <>
                                                <Route index element={<SubscriptionPricingPage mode="upgrade" />} />
                                                <Route path ="*" element={<SubscriptionPricingPage mode="upgrade" />} />
                                            </>
                                            :
                                            <>
                                                <Route index element={<UserRoleListPage />} />
                                                <Route path="new" element={<UserRoleEditPage />} />
                                                <Route path=":userRoleId/edit" element={<UserRoleEditPage />} />
                                            </>}
                                        </Route>
                                    </>
                                    }

                                    {insightUtils.isAdmin(currentUser) &&
                                    <>
                                        <Route path="companies" element={<BasePage />}>
                                            <Route index element={<CompanyListPage />} />
                                            <Route path=":companyId/history" element={<HistoryPage mode="company" />} />
                                        </Route>
                                        <Route path="admin_setup" element={<BasePage />}>
                                            <Route path="email_templates">
                                                <Route index element={<EmailTemplateListPage />} />
                                            </Route>
                                            <Route path="consumers">
                                                <Route index element={<ConsumerListPage />} />
                                            </Route>
                                            <Route path="utilities">
                                                <Route index element={<UtilitiesPage />} />
                                            </Route>
                                        </Route>
                                    </>
                                    }

                                    <Route
                                        path="*"
                                        element={
                                            <DashboardLandingRedirector />
                                        }
                                    />
                                </Route>
                            </Routes>
                        }

                        <div className="footer-buffer">
                            <div className="footer-block"></div>
                        </div>
                    </div>
                </>}
            </div></>}

            <AlertMessageModal />
        </>
    )}

export default LandlordDashboard;

