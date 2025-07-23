import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const UserListRow = ({user}) => {

    let navigate = useNavigate();

    const { isMobileDevice } = useSelector((state) => state.dashboard)
    const { currentUser } = useSelector((state) => state.user)
    const { currentCompany, constants } = useSelector((state) => state.company)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            {currentCompany &&
            <div className="st-row-wrap">
                {insightUtils.isAdmin(currentUser) ?
                    <div className="st-row">
                        <div className="st-col-25 st-col-md-25 st-first-col">
                            <div>
                                <a href={"/admin/users/" + user.id + "/proxy"}>{user.first_name} {user.last_name}</a>
                                {isMobileDevice && <><br/><em>{insightUtils.getLabel(user.user_type, constants.user_types)}</em></>}
                            </div>
                        </div>
                        <span className="st-col-25 st-col-md-75">{user.email}</span>
                        <span className="st-col-15 hidden-md">{user.company_name}</span>
                        <span className="st-col-15 hidden-md">{user.user_role_name}</span>

                        <span className="st-nav-col">
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={()=>navigateAndClose(insightRoutes.userEdit(user.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                            </RowMenu>
                        </span>
                    </div>
                    :
                    <div className="st-row">
                        <div className="st-col-33 st-first-col">
                            <div>
                                {currentUser.users_edit ?
                                    <Link to={insightRoutes.userEdit(user.hash_id)}>{user.first_name} {user.last_name}</Link>
                                    :
                                    <>{user.first_name} {user.last_name}</>
                                }
                                {isMobileDevice && <><br/><em>{insightUtils.getLabel(user.user_type, constants.user_types)}</em></>}
                            </div>
                        </div>
                        <span className="st-col-33 st-col-md-75">{user.email}</span>
                        <span className="st-col-33 hidden-md">{user.user_role_name}</span>

                        <span className="st-nav-col">
                            {currentUser.users_edit && <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={()=>navigateAndClose(insightRoutes.userEdit(user.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                            </RowMenu>}
                        </span>
                    </div>
                }
            </div>}

        </>

    )}

export default UserListRow;

