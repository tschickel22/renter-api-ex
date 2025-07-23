import React, {useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";
import ExpenseListPage from "./ExpenseListPage";
import moment from "moment";

const ExpenseListRow = ({expense}) => {
    let navigate = useNavigate()

    const { currentUser }= useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            <div className="st-row-wrap">
                {expense.type == ExpenseListPage.TYPE_BILL ?
                    <div className="st-row">
                        <div className="st-col-15 st-col-md-25 st-first-col">
                            <Link to={insightRoutes.expenseEdit(expense.hash_id)}>{expense.description}</Link>
                        </div>
                        <div className="st-col-15 hidden-md">
                            {expense.vendor_name}
                        </div>
                        <div className="st-col-15 st-col-md-25">
                            {expense.property_name}
                        </div>
                        <div className="st-col-15 st-col-md-25">
                            {insightUtils.numberToCurrency(expense.amount_due, 2)}
                        </div>
                        <div className="st-col-10 st-col-md-25">
                            {insightUtils.formatDate(expense.due_on)}
                        </div>
                        <div className="st-col-15 hidden-md">
                            {expense.payment_status}
                        </div>
                        <span className="st-nav-col">
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.expenseEdit(expense.hash_id))}><i className="fal fa-pencil"></i> {currentUser.expenses_edit ? "Edit" : "View"}</li>
                            </RowMenu>
                        </span>
                    </div>
                    :
                    <div className="st-row">
                        <div className="st-col-15 st-col-md-25 st-first-col">
                            <Link to={insightRoutes.expenseEdit(expense.hash_id)}>{expense.description}</Link>
                        </div>
                        <div className="st-col-15 hidden-md">
                            {expense.vendor_name}
                        </div>
                        <div className="st-col-15 st-col-md-25">
                            {expense.property_name}
                            {expense.street_and_unit && expense.street_and_unit != 'Multiple' && <>
                                <br />
                                <em>{expense.street_and_unit}</em>
                            </>}
                        </div>
                        <div className="st-col-15 hidden-md">
                            {expense.account_name}
                        </div>
                        <div className="st-col-15 st-col-md-25">
                            {insightUtils.numberToCurrency(expense.amount, 2)}
                        </div>
                        <div className="st-col-10 st-col-md-25">
                            {insightUtils.formatDate(expense.paid_on || expense.due_on)}
                        </div>
                        <span className="st-nav-col">
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.expenseEdit(expense.hash_id))}><i className="fal fa-pencil"></i> {currentUser.expenses_edit ? "Edit" : "View"}</li>
                            </RowMenu>
                        </span>
                    </div>
                }
            </div>

        </>

    )}

export default ExpenseListRow;

