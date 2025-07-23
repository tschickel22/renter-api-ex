import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import ToolTip from "../../shared/ToolTip";


const PropertyListRow = ({property, handleScreeningActivation}) => {

    let navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)
    const { currentCompany } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            {currentCompany &&
            <div className="st-row-wrap">
                <div className="st-row">
                    {property.status == "active" ?
                        <>
                            <div className="st-col-30 st-first-col">
                                <Link to={insightRoutes.unitList(property.id)} state={{from: "properties"}}>{property.name}<br/>
                                    {property.street &&
                                    <>
                                        {property.street}<br/>{property.city}, {property.state} {property.zip}
                                    </>
                                    }
                                </Link>
                            </div>
                            <span className="st-col-15">
                                {property.units_total > 0 && <>
                                    {insightUtils.numberWithCommas(100 * property.units_occupied / property.units_total)}%<br/>
                                    {property.units_occupied}/
                                </>}
                                {property.units_total} Units
                            </span>
                            <span className="st-col-10">{insightUtils.numberToCurrency(property.rent_total)}<br/>{property.rent_past_due > 0 && <span className="text-error">{insightUtils.numberToCurrency(property.rent_past_due)} Past Due</span>}</span>
                            <span className="st-col-10 hidden-md">{property.lease_expirations}</span>
                            <span className="st-col-10 hidden-lg">{property.active_listings}</span>
                            <span className="st-col-15 hidden-xl">{property.units_occupied > 0 && <>{insightUtils.numberWithCommas(100 * property.units_electronic_payments / property.units_occupied)}%</>}</span>
                            <span className="st-col-08 hidden-xl">
                                {property.units_total > 0 && <>
                                    {insightUtils.numberWithCommas(100 * property.units_renters_insurance / property.units_total)}%
                                </>}
                            </span>
                        </>
                        :
                        <>
                            <div className="st-col-30 st-first-col">
                                {property.name}
                            </div>
                            <span className="st-col-75 text-center">
                                -- Property Inactive --
                            </span>
                        </>
                    }

                    <span className="st-nav-col">
                        {currentUser.properties_edit && <>
                            {currentCompany.external_screening_id && ((!property.external_screening_id && handleScreeningActivation) || (property.external_screening_id && !property.screening_attestation && handleScreeningActivation)) && <ToolTip explanation="Property screening set up needs to be completed" icon={<i className="far fa-triangle-exclamation"></i>} />}
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.propertyEdit(property.id))}><i className="fal fa-pencil"></i> Edit</li>
                                {currentCompany.external_screening_id && !property.external_screening_id && handleScreeningActivation && <li onClick={() => {
                                    setRowMenuOpen(false);
                                    handleScreeningActivation(property)
                                }}><i className="fal fa-file-search"></i> Activate for Screening</li>}
                                {currentCompany.external_screening_id && property.external_screening_id && !property.screening_attestation && handleScreeningActivation && <li onClick={() => {
                                    setRowMenuOpen(false);
                                    handleScreeningActivation(property)
                                }}><i className="fal fa-file-search"></i> Complete Screening Activation</li>}
                            </RowMenu>
                        </>
                        }
                    </span>
                </div>
            </div>}

        </>

    )}

export default PropertyListRow;

