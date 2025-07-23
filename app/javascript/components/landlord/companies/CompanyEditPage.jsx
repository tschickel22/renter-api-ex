import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom'

import Modal from "../../shared/Modal";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import CompanyEditForm from "./CompanyEditForm";
import insightUtils from "../../../app/insightUtils";

const CompanyEditPage = ({}) => {
    const navigate = useNavigate();
    const location = useLocation()

    const { currentCompany } = useSelector((state) => state.company)

    function closeView() {
        insightUtils.handleBackNavigation(insightRoutes.dashboard(), location, navigate)
    }

    return (
        <>
        {currentCompany &&
            <CompanyEditForm closeModal={closeView} />
        }
        </>
    )}

export default CompanyEditPage;

