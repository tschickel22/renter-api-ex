import React from 'react';

import store from "../../../app/store";
import {searchForUserRoles, searchForUsers} from "../../../slices/userSlice";
import ListPage from "../../shared/ListPage";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import UserRoleListRow from "./UserRoleListRow";
import {useSelector} from "react-redux";


const UserRoleListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        const results = await store.dispatch(searchForUserRoles({searchText: text, page: page})).unwrap()
        return {total: results.data.total, objects: results.data.user_roles}
    }

    function generateTableRow(userRole, key) {
        return <UserRoleListRow key={key} userRole={userRole} />
    }
    return (
        <>
            {currentUser.users_view && <ListPage
                title="User Roles"
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                addButton={currentUser.users_edit ? <Link to={insightRoutes.userRoleNew()} className="btn btn-red"><span>Add User Role <i className="fas fa-plus"></i></span></Link> : null}
                runSearch={runSearch}
                columns={[
                    {label: "Name", class: "st-col-25", sort_by: 'name'},
                    {label: "# of Users", class: "st-col-25", sort_by: 'user_count'}
                ]}
                generateTableRow={generateTableRow}
            />}
        </>
    )}

export default UserRoleListPage;

