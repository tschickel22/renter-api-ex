import React, {useEffect, useState} from 'react';
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const VehiclesBlock = ({lease}) => {
    const navigate = useNavigate()
    const [vehicles, setVehicles] = useState([])

    useEffect(() => {
        let newVehicles = []

        // Gather all the pets
        newVehicles.push(lease.primary_resident.resident.resident_vehicles)
        lease.secondary_residents.forEach((secondaryResident) => {if(secondaryResident.resident.resident_vehicles) newVehicles.push(secondaryResident.resident.resident_vehicles)})
        setVehicles(newVehicles.flat().filter((p) => !!p))
    }, [lease]);

    return (
        <div className="flex-grid-item">
            <h3>Resident Vehicles</h3>
            <div className="flex-line-blockwrap">
                {vehicles.map((vehicle, i) => (
                    <div key={i} className="flex-line-block flex-line-resident flex-line-vehicle">
                        <div className="flex-line flex-resident-edit-info">
                            <i onClick={() => navigate(insightRoutes.residentVehicleEdit(lease.hash_id, vehicle.id))} className="fal fa-edit tooltip tooltip-edit btn-rd-edit-resident-vehicle"></i>
                            {false && <i className="fal fa-trash-alt tooltip tooltip-remove btn-rd-remove-resident-vehicle"></i>}
                        </div>
                        <i className="fas fa-car"></i>
                        <div className="flex-line-resident-info">
                            <div className="flex-line flex-resident-name">{vehicle.make} {vehicle.model}</div>
                            {vehicle.color && <div className="flex-line">Color <strong>{vehicle.color}</strong></div>}
                            {vehicle.parking_spot && <div className="flex-line">Parking Spot <strong>{vehicle.parking_spot}</strong></div>}
                            {vehicle.plate_number && <div className="flex-line">Plate <strong>{vehicle.plate_number}</strong></div>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="spacer"></div>
            <div onClick={() => navigate(insightRoutes.residentVehicleNew(lease.hash_id, lease.primary_resident.resident.hash_id))} className="btn btn-bottom btn-red"><span>Add Vehicle <i className="fal fa-plus"></i></span></div>
        </div>
    )}

export default VehiclesBlock;

