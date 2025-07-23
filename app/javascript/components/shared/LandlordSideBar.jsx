import React, {useEffect, useState} from 'react';
import {Link, NavLink, useLocation} from "react-router-dom";
import store from "../../app/store";
import {signOutUser} from "../../slices/userSlice";
import {useSelector} from "react-redux";
import insightRoutes from "../../app/insightRoutes";
import insightUtils from "../../app/insightUtils";


const LandlordSideBar = ({}) => {

    const location = useLocation();
    const { currentUser, currentActualUser } = useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)
    const { isMobileDevice, offerInsurance } = useSelector((state) => state.dashboard)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(null)

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location])

    function handleSignOut() {
        store.dispatch(signOutUser())
    }

    return (
        <div className={"sidenav" + (mobileMenuOpen ? " mobile-nav-active" : "")}>
            <div className="logo-block">
                <Link to="/" className="logo"><img src="/images/logo-ri.svg" alt="Renter Insight" /></Link>
                <div onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={"mobile-nav-btn" + (mobileMenuOpen ? " nav-btn-active" : "")}><i className="fal fa-bars"></i></div>
            </div>

            <div className="menu-block">
                <nav className="menu">
                    <div className="nav-top">
                        {currentUser && currentCompany && <>
                            {!insightUtils.isAdmin(currentUser) && insightUtils.isCompanyUserAtLeast(currentUser) && <>

                                <NavLink to={insightRoutes.dashboard()} className="nav-item"><i className="fal fa-house"></i><span>Home</span></NavLink>

                                {(currentUser.properties_view || currentUser.residents_view || currentUser.property_owners_view) && <div className="nav-dropdown-wrapper">
                                    <NavLink to={insightRoutes.propertyList()} className="nav-item"><i className="fal fa-building"></i><span>Properties</span></NavLink>

                                    <div className="nav-dropdown">
                                        {currentUser.properties_view && <NavLink to={insightRoutes.propertyList()} className="nav-item"><span>Properties</span></NavLink>}
                                        {currentUser.properties_view && <NavLink to={insightRoutes.unitList()} className="nav-item"><span>Units</span></NavLink>}
                                        {currentUser.residents_view && <NavLink to={insightRoutes.residentList()} className="nav-item"><span>Residents</span></NavLink>}
                                        {currentUser.property_owners_view && <NavLink to={insightRoutes.propertyOwnerList()} className="nav-item"><span>Property Owners</span></NavLink>}
                                    </div>
                                </div>}

                                {(currentUser.leasing_view || currentUser.listings_view || currentUser.screening_view) &&
                                    <div className="nav-dropdown-wrapper">
                                        <NavLink to={insightRoutes.leadList()} className="nav-item"><i className="fal fa-list-alt"></i><span>Leasing</span></NavLink>
                                        <div className="nav-dropdown">
                                            {currentUser.listings_view && <NavLink to={currentCompany.listings_onboard_status == constants.payment_onboarding_statuses.completed.key ? insightRoutes.propertyListingList() : insightRoutes.onboardingListings()} className="nav-item"><span>Listings</span></NavLink>}
                                            {currentUser.leasing_view && <NavLink to={insightRoutes.leadList()} className="nav-item"><span>Leads</span></NavLink>}
                                            {currentUser.leasing_view && <NavLink to={insightRoutes.applicationList()} className="nav-item"><span>Applications</span></NavLink>}
                                            {currentUser.screening_view && <NavLink to={currentCompany.external_screening_id ? insightRoutes.screeningList() : insightRoutes.onboardingScreening()} className="nav-item"><span>Screening</span></NavLink>}
                                        </div>
                                    </div>
                                }

                                {currentUser.lease_docs_view && <NavLink to={insightRoutes.onboardingLeaseDocs()} className="nav-item"><i className="fal fa-files"></i><span>Documents</span></NavLink>}

                                {(currentUser.accounting_view || currentUser.expenses_view || currentUser.reports_view || currentUser.payments_view) && <div className="nav-dropdown-wrapper">
                                    <NavLink to={currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key ? insightRoutes.financialSummary() : insightRoutes.onboardingPayments()} className="nav-item"><i className="fal fa-usd-circle"></i><span>Accounting</span></NavLink>
                                    <div className="nav-dropdown">
                                        {currentUser.accounting_view && <div className="nav-dropdown-wrapper">
                                            <NavLink to={insightRoutes.accountList()} className="nav-item"><span>Accounting</span></NavLink>
                                            <div className="nav-dropdown">
                                                <NavLink to={insightRoutes.accountReconciliationList()} className="nav-item"><span>Reconcile Accounts</span></NavLink>
                                                <NavLink to={insightRoutes.accountList()} className="nav-item"><span>Chart of Accounts</span></NavLink>
                                                <NavLink to={insightRoutes.financialSummary()}><span>Financial Summary</span></NavLink>
                                                {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key && <NavLink to={insightRoutes.propertyBankAccountList()}><span>Property Bank Accounts</span></NavLink>}
                                                <NavLink to={insightRoutes.financialConnectionList()}><span>Bank Transactions</span></NavLink>
                                                <NavLink to={insightRoutes.taxReportingList()}><span>1099 Reporting</span></NavLink>
                                            </div>
                                        </div>}

                                        {currentUser.payments_view && <>
                                            {currentCompany.payments_onboard_status == constants.payment_onboarding_statuses.completed.key ?
                                                <div className="nav-dropdown-wrapper">
                                                    <NavLink to={insightRoutes.financialPaymentDueManual()} className="nav-item"><span>Resident Payments</span></NavLink>
                                                    <div className="nav-dropdown">
                                                        <NavLink to={insightRoutes.financialPaymentDueManual()}><span>Apply Payments</span></NavLink>
                                                        <NavLink to={insightRoutes.financialPaymentDueAuto()}><span>Make Payment for Resident</span></NavLink>
                                                        <NavLink to={insightRoutes.reportRun('manual_payments')}><span>View Applied Payments</span></NavLink>
                                                    </div>
                                                </div>
                                                :
                                                <NavLink to={insightRoutes.onboardingPayments()} className="nav-item"><span>Payments</span></NavLink>
                                            }
                                        </>}

                                        {currentUser.expenses_view && <div className="nav-dropdown-wrapper">
                                            <NavLink to={insightRoutes.billList()} className="nav-item"><span>Billing & Expenses</span></NavLink>
                                            <div className="nav-dropdown">
                                                <NavLink to={insightRoutes.billList()} className="nav-item"><span>Bills</span></NavLink>
                                                <NavLink to={insightRoutes.expenseList()} className="nav-item"><span>Expenses</span></NavLink>
                                                <NavLink to={insightRoutes.billNew()} className="nav-item"><span>Record Bill</span></NavLink>
                                                <NavLink to={insightRoutes.billPayment()} className="nav-item"><span>Record Payment</span></NavLink>
                                            </div>
                                        </div>}

                                        {currentUser.accounting_view && <NavLink to={insightRoutes.journalEntryList()} className="nav-item"><span>Journal Entries</span></NavLink>}

                                        {offerInsurance && <NavLink to={insightRoutes.onboardingInsurance()} className="nav-item"><span>Insurance</span></NavLink>}
                                        {false && <NavLink to={insightRoutes.onboardingCollections()} className="nav-item"><span>Collections</span></NavLink>}

                                        {currentUser.reports_view && <div className="nav-dropdown-wrapper">
                                            <NavLink to={insightRoutes.reportRun('aging')} className="nav-item"><span>Reports</span></NavLink>
                                            <div className="nav-dropdown">
                                                {Object.keys(insightUtils.reportList()).map((reportId) => (<NavLink key={reportId} to={insightRoutes.reportRun(reportId)}><span>{insightUtils.reportList()[reportId]}</span></NavLink>))}
                                                <NavLink to={insightRoutes.companyHistory("my")}><span>Company History</span></NavLink>
                                            </div>
                                        </div>}


                                    </div>
                                </div>}

                                {currentUser.maintenance_requests_view && <NavLink to={insightRoutes.maintenanceRequestList()} className="nav-item"><i className="fal fa-tools"></i><span>Maintenance</span></NavLink>}
                                {currentUser.communications_view && <div className="nav-dropdown-wrapper">
                                    <NavLink to={insightRoutes.communicationCenter(currentUser)} className="nav-item"><i className="fal fa-comments"></i><span>Communication</span></NavLink>
                                    <div className="nav-dropdown">
                                        <NavLink to={insightRoutes.communicationCenter(currentUser)}><span>Communication Center</span></NavLink>
                                        <NavLink to={insightRoutes.announcementList()}><span>Announcements</span></NavLink>
                                    </div>
                                </div>}

                                {currentUser.vendors_view && <NavLink to={insightRoutes.vendorList()} className="nav-item"><i className="fal fa-toolbox"></i><span>Vendors</span></NavLink>}

                                {currentUser.settings_view && <NavLink to={insightRoutes.settingList('company')} className="nav-item"><i className="fal fa-cog"></i><span>Settings</span></NavLink>}

                                <a href="https://blog.renterinsight.com/marketplace" target="_blank" className="nav-item"><i className="fal fa-store-alt"></i><span>Marketplace</span></a>
                            </>}
                            {insightUtils.isAdmin(currentUser) &&
                                <>
                                    <NavLink to={insightRoutes.companyList()} className="nav-item"><i className="fal fa-building"></i><span>Companies</span></NavLink>
                                    <NavLink to={insightRoutes.adminConsumerList()} className="nav-item"><i className="fal fa-users"></i><span>Residents</span></NavLink>
                                    <NavLink to={insightRoutes.settingList('system')} className="nav-item"><i className="fal fa-cog"></i><span>Settings</span></NavLink>
                                    <NavLink to={insightRoutes.adminEmailTemplateList()} className="nav-item"><i className="fal fa-envelopes"></i><span>Email Templates</span></NavLink>
                                    <div className="nav-dropdown-wrapper">
                                        <NavLink to={insightRoutes.reportRun('company_breakdown')} className="nav-item"><i className="fal fa-file-chart-pie"></i><span>Reports</span></NavLink>
                                        <div className="nav-dropdown">
                                            <NavLink to={insightRoutes.reportRun('company_breakdown')}><span>Internal Report for Tom</span></NavLink>
                                        </div>
                                    </div>
                                    <NavLink to={insightRoutes.adminUtilities()} className="nav-item"><i className="fal fa-cogs"></i><span>Utilities</span></NavLink>
                                </>
                            }
                            {isMobileDevice && <>
                                {currentUser.settings_edit && <Link to={insightRoutes.companyEdit("my")} state={{return_url: location.pathname + (window.location.search || '')}} className="nav-item"><i className="fal fa-cog"></i><span>Manage Account</span></Link>}
                                {currentUser.settings_edit && <a href={constants.env.zoho_sso_url} target="_blank" className="nav-item"><i className="fal fa-cog"></i><span>Billing & Subscriptions</span></a>}
                            </>}
                            {insightUtils.isCompanyAdminAtLeast(currentUser) && currentUser.users_view && <>
                                <div className="nav-dropdown-wrapper">
                                    <NavLink to={insightRoutes.userList()} className="nav-item"><i className="fal fa-users"></i><span>Users</span></NavLink>

                                    <div className="nav-dropdown">
                                        <NavLink to={insightRoutes.userList()}><span>Users</span></NavLink>
                                        <NavLink to={insightRoutes.userRoleList()}><span>Roles</span></NavLink>
                                    </div>
                                </div>

                            </>
                            }
                            <a href="https://helpcenter.renterinsight.com/portal/en/home" target="_blank" className="nav-item"><i className="fal fa-lightbulb"></i><span>Knowledge Center</span></a>
                            {isMobileDevice && <>
                                {insightUtils.isAdmin(currentActualUser) && currentActualUser.id != currentUser.id ?
                                    <a href={"/admin/users/" + currentActualUser.id + "/proxy"} className="nav-item"><i className="fal fa-sign-out" role="presentation"></i><span>Proxy Out</span></a>
                                    :
                                    <a onClick={handleSignOut} className="nav-item"><i className="fal fa-sign-out" role="presentation"></i><span>Log Out</span></a>
                                }
                            </>}
                        </>}

                        {!currentUser &&
                            <Link to="/users/new" className="btn-create-account"><i className="fal fa-user-plus"></i><span>Create Account</span></Link>
                        }
                    </div>
                    <div className="nav-bottom">
                        <a className="nav-item btn-help-terms" href="https://www.renterinsight.com/termsofuse" target="_blank"><i className="fal fa-question-circle"></i><span>Terms</span></a>
                    </div>
                </nav>
            </div>
        </div>
    )}

export default LandlordSideBar;

