import React from 'react';
import {useNavigate} from 'react-router-dom'
import {Link} from "react-router-dom";
import Modal from "../../shared/Modal";

import insightRoutes from "../../../app/insightRoutes";

const PropertyChooseAdditionMethodModal = ({}) => {
    let navigate = useNavigate();

    function closeModal(newPropertyId, newUnitId) {
        navigate(insightRoutes.propertyList())
    }

    return (
        <>
        <Modal closeModal={closeModal}>
          <h2>Add Property</h2>
            <p className="text-center">Enter individual properties or upload a file with multiple properties?</p>

            <div className="form-nav">
                <Link to={insightRoutes.propertyUpload()} className="btn btn-gray"><span>File Upload</span></Link>
                <Link to={insightRoutes.propertyNew()} className="btn btn-red"><span>Individual</span></Link>
            </div>
        </Modal>
        </>
    )}

export default PropertyChooseAdditionMethodModal;

