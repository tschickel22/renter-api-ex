import React, {useState, useEffect, useRef} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";


const PropertyOwnerListRow = ({propertyOwner}) => {
    let navigate = useNavigate();

    const { currentUser } = useSelector((state) => state.user)
    const { constants } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-first-col">
                        {currentUser.property_owners_edit ?
                            <Link to={insightRoutes.propertyOwnerEdit(propertyOwner.id)}>{propertyOwner.name}</Link>
                            :
                            <>{propertyOwner.name}</>
                        }
                    </div>
                    <div className="st-col-20 hidden-md">
                        {propertyOwner.email}
                    </div>
                    <div className="st-col-15 hidden-md">
                        {propertyOwner.phone_number}
                    </div>
                    <div className="st-col-25 hidden-md">
                        {propertyOwner.street && <> {propertyOwner.street}<br/></>}
                        {propertyOwner.city && <> {propertyOwner.city}, </>}
                        {propertyOwner.state && <> {propertyOwner.state} </>}
                        {propertyOwner.zip}
                    </div>
                    <div className="st-col-15">
                        {propertyOwner.property_count}
                    </div>
                    <span className="st-nav-col">
                        {currentUser.property_owners_edit &&
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.propertyOwnerEdit(propertyOwner.id))}><i className="fal fa-pencil"></i> Edit</li>
                            </RowMenu>
                        }
                    </span>
                </div>
            </div>

        </>

    )
}

export default PropertyOwnerListRow;

