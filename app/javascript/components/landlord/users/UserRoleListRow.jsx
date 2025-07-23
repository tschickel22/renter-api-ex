import React, {useState} from 'react';

import {Link, useNavigate} from "react-router-dom";
import insightUtils from "../../../app/insightUtils";
import insightRoutes from "../../../app/insightRoutes";
import RowMenu from "../../shared/RowMenu";
import {useSelector} from "react-redux";


const UserRoleListRow = ({userRole}) => {

    let navigate = useNavigate();

    const { currentCompany } = useSelector((state) => state.company)
    const { currentUser } = useSelector((state) => state.user)

    const [rowMenuOpen, setRowMenuOpen] = useState(false)

    function navigateAndClose(url) {
        navigate(url)
        setRowMenuOpen(false)
    }

    return (
        <>
            {currentCompany &&
            <div className="st-row-wrap">
                <div className="st-row">
                    <div className="st-col-25 st-first-col">
                        <div>
                            {userRole.name == "Company Admin" ?
                                <>Company Admin</>
                                :
                                (currentUser.users_edit ?
                                    <Link to={insightRoutes.userRoleEdit(userRole.hash_id)}>{userRole.name}</Link>
                                    :
                                    <>{userRole.name}</>
                                )
                            }
                        </div>
                    </div>
                    <div className="st-col-25">
                        {userRole.user_count}
                    </div>

                    <span className="st-nav-col">
                        {currentUser.users_edit && userRole.name != "Company Admin" &&
                            <RowMenu rowMenuOpen={rowMenuOpen} setRowMenuOpen={setRowMenuOpen}>
                                <li onClick={() => navigateAndClose(insightRoutes.userRoleEdit(userRole.hash_id))}><i className="fal fa-pencil"></i> Edit</li>
                            </RowMenu>
                        }
                    </span>
                </div>
            </div>}

        </>

    )}

export default UserRoleListRow;

