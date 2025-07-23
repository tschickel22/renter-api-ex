import React, {useEffect, useState} from 'react';
import DashboardTile from "../DashboardTile";
import {Form, Formik} from "formik";
import BasicDropdown from "../../../shared/BasicDropdown";
import insightRoutes from "../../../../app/insightRoutes";
import {NavLink, useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";

const DashboardQuickAccess = ({dashboardData}) => {
    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [jumpToOptions, setJumpToOptions] = useState(null)

    useEffect(() => {
            if (currentUser) {
                let newJumpToOptions = []

                if (currentUser.leasing_edit) newJumpToOptions.push({id: insightRoutes.screeningNew(), name: "Create Application"})
                if (currentUser.payments_edit) newJumpToOptions.push({id: insightRoutes.financialPaymentDueManual(), name: "Apply Payments"})
                if (currentUser.residents_edit) newJumpToOptions.push({id: insightRoutes.financialChargeNew(), name: "Create Resident Charge"})
                if (currentUser.accounting_edit) newJumpToOptions.push({id: insightRoutes.bulkChargeNew(), name: "Create Bulk Charges"})
                if (currentUser.leasing_edit) newJumpToOptions.push({id: insightRoutes.leadNew(), name: "Create Lead"})
                if (currentUser.listings_edit) newJumpToOptions.push({id: insightRoutes.propertyListingNew(), name: "Add Listing"})
                if (currentUser.maintenance_requests_edit) newJumpToOptions.push({id: insightRoutes.maintenanceRequestNew(), name: "Add Maintenance Ticket"})
                if (currentUser.properties_edit) newJumpToOptions.push({id: insightRoutes.propertyNew(), name: "Add New Property"})
                if (currentUser.users_edit) newJumpToOptions.push({id: insightRoutes.userNew(), name: "Add New User"})
                if (currentUser.accounting_view) newJumpToOptions.push({id: insightRoutes.accountReconciliationList(), name: "Reconcile Accounts"})

                setJumpToOptions(newJumpToOptions)
            }
        }, [currentUser])

    function handleJumpTo(e) {
        navigate(e.target.value)
    }

    return (
        <>
            {jumpToOptions && jumpToOptions.length > 0 && <Formik initialValues={{jump_to: ""}}>
                {({  }) => (
                    <Form>
                        <div className="st-nav">
                            <div className="form-item flex-row flex-nowrap">
                                <div><label style={{lineHeight: "2rem"}}>Quick Access: </label></div>
                                <div><BasicDropdown name="status" options={jumpToOptions} onChange={(e) => handleJumpTo(e)} extraClass="form-select-wide" /></div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>}
        </>

    )}

export default DashboardQuickAccess;

