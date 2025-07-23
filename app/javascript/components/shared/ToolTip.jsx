import React from 'react';

const ToolTip = ({icon, explanation}) => {

    return (
        <>
            <div className="tooltip-wrapper">
                {icon || <i className="far fa-question-circle"></i>}
                <div className="tooltip-explanation" dangerouslySetInnerHTML={{__html:explanation}}></div>
            </div>

        </>

    )}

export default ToolTip;

