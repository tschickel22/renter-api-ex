import React from 'react';
import {useNavigate} from 'react-router-dom'
import {Link} from "react-router-dom";
import Modal from "../../shared/Modal";

import insightRoutes from "../../../app/insightRoutes";

const ResidentChooseAdditionMethodModal = ({}) => {
    let navigate = useNavigate();

    function closeModal() {
        navigate(insightRoutes.residentList())
    }

    return (
        <>
        <Modal closeModal={closeModal}>
          <h2>Add Existing Resident</h2>
            <p className="text-center">Enter individual residents or upload a file with multiple residents?</p>

            <div className="form-nav">
                <Link to={insightRoutes.residentUpload()} className="btn btn-gray"><span>File Upload</span></Link>
                <Link to={insightRoutes.residentNew()} className="btn btn-red"><span>Individual</span></Link>
            </div>
        </Modal>
        </>
    )}

export default ResidentChooseAdditionMethodModal;

