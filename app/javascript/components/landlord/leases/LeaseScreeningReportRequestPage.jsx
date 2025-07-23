import React, {useEffect, useState} from 'react';

import {useSelector} from "react-redux";
import {Link, useNavigate, useParams} from "react-router-dom";

import insightRoutes from "../../../app/insightRoutes";
import {client} from "../../../app/client";

import {ErrorMessage, Field, FieldArray, Form, Formik} from "formik";
import ResidentFormRow from "./ResidentFormRow";
import ResidentPetsForm from "./ResidentPetsForm";
import ResidentResidenceHistoryForm from "./ResidentResidenceHistoryForm";
import ResidentEmploymentHistoryForm from "./ResidentEmploymentHistoryForm";
import ResidentIncomeForm from "./ResidentIncomeForm";
import ResidentContactEmergencyForm from "./ResidentContactEmergencyForm";
import ResidentContactReferenceForm from "./ResidentContactReferenceForm";
import ResidentVehiclesForm from "./ResidentVehiclesForm";
import ResidentIdentificationForm from "./ResidentIdentificationForm";
import FormItem from "../../shared/FormItem";
import insightUtils from "../../../app/insightUtils";
import store from "../../../app/store";
import {checkValidationAnswers, loadValidationQuestions, requestLeaseResidentReports, saveLeaseResident} from "../../../slices/leaseResidentSlice";
import BasicDropdown from "../../shared/BasicDropdown";
import RadioButtonGroup from "../../shared/RadioButtonGroup";

const LeaseScreeningReportRequestPage = ({baseLease, baseLeaseResident, setBaseLeaseResident}) => {


    const [lease, setLease] = useState(null)
    const [leaseResident, setLeaseResident] = useState(null)

    useEffect(() => {
        insightUtils.scrollTo('top')
    }, []);

    useEffect(() => {

        if (baseLease && baseLeaseResident) {
            populateLease(baseLease, baseLeaseResident)
            ensureReportsLoaded(baseLeaseResident)
        }

    }, [baseLease, baseLeaseResident]);

    function populateLease(l, lr) {
        setLease(Object.assign({}, l))
        setLeaseResident(Object.assign({}, lr))
    }

    async function ensureReportsLoaded(baseLeaseResident) {
        const results = await store.dispatch(requestLeaseResidentReports({leaseResidentId: baseLeaseResident.hash_id})).unwrap()
        console.log("ensureReportsLoaded", results)

        setBaseLeaseResident(results.data.lease_resident)

    }

    return (
        <>
            {lease && leaseResident && <>

                <div className="section-table-wrap">
                    <div className="add-property-wrap">

                        <h2>Loading Reports</h2>

                        <p>Loading screening reports...</p>
                    </div>
                </div>
            </>
            }
        </>

    )}

export default LeaseScreeningReportRequestPage;

