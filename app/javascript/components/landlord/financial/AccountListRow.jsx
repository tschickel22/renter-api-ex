import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const AccountListRow = ({account}) => {

    const navigate = useNavigate()

    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-30 st-first-col">
                        {false && <span><i className="fal fa-square btn-checkbox"></i></span>}
                        <div className="flex-column">
                            {currentUser.accounting_edit ?
                                <Link to={insightRoutes.accountEdit(account.code)}>
                                    {account.name}
                                </Link>
                                :
                                <>{account.name}</>
                            }
                        </div>
                    </div>
                    <span className="st-col-15" title="Category">
                        {account.category_name}
                    </span>
                    <span className="st-col-15" title="Detail Type">
                        {account.sub_category_name}
                    </span>
                    <span className="st-col-15 text-right" title="Balance">
                        {insightUtils.numberToCurrency(account.balance, 2)}
                    </span>
                    <span className="st-nav-col">
                        {currentUser.accounting_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <li onClick={()=>navigateAndClose(insightRoutes.accountEdit(account.code))}><i className="fal fa-pencil"></i> Edit</li>
                        </RowMenu>}
                    </span>
                </div>
            </div>

        </>

    )}

export default AccountListRow;

