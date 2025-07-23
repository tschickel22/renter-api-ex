import React, {useState} from 'react';

import DashboardListTile from "../DashboardListTile";
import store from "../../../../app/store";
import insightRoutes from "../../../../app/insightRoutes";
import {useSelector} from "react-redux";
import {searchForCommunications} from "../../../../slices/communicationSlice";
import Moment from "react-moment";
import {Link} from "react-router-dom";

const DashboardMessages = ({}) => {

    const { currentUser } = useSelector((state) => state.user)

    const [newMessages, setNewMessages] = useState(0)

    async function runSearch(_text) {
        const results = await store.dispatch(searchForCommunications({subType: "communications_center"})).unwrap()

        let conversationsToDisplay = {}
        let newMessageCount = 0

        // Only show one message per resident
        if(results.data.communications) {
            results.data.communications.forEach((comm) => {
                if (comm.to_type != 'Resident') {
                    conversationsToDisplay[comm.related_object.hash_id] = comm
                }
            })
        }

        Object.values(conversationsToDisplay).forEach((comm) => {
            if (!comm.read_at) {
                newMessageCount++
            }
        })

        setNewMessages(newMessageCount)

        const messagesToDisplay = Object.values(conversationsToDisplay).sort((a, b) => {
            let valA = a.created_at
            let valB = b.created_at

            return (valA > valB ? -1 : 1)
        })

        return {total: messagesToDisplay.length, objects: messagesToDisplay}
    }

    function generateTableRow(message, key) {
        let fromName = message.from?.name || ""
        return (
            <div className="st-row-wrap" key={key}>
                <div className="st-col-100 st-long-text">
                    <Link to={insightRoutes.communicationCenter(currentUser, "inbox", message.property_id, message.related_object.hash_id)}>{message.body}</Link>
                </div>
                <div className="st-row" style={{marginBottom: "5px"}}>
                    <div className="st-col-50 st-long-text">
                        <em>{fromName}</em>
                    </div>
                    <div className="st-col-50">
                        <em><Moment fromNowDuring={86400*2000} date={message.created_at} format="MM/DD/YYYY [at] hh:mm A" /></em>
                    </div>
                </div>
            </div>)
    }
    return (
        <>
            <DashboardListTile
                icon={<i className="fal fa-comments"/>}
                title="Messages"
                totalOverride={newMessages}
                numberPerPage={3}
                runSearch={runSearch}
                generateTableRow={generateTableRow}
                viewAllPath={insightRoutes.communicationCenter(currentUser)}
            />
        </>

    )}

export default DashboardMessages;

