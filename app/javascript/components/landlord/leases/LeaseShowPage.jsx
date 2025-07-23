import React, {useEffect, useState} from 'react';
import {client} from "../../../app/client";
import {useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import LeaseNav from "./LeaseNav";
import VehiclesBlock from "./blocks/VehiclesBlock";
import PetsBlock from "./blocks/PetsBlock";
import ResidentsBlock from "./blocks/ResidentsBlock";
import InsuranceAutoPayBlock from "./blocks/InsuranceAutoPayBlock";
import LeaseSummaryBlock from "./blocks/LeaseSummaryBlock";
import BillingBlock from "./blocks/BillingBlock";
import StatusBlock from "./blocks/StatusBlock";
import PoliciesBlock from "./blocks/PoliciesBlock";
import insightUtils from "../../../app/insightUtils";
import ApplicationBlock from "./blocks/ApplicationBlock";
import ScreeningBlock from "./blocks/ScreeningBlock";
import LeaseDocumentsBlock from "./blocks/LeaseDocumentsBlock";
import MoveInBlock from "./blocks/MoveInBlock";
import LeadBlock from "./blocks/LeadBlock";
import store from "../../../app/store";
import {loadLease} from "../../../slices/leaseSlice";
import LeadDesiredUnitBlock from "./blocks/LeadDesiredUnitBlock";
import ForwardingAddressBlock from "./blocks/ForwardingAddressBlock";
import MoveOutBlock from "./blocks/MoveOutBlock";
import ReapplicationBlock from "./blocks/ReapplicationBlock";

const LeaseShowPage = ({}) => {
    let params = useParams();
    const { constants } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)
    const [lease, setLease] = useState(null)
    const [baseErrors, setBaseErrors] = useState(null)

    useEffect(async() => {

        /*
           Load Lease
         */
        if (currentUser) {
            const results = await store.dispatch(loadLease({leaseId: params.leaseId})).unwrap()
            const response = results.data

            if (response.success) {
                setLease(response.lease)
            }
            else {
                setBaseErrors("Unable to edit lease. Please try again.")
            }
        }

    }, [currentUser, params?.leaseId]);


    return (
        <>

            <div className="section">
                {baseErrors && <div className="text-error">{baseErrors}</div>}

                {lease && <>
                    <StatusBlock lease={lease} title="Resident Detail" />
                    <LeaseNav lease={lease} />

                    {insightUtils.isAdmin(currentUser) && <a href={"/admin/users/" + lease.company_id + "/proxy_as_company_admin?return_url=" + encodeURIComponent(document.location.href)} class="btn btn-red">Proxy as Company Admin</a>}

                    <div className="flex-grid flex-grid-gray flex-grid-three-col">

                        {[constants.lease_statuses.lead.key].indexOf(lease.status) >= 0 && <>
                            <ResidentsBlock lease={lease} />
                            <LeadBlock lease={lease} />
                            <LeadDesiredUnitBlock lease={lease} />
                        </>}

                        {[constants.lease_statuses.applicant.key, constants.lease_statuses.approved.key].indexOf(lease.status) >= 0 && <>
                            <ResidentsBlock lease={lease} />
                            <ApplicationBlock lease={lease} setLease={setLease} />
                            <ScreeningBlock lease={lease} />
                            <LeaseSummaryBlock lease={lease} />
                            <LeaseDocumentsBlock lease={lease} />
                            <MoveInBlock lease={lease} setLease={setLease} />
                        </>}

                        {[constants.lease_statuses.renewing.key, constants.lease_statuses.future.key, constants.lease_statuses.current.key].indexOf(lease.status) >= 0 && <>
                            <BillingBlock lease={lease} />
                            <LeaseSummaryBlock lease={lease} />
                            <LeaseDocumentsBlock lease={lease} />
                            <InsuranceAutoPayBlock lease={lease} />
                            <ResidentsBlock lease={lease} />
                            <PetsBlock lease={lease} />
                            <VehiclesBlock lease={lease} />
                        </>}

                        {[constants.lease_statuses.former.key].indexOf(lease.status) >= 0 && <>
                            <ResidentsBlock lease={lease} />
                            <ReapplicationBlock lease={lease} setLease={setLease} />
                            <ForwardingAddressBlock lease={lease} />
                            <LeaseSummaryBlock lease={lease} />
                            <LeaseDocumentsBlock lease={lease} />
                            <MoveOutBlock lease={lease} />
                        </>}


                        {false && <PoliciesBlock lease={lease} />}

                    </div>

                </>}

            </div>

        </>

    )}

export default LeaseShowPage;

