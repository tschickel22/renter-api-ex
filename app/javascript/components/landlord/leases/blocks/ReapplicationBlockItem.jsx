import React from 'react';
import insightUtils from "../../../../app/insightUtils";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../../app/insightRoutes";

const ReapplicationBlockItem = ({leaseResident,  inSelectionMode, selectedResidents, setSelectedResidents}) => {

    function toggleSelection() {
        let newSelectedResidents = Array.from(selectedResidents)

        if (newSelectedResidents.indexOf(leaseResident.resident_id) < 0) {
            newSelectedResidents.push(leaseResident.resident_id)
        }
        else {
            newSelectedResidents.splice(newSelectedResidents.indexOf(leaseResident.resident_id), 1)
        }

        setSelectedResidents(newSelectedResidents)
    }

    return (
        <div className="flex-line-block flex-line-resident">
            <div className="flex-line">
                {inSelectionMode && <>
                    <div onClick={() => toggleSelection()} className={"input-radio " + (selectedResidents.indexOf(leaseResident.resident_id) >= 0 ? "active" : "")}><i className={(selectedResidents.indexOf(leaseResident.resident_id) >= 0 ? "fa-square input-radio-btn fas" : "fal fa-square input-radio-btn")}></i></div>
                </>}
            </div>

            <div className="flex-line-resident-info">
                <div className="flex-line flex-resident-name">
                    {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                </div>
            </div>
        </div>
    )}

export default ReapplicationBlockItem;

