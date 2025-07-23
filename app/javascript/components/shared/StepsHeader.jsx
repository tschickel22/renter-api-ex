import React from 'react';
import insightRoutes from "../../app/insightRoutes";

const StepsHeader = ({steps, currentStep, setCurrentStep}) => {

    return (
        <>
            <div className="ca-steps-nav">
                {Object.keys(steps).map((stepKey, index) => {
                    const stepName = steps[stepKey]

                    return (
                        <div onClick={() => setCurrentStep(stepKey)} key={index} className={`step step-${index + 1} ${currentStep == stepKey ? 'active' : ''}`}>
                            <div className="step-number">{index + 1}</div>
                            {stepName}
                        </div>
                    )
                })}
            </div>

        </>

    )}

export default StepsHeader;

