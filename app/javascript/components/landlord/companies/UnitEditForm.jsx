import FormItem from "../../shared/FormItem";
import StateDropdown from "../../shared/StateDropdown";

import FloorPlanNameDropdown from "./FloorPlanNameDropdown";
import BedsDropdown from "./BedsDropdown";
import BathsDropdown from "./BathsDropdown";
import React from "react";


import insightUtils from "../../../app/insightUtils";


const UnitEditForm = ({property, unit, namePrefix, index, arrayHelpers}) => {

    function cancelNewUnit(arrayHelpers, index) {
        arrayHelpers.remove(index)
    }

    return (
        <div>
            <div className="form-row">
                <FormItem label="Address" name={`${namePrefix}street`} />
                <FormItem label="Unit #" name={`${namePrefix}unit_number`} optional={property.property_type != "apartment"} />
                <FormItem label="City" name={`${namePrefix}city`} />
                <FormItem label="State" name={`${namePrefix}state`}>
                    <StateDropdown name={`${namePrefix}state`}/>
                </FormItem>
                <FormItem label="Zip" formItemClass="form-item-50" name={`${namePrefix}zip`} mask={insightUtils.zipMask()} />
            </div>

            {!insightUtils.isMultiFamily(property.property_type) && <h3>Unit</h3>}

            <div className="form-row">
                <FormItem label="Floor plan name" name={`${namePrefix}floor_plan_name`}>
                    <FloorPlanNameDropdown unit={unit} name={`${namePrefix}floor_plan_name`} />
                </FormItem>

                <FormItem label="Beds" name={`${namePrefix}beds`}>
                    <BedsDropdown name={`${namePrefix}beds`}/>
                </FormItem>

                <FormItem label="Baths" name={`${namePrefix}baths`}>
                    <BathsDropdown name={`${namePrefix}baths`}/>
                </FormItem>
                <FormItem label="Square Feet" name={`${namePrefix}square_feet`} />
            </div>
            {!unit.id && index > 0 &&
            <div className="form-row">
                <a onClick={() => cancelNewUnit(arrayHelpers, index)}>Remove</a>
            </div>
            }
        </div>
    )}

export default UnitEditForm;


