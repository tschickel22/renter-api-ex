import React, {useState} from 'react';
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate, Link} from "react-router-dom";
import {useSelector} from "react-redux";
import CommunicationsCenterMessageEditModal from "../../communications/CommunicationsCenterMessageEditModal";
import insightUtils from "../../../../app/insightUtils";

const ResidentBlockItem = ({lease, leaseResident}) => {
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
                    {currentUser.communications_edit && leaseResident.resident.email && <a onClick={() => setEditingCommunicationHashId("new_email:" + leaseResident.hash_id)} className="flex-line flex-btn btn-resident-email"><i className="fal fa-envelope"></i> Email {leaseResident.resident.first_name}</a>}
                    {leaseResident.resident.phone_number && <div className="flex-line flex-btn btn-resident-call"><i className="fal fa-phone"></i> Call {leaseResident.resident.phone_number}</div>}
                    <div className="flex-line"><a href={insightRoutes.applicationPrint(leaseResident.hash_id)} className="text-gray" target="_blank"><i className="fal fa-eye"></i> View Application</a></div>
                    {insightUtils.isAdmin(currentUser) && leaseResident.resident.user_id && <div className="flex-line"><a href={"/admin/users/" + leaseResident.resident.user_id + "/proxy"} style={{fontWeight: "bold"}}>Proxy as {leaseResident.resident.first_name}</a></div>}
                </div>
            </div>
            {editingCommunicationHashId && <CommunicationsCenterMessageEditModal editingCommunicationHashId={editingCommunicationHashId} setEditingCommunicationHashId={setEditingCommunicationHashId} leaseResidents={[leaseResident]} />}
        </>
    )}

export default ResidentBlockItem;

