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
import * as constants from "constants";

const LeaseApplicationInvitedPage = ({baseLease, baseLeaseResident, setCurrentStep}) => {
    const { constants } = useSelector((state) => state.company)
    let navigate = useNavigate()

    return (
        <>
            <p>This application is now in the hands of the applicant.  They are currently at this step: <strong>{baseLeaseResident && insightUtils.getLabel(baseLeaseResident.current_step, constants.lease_resident_steps)}</strong>.</p>
            <br/><br/><br/>
            <a className="btn btn-gray" onClick={() => navigate(insightRoutes.leaseShow(baseLease.hash_id))}>Close</a>
            {" "}
            <a className="btn btn-red" onClick={() => setCurrentStep(constants.lease_resident_steps.occupant_details.key)}>Edit Application</a>
        </>

    )}

export default LeaseApplicationInvitedPage;

