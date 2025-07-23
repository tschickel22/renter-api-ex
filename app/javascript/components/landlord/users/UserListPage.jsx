import React from 'react';
import UserListRow from "./UserListRow";
import store from "../../../app/store";
import {searchForUsers} from "../../../slices/userSlice";
import ListPage from "../../shared/ListPage";
import {Link} from "react-router-dom";
import insightRoutes from "../../../app/insightRoutes";
import insightUtils from "../../../app/insightUtils";
import {useSelector} from "react-redux";


const UserListPage = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    async function runSearch(text, page) {
        // Don't run the search unless this is an admin user or search text has been entered
        if (!insightUtils.isAdmin(currentUser) || text?.length > 0) {
            const results = await store.dispatch(searchForUsers({searchText: text, page: page})).unwrap()
            return {total: results.data.total, objects: results.data.users}
        }
        else {
            return {total: 0, objects: []}
        }
    }

    function generateTableRow(user, key) {
        return <UserListRow key={key} user={user} />
    }
    return (
        <>
            {currentUser.users_view && <ListPage
                title="Users"
                titleImage={<img className="section-img" src="/images/photo-accounting.jpg" />}
                addButton={currentUser.users_edit ? <Link to={insightRoutes.userNew()} className="btn btn-red"><span>Add User <i className="fas fa-plus"></i></span></Link> : null}
                runSearch={runSearch}
                columns={
                    insightUtils.isAdmin(currentUser) ?
                        [
                            {label: "User", class: "st-col-25 st-col-md-25", sort_by: 'last_name'},
                            {label: "Email", class: "st-col-25 st-col-md-75", sort_by: 'email'},
                            {label: "Company", class: "st-col-15 hidden-md", sort_by: 'company_name'},
                            {label: "Type", class: "st-col-15 hidden-md", sort_by: 'user_type'},
                        ]
                        :
                        [
                            {label: "User", class: "st-col-33", sort_by: 'last_name'},
                            {label: "Email", class: "st-col-33", sort_by: 'email'},
                            {label: "Type", class: "st-col-33", sort_by: 'user_type'},
                        ]
                }
                generateTableRow={generateTableRow}
                noDataMessage={insightUtils.isAdmin(currentUser) ? "Run a search to build a list of users" : "No users found"}
            />}
        </>

    )}

export default UserListPage;

