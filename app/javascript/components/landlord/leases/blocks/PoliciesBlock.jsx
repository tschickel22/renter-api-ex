import React from 'react';

const PoliciesBlock = ({}) => {

    return (
        <div className="flex-grid-item flex-grid-columns">
            <h3>Policies</h3>
            <div className="flex-line-block">
                <div className="flex-line">Pet Allowed: <strong>Dogs, Cats</strong></div>
                <div className="flex-line">Late Fee: <strong>$75</strong></div>
                <div className="flex-line">Grace Period: <strong>3 days</strong></div>

            </div>
        </div>
    )}

export default PoliciesBlock;

