import React from 'react';
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import {useSelector} from "react-redux";


const BankTransactionNav = ({bankAccount, status}) => {

    const { constants } = useSelector((state) => state.company)

    return (
        <div className="st-nav">
            <div>
                <Link to={insightRoutes.financialConnectionList()} className="btn btn-text"><i className="fal fa-chevron-left"></i> Back</Link>
            </div>
            <div>
                <Link to={insightRoutes.financialConnectionReview(bankAccount.hash_id)} className={`btn ${status == constants.bank_transaction_status_options.new.key ? 'btn-red' : 'btn-gray'}`}>For Review</Link>
                <Link to={insightRoutes.financialConnectionShowCategorized(bankAccount.hash_id)} className={`btn ${status == constants.bank_transaction_status_options.categorized.key ? 'btn-red' : 'btn-gray'}`}>Categorized</Link>
                <Link to={insightRoutes.financialConnectionShowExcluded(bankAccount.hash_id)} className={`btn ${status == constants.bank_transaction_status_options.excluded.key ? 'btn-red' : 'btn-gray'}`}>Excluded</Link>
            </div>
            <div>

            </div>
        </div>

    )
}


export default BankTransactionNav;

