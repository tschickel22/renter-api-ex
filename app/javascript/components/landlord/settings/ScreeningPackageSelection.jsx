import React, {useState} from 'react';
import {useSelector} from "react-redux";
import {useFormikContext} from "formik";
import ScreeningPackageBlock from "../leases/ScreeningPackageBlock";


const ScreeningPackageSelection = ({}) => {

    const formikProps = useFormikContext()
    const { currentCompany } = useSelector((state) => state.company)

    return (
        <div className="choose-package">
            <div className="package-choices">
                {currentCompany.screening_packages.map((screeningPackage, i) => (
                    <ScreeningPackageBlock key={i} screeningPackage={screeningPackage} isActive={formikProps.values.default_screening_package_id == screeningPackage.id} handlePackageSelection={(e) => formikProps.setFieldValue("default_screening_package_id", screeningPackage.id)} />
                ))}
            </div>
        </div>

    )}

export default ScreeningPackageSelection;



