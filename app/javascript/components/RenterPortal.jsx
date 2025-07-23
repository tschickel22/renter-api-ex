import React from 'react';
import {Routes, Route} from "react-router-dom";

import TopBar from "./shared/TopBar";
import {useSelector} from "react-redux";
import insightRoutes from "../app/insightRoutes";
import ResidentSideBar from "./shared/ResidentSideBar";
import ResidentSignInPage from "./landlord/users/ResidentSignInPage";
import ResidentSignUp from "./landlord/users/ResidentSignUp";
import BasePage from "./landlord/companies/BasePage";
import ApplicationEditPage from "./landlord/leases/ApplicationEditPage";
import AlertMessageModal from "./shared/AlertMessageModal";
import ApplicantLandingPage from "./renter/ApplicantLandingPage";
import RenterProfileEditModal from "./renter/RenterProfileEditModal";
import RenterLeaseShowPage from "./renter/RenterLeaseShowPage";
import RenterPaymentPage from "./renter/RenterPaymentPage";
import RenterLedgerPage from "./renter/RenterLedgerPage";
import RenterLedgerDetailPage from "./renter/RenterLedgerDetailPage";
import RenterMaintenanceRequestListPage from "./renter/maintenanceRequests/RenterMaintenanceRequestListPage";
import RenterMaintenanceRequestEditPage from "./renter/maintenanceRequests/RenterMaintenanceRequestEditPage";
import CommunicationsCenterPage from "./landlord/communications/CommunicationsCenterPage";
import RenterPaymentSchedulePage from "./renter/RenterPaymentSchedulePage";
import ForgotPasswordPage from "./landlord/users/ForgotPasswordPage";
import RenterMoveOutOrRenewPage from "./renter/RenterMoveOutOrRenewPage";
import UnitListingWrapper from "./renter/listings/UnitListingWrapper";
import RenterInsuranceStartPage from "./renter/insurance/RenterInsuranceStartPage";
import RenterInsuranceEditPage from "./renter/insurance/RenterInsuranceEditPage";
import RenterInsuranceShowPage from "./renter/insurance/RenterInsuranceShowPage";
import RenterInsuranceConfirmationPage from "./renter/insurance/RenterInsuranceConfirmationPage";
import UnitListingShowPage from "./renter/listings/UnitListingShowPage";
import PropertyListingWrapper from "./renter/listings/PropertyListingWrapper";
import RenterPaymentMethodListPage from "./renter/paymentMethods/RenterPaymentMethodListPage";
import RenterPaymentMethodEditPage from "./renter/paymentMethods/RenterPaymentMethodEditPage";
import AnnouncementShowPage from "./landlord/communications/AnnouncementShowPage";
import CreditReportingActivityListPage from "./renter/creditReporting/CreditReportingActivityListPage";
import CreditReportingOnboardingPage from "./renter/creditReporting/CreditReportingOnboardingPage";
import CreditReportingPricingPage from "./renter/creditReporting/CreditReportingPricingPage";
import CreditReportingThankYouPage from "./renter/creditReporting/CreditReportingThankYouPage";
// import DocumentSignature from './landlord/onboarding/lease_docs/DocumentSignature';
import DocumentsListPage from './renter/DocumentsListPage';
import InvoiceListPage from "./renter/invoices/InvoiceListPage";
import InvoiceShowPage from "./renter/invoices/InvoiceShowPage";

const RenterPortal = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    return (
        <>
            <div className="landscape-warning"><img src="/images/logo-ri.svg" alt="Renter Insight" /><div>Renter Insight is best used in portrait mode. Please rotate your phone.</div></div>
            <div className="main-wrapper">
                {!currentUser && <>
                    <Routes>
                        <Route path="/portal">
                            <Route index element={<ResidentSignInPage />}/>
                            <Route path={insightRoutes.residentSignUp() + "/:leaseResidentId"} element={<ResidentSignUp />} />
                            <Route path="forgot_password"  element={<ForgotPasswordPage />}/>
                            <Route path="*"  element={<ResidentSignInPage />}/>
                        </Route>
                        <Route path ="/available-to-rent">
                            <Route index element={<ResidentSignInPage />}/>
                            <Route path=":urlStub/:unitListingId" element={<UnitListingWrapper />}/>
                            <Route path=":unitListingId" element={<UnitListingWrapper />}/>
                        </Route>
                        <Route path ="/property-listings">
                            <Route index element={<ResidentSignInPage />}/>
                            <Route path=":urlStub/:propertyListingId" element={<PropertyListingWrapper />}/>
                            <Route path=":propertyListingId" element={<PropertyListingWrapper />}/>
                        </Route>
                    </Routes>
                </>}
                {currentUser && <>
                    <ResidentSideBar />
                    <TopBar />

                    <div className="main-container resident-portal">
                        <Routes>
                            <Route path ="/available-to-rent">
                                <Route index element={<ApplicantLandingPage />}/>
                                <Route path=":urlStub/:unitListingId" element={<UnitListingShowPage />}/>
                                <Route path=":unitListingId" element={<UnitListingShowPage />}/>
                            </Route>
                            <Route path="/portal">
                                <Route index element={<ApplicantLandingPage />} />
                                <Route path="applications" element={<BasePage />}>
                                    <Route path=":leaseResidentId/edit" element={<ApplicationEditPage />} />
                                </Route>
                                <Route path="leases" element={<BasePage />}>
                                    <Route path=":leaseId">
                                        <Route index element={<RenterLeaseShowPage />} />
                                        <Route path="move_out_renew" element={<RenterMoveOutOrRenewPage />} />
                                        <Route path="payments" element={<BasePage />}>
                                            <Route path=":leaseResidentId/one_time" element={<RenterPaymentPage paymentAction="one_time" />} />
                                            <Route path=":leaseResidentId/recurring" element={<RenterPaymentPage paymentAction="recurring" />} />
                                            <Route path=":leaseResidentId/schedule" element={<RenterPaymentSchedulePage />} />
                                        </Route>
                                        <Route path="ledger" element={<RenterLedgerPage />}>
                                            <Route path=":ledgerItemId" element={<RenterLedgerDetailPage />} />
                                        </Route>
                                        <Route path="payment_methods">
                                            <Route index element={<RenterPaymentMethodListPage />} />
                                            <Route path="new" element={<RenterPaymentMethodEditPage />} />
                                            <Route path=":paymentMethodId/edit" element={<RenterPaymentMethodEditPage />} />
                                        </Route>
                                        <Route path="invoices" element={<BasePage />}>
                                            <Route index element={<InvoiceListPage />} />
                                            <Route path="list" element={<InvoiceListPage />} />
                                            <Route path=":invoiceId" element={<InvoiceShowPage />} />
                                        </Route>
                                        <Route path="documents">
                                            <Route index element={<DocumentsListPage />} />
                                        </Route>
                                    </Route>
                                </Route>

                                <Route path="announcements">
                                    <Route index element={<ApplicantLandingPage />} />
                                    <Route path=":announcementId" element={<AnnouncementShowPage />} />
                                </Route>

                                <Route path="maintenance_requests">
                                    <Route index element={<RenterMaintenanceRequestListPage />} />
                                    <Route path="new" element={<RenterMaintenanceRequestEditPage />} />
                                    <Route path=":maintenanceRequestId/edit" element={<RenterMaintenanceRequestEditPage />} />
                                </Route>

                                <Route path="insurance">
                                    <Route path="confirmation" element={<RenterInsuranceConfirmationPage />} />
                                    <Route path=":leaseId/start" element={<RenterInsuranceStartPage />} />
                                    <Route path=":leaseId/edit/:apiPartnerId" element={<RenterInsuranceEditPage />} />
                                    <Route path=":leaseId" element={<RenterInsuranceShowPage />} />
                                </Route>

                                <Route path="communications">
                                    <Route index element={<CommunicationsCenterPage />} />
                                    <Route path=":communicationType/:conversationId" element={<CommunicationsCenterPage />} />
                                    <Route path=":communicationType" element={<CommunicationsCenterPage />} />
                                </Route>

                                <Route path="credit_reporting" element={<BasePage />}>
                                    <Route path="onboarding" element={<CreditReportingOnboardingPage/>}/>
                                    <Route path="activate" element={<CreditReportingPricingPage/>}/>
                                    <Route path="activities" element={<CreditReportingActivityListPage/>}/>
                                    <Route path="thank_you" element={<CreditReportingThankYouPage/>}/>
                                </Route>

                                <Route path="profile" element={<BasePage />}>
                                    <Route index element={
                                        <main style={{ padding: "1rem" }}>
                                            <p>There's nothing here!</p>
                                        </main>
                                    } />
                                    <Route path="edit" element={<RenterProfileEditModal />} />
                                </Route>
                                <Route
                                    path="*"
                                    element={
                                        <main style={{ padding: "1rem" }}>
                                            <p>There's nothing here!</p>
                                        </main>
                                    }
                                />
                            </Route>
                        </Routes>

                        <div className="footer-buffer">
                            <div className="footer-block"></div>
                        </div>
                    </div>
                </>}
            </div>

            <AlertMessageModal />
        </>
    )}

export default RenterPortal;

