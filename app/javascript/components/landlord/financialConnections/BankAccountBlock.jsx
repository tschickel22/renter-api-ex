import React from "react";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import Moment from "react-moment";
import {useNavigate} from "react-router-dom";

const BankAccountBlock = ({bankAccount}) => {
    const navigate = useNavigate()

    return (
        <div className={`tile-short ${bankAccount.external_stripe_id ? 'cursor-pointer' : ''}`} onClick={() => {
            if (bankAccount.external_stripe_id) navigate(insightRoutes.financialConnectionReview(bankAccount.hash_id))
        }}>
            <div className={`${bankAccount.external_stripe_id ? 'text-red' : ''}`} style={{fontSize: "1.2em", marginBottom: "8px"}}>
                {bankAccount.name}
            </div>
            {bankAccount.external_stripe_id ? <>
                    <div className="text-muted">{bankAccount.balance && bankAccount.balance.toString().length > 0 && <>Balance: {insightUtils.numberToCurrency(bankAccount.balance, 0)}</>}</div>

                    <div className="flex-row" style={{justifyContent: "space-between", padding: "0 20px"}}>
                        <div className="text-gray" style={{lineHeight: "40px"}}>
                            {bankAccount.transactions_refreshed_at &&
                                <div className="text-green">
                                    <i className="fa fa-refresh"></i>&nbsp;&nbsp;
                                    <Moment fromNowDuring={86400*7000} date={bankAccount.transactions_refreshed_at} format="MM/DD/YYYY [at] hh:mm A" />
                                </div>
                            }
                        </div>
                        {bankAccount.external_stripe_id && bankAccount.unconfirmed_transactions > 0 && <div className="info-circle-red text-red">{bankAccount.unconfirmed_transactions}</div>}
                    </div></> :
                <div className="text-muted">Not linked</div>
            }
        </div>

    )
}

export default BankAccountBlock;

