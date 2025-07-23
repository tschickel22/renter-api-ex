import React, {useEffect, useState} from 'react';
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const PetsBlock = ({lease}) => {
    const navigate = useNavigate()

    const [pets, setPets] = useState([])

    useEffect(() => {
        let newPets = []

        // Gather all the pets
        newPets.push(lease.primary_resident.resident.resident_pets)
        lease.secondary_residents.forEach((secondaryResident) => {if(secondaryResident.resident.resident_pets) newPets.push(secondaryResident.resident.resident_pets)})
        setPets(newPets.flat().filter((p) => !!p))
    }, [lease]);

    return (
        <div className="flex-grid-item">
            <h3>Resident Pets</h3>
            <div className="flex-line-blockwrap">
                {pets.map((pet, i) => (
                <div key={i} className="flex-line-block flex-line-resident">
                    <div className="flex-line flex-resident-edit-info">
                        <i onClick={() => navigate(insightRoutes.residentPetEdit(lease.hash_id, pet.id))} className="fal fa-edit tooltip tooltip-edit btn-rd-edit-resident-pet"></i>
                        {false && <i className="fal fa-trash-alt tooltip tooltip-remove btn-rd-remove-resident-pet"></i>}
                    </div>
                    {false && <img className="flex-img-avatar" src="images/photo-resident-pet-dog.jpg"/>}
                    {pet.pet_type == "cat" ? <i className="fas fa-cat fa-flip-horizontal"></i> : <i className="fas fa-dog fa-flip-horizontal"></i>}
                    <div className="flex-line-resident-info">
                        <div className="flex-line flex-resident-name">{pet.name}</div>
                        {pet.breed && <div className="flex-line">{pet.breed}</div>}
                        {pet.weight && <div className="flex-line">{pet.weight} lbs</div>}
                    </div>
                </div>
                ))}
            </div>

            <div className="spacer"></div>
            <div onClick={() => navigate(insightRoutes.residentPetNew(lease.hash_id, lease.primary_resident.resident.hash_id))} className="btn btn-bottom btn-red"><span>Add Pet <i className="fal fa-plus"></i></span></div>
        </div>
    )}

export default PetsBlock;

