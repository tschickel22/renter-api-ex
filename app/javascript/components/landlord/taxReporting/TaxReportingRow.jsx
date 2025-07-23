import React from "react";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";
import insightUtils from "../../../app/insightUtils";

const TaxReportingRow = ({taxReporting, allowSelection, selected, setSelected}) => {
    const navigate = useNavigate()
    const { constants } = useSelector((state) => state.company)

    function navigateToViewRelatedObject(taxReporting) {

        if (taxReporting.related_object_type == "Vendor") {
            navigate(insightRoutes.vendorEdit(taxReporting.related_object_id), {state: {return_url: location.pathname + (window.location.search || '')}})
        }
        else if (taxReporting.related_object_type == "PropertyOwner") {
            navigate(insightRoutes.propertyOwnerEdit(taxReporting.related_object_id), {state: {return_url: location.pathname + (window.location.search || '')}})
        }
    }

    function navigateToPaymentReport(taxReporting) {

        if (taxReporting.related_object_type == "Vendor") {
            navigate(insightRoutes.reportRun("vendor_payments")+ `?start_date=01/01/${taxReporting.report_year}&end_date=12/31/${taxReporting.report_year}&vendor_id=${taxReporting.related_object_id}`)
        }
        else if (taxReporting.related_object_type == "PropertyOwner") {
            navigate(insightRoutes.reportRun("property_owner_transactions")+ `?start_date=01/01/${taxReporting.report_year}&end_date=12/31/${taxReporting.report_year}&property_owner_id=${taxReporting.related_object_id}`)
        }
    }

    function toggleSelection(id) {
        let newSelected = [...selected]

        if (newSelected.includes(id)) {
            newSelected.splice( newSelected.indexOf(id), 1 )
        }
        else {
            newSelected.push(id)
        }

        setSelected(newSelected)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-15 st-first-col">
                        {setSelected && <>
                            {allowSelection && parseInt(taxReporting.total) >= 600 ?
                                <i className={"fa-square btn-checkbox " + (selected.includes(taxReporting.id) ? "fas active" : "fal")} onClick={() => toggleSelection(taxReporting.id)}></i>
                                :
                                <div style={{width: "30px"}} />
                            }
                        </>}
                        {taxReporting.related_object_type == "PropertyOwner" ? "Owner" : taxReporting.related_object_type}
                        </div>
                            <div className="st-col-15">
                        <a onClick={() => navigateToViewRelatedObject(taxReporting)}>{taxReporting.payee_name}</a>
                        <div className="text-muted text-small text-long" style={{maxWidth: "150px"}} onClick={() => navigateToViewRelatedObject(taxReporting)}>{taxReporting.tax_classification_pretty}</div>
                    </div>
                    <div className="st-col-15 text-right">
                        {insightUtils.numberToCurrency(taxReporting.amount_paid, 2)}
                    </div>
                    <div className="st-col-15 text-right">
                        {insightUtils.numberToCurrency(taxReporting.rental_income, 2)}
                    </div>
                    <div className="st-col-15 text-right">
                        {insightUtils.numberToCurrency(taxReporting.other_income, 2)}
                    </div>
                    <div className="st-col-15 text-right">
                        <a onClick={() => navigateToPaymentReport(taxReporting)}>{insightUtils.numberToCurrency(taxReporting.total, 2)}</a>
                    </div>

                    <div className="st-col-15 text-center">
                        {parseInt(taxReporting.total) < 600 ? "Not Eligible" : (taxReporting.external_url ? <a href={taxReporting.external_url} target="_blank">{taxReporting.status_pretty}</a> : taxReporting.status_pretty)}
                    </div>
                </div>
            </div>
        </>

    )
}

export default TaxReportingRow;

