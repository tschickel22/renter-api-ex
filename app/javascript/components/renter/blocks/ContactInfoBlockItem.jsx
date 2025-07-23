import React from 'react';

const ContactInfoBlockItem = ({leaseResident}) => {

    return (
        <div className="flex-line-block flex-line-resident">
            {false && <i className="fas fa-user"></i>}
            <div className="flex-line-resident-info">
                <div className="flex-line flex-resident-name">
                    {leaseResident.resident.first_name} {leaseResident.resident.last_name}
                </div>
                {leaseResident.resident.email && <div><i className="fal fa-envelope"></i> {leaseResident.resident.email}</div>}
                {leaseResident.resident.phone_number && <div><i className="fal fa-phone"></i> {leaseResident.resident.phone_number}</div>}
            </div>
        </div>
    )}

export default ContactInfoBlockItem;

