import React, {useState} from 'react';
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate, Link} from "react-router-dom";
import {useSelector} from "react-redux";
import CommunicationsCenterMessageEditModal from "../../communications/CommunicationsCenterMessageEditModal";

const ForwardingAddressBlockItem = ({lease, leaseResident}) => {
    const navigate = useNavigate()
    const { currentUser } = useSelector((state) => state.user)

    const [editingCommunicationHashId, setEditingCommunicationHashId] = useState(null)

    return (
        <>

            <div className="flex-line-block flex-line-resident">
                <div className="flex-line flex-resident-edit-info">
                    <i onClick={() => navigate(insightRoutes.residentEdit(lease.hash_id, leaseResident.hash_id))} className="fal fa-edit tooltip tooltip-edit btn-rd-edit-resident"></i>
                    {false && <i className="fal fa-trash-alt tooltip tooltip-remove btn-rd-remove-resident"></i>}
                </div>
                <i className="fas fa-user"></i>
                <div className="flex-line-resident-info">
                    <div className="flex-line flex-resident-name">
                        {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                    </div>
                    {leaseResident.forwarding_street ?
                        <>
                            {leaseResident.forwarding_street}<br/>
                            {leaseResident.forwarding_city}, {leaseResident.forwarding_state} {leaseResident.forwarding_zip}<br/>
                        </>
                        :
                        <>
                            <em>None given</em>
                        </>
                    }
                </div>
            </div>
            {editingCommunicationHashId && <CommunicationsCenterMessageEditModal editingCommunicationHashId={editingCommunicationHashId} setEditingCommunicationHashId={setEditingCommunicationHashId} leaseResidents={[leaseResident]} />}
        </>
    )}

export default ForwardingAddressBlockItem;

