import React from "react";
import insightUtils from "../../../app/insightUtils";
import {useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";

const BankTransactionMatchRow = ({relatedObject, handleMatch}) => {
    const navigate = useNavigate()
    const { constants } = useSelector((state) => state.company)

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    {false &&
                    <div className="st-col-10 st-first-col">

                    </div>}
                    <div className="st-col-15 st-first-col">
                        {insightUtils.formatDate(relatedObject.paid_on)}
                    </div>
                    <div className="st-col-15">
                        {relatedObject.property_name}
                    </div>
                    <div className="st-col-15">
                        {relatedObject.description}
                    </div>

                    {relatedObject.status == constants.bank_transaction_status_options.new.key && <></>}

                    {relatedObject.status == constants.bank_transaction_status_options.excluded.key && <></>}

                    {relatedObject.status == constants.bank_transaction_status_options.categorized.key &&
                        <div className="st-col-15">
                            {relatedObject.related_object_assignment}
                        </div>
                    }
                    <div className="st-col-15 text-right">
                        {insightUtils.numberToCurrency(relatedObject.amount, 2)}
                    </div>
                    <div className="st-col-15 text-center">
                        <a className="btn btn-red" onClick={() => handleMatch(relatedObject)}>Match</a>
                    </div>
                    <span className="st-nav-col">
                    </span>
                </div>
            </div>
        </>

    )
}

export default BankTransactionMatchRow;

