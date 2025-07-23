import React, {useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";

const JournalEntryListRow = ({journalEntry}) => {
    let navigate = useNavigate()

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
                    <div className="st-col-15 st-col-md-25 st-first-col">
                        {currentUser.accounting_edit ?
                            <Link to={insightRoutes.journalEntryEdit(journalEntry.hash_id)}>{journalEntry.property_name}</Link>
                            :
                            <>{journalEntry.property_name}</>
                        }
                    </div>
                    <div className="st-col-15 st-col-md-25">
                        {journalEntry.memo}
                    </div>
                    <div className="st-col-15 hidden-md">
                        {journalEntry.account_name}
                    </div>
                    <div className="st-col-15 st-col-md-25">
                        {insightUtils.numberToCurrency(journalEntry.amount, 2)}
                    </div>
                    <div className="st-col-10 st-col-md-25">
                        {insightUtils.formatDate(journalEntry.entry_on)}
                    </div>
                    <span className="st-nav-col">
                        {currentUser.accounting_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                            <li onClick={()=>navigateAndClose(insightRoutes.journalEntryEdit(journalEntry.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                        </RowMenu>}
                    </span>
                </div>
            </div>

        </>

    )}

export default JournalEntryListRow;

