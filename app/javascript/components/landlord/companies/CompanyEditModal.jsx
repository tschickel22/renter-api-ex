import React from 'react';
import {useNavigate} from 'react-router-dom'

import Modal from "../../shared/Modal";
import {useSelector} from "react-redux";
import insightRoutes from "../../../app/insightRoutes";
import CompanyEditForm from "./CompanyEditForm";

const CompanyEditModal = ({mode, closeModal}) => {

    const { currentCompany } = useSelector((state) => state.company)
    let navigate = useNavigate();

    function closeModal() {
        if (mode == "screening-activation") {
            document.location.href = insightRoutes.screeningList()
        }
    }

    return (
        <>
        {currentCompany &&
        <Modal closeModal={closeModal}>
            <CompanyEditForm mode={mode} closeModal={closeModal} />
        </Modal>
        }
        </>
    )}

export default CompanyEditModal;

