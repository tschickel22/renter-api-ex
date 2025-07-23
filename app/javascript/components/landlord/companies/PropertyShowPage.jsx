import React from 'react';

import {useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";

const PropertyShowPage = ({}) => {
    let params = useParams();
    const { properties } = useSelector((state) => state.company)
    const property = insightUtils.getCurrentProperty(properties, params)

    return (
        <>
            {property &&
                <div className="section" id="ll-section-resident-screening">

                    <div className="title-block">
                        <h1>{property.name}</h1>
                    </div>

                    <div className="section-table-wrap">




                    </div>

                </div>
            }
        </>

    )}

export default PropertyShowPage;

