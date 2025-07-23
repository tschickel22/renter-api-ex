import React, {useState} from 'react';
import insightRoutes from "../../../app/insightRoutes";
import {Link, NavLink} from "react-router-dom";
import {useSelector} from "react-redux";
import store from "../../../app/store";
import {searchForCommunications} from "../../../slices/communicationSlice";
import insightUtils from "../../../app/insightUtils";
import ListPage from "../../shared/ListPage";

const CommunicationsBlock = ({lease, leaseResident}) => {

    const { currentUser } = useSelector((state) => state.user)
    const { constants, currentCompany } = useSelector((state) => state.company)

    const [communicationCount, setCommunicationCount] = useState(null)
    const [communicationsLoaded, setCommunicationsLoaded] = useState(false)

    async function runSearch(text) {
        const results = await store.dispatch(searchForCommunications({subType: "communications_center", propertyId: lease.property_id})).unwrap()
        setCommunicationCount(results.data.total)
        setCommunicationsLoaded(true)

        let sortTarget = Array.from(results.data.communications.filter((communication) => (communication.to_type == "Resident")))
        const newSortedObjects = sortTarget.sort((a, b) => {
                let valA = insightUtils.resolvePath(a, "created_at")
                let valB = insightUtils.resolvePath(b, "created_at")

                return (valA > valB ? 1 : -1) * -1
            }
        )

        // Set total to 0 so that we don't trigger pagination
        return {total: 0, objects: newSortedObjects.slice(0, 3)}
    }

    function generateTableRow(communication, key) {
        return (
            <div key={key} style={{marginBottom: "6px", overflow: "hidden" }}>
                <Link to={insightRoutes.communicationCenter(currentUser, "inbox", lease.property_id, leaseResident.hash_id) + "#comment-"+ communication.hash_id} className="text-gray"><strong className="text-gray">{insightUtils.trimCommunicationBody(communication.body, 20)}</strong></Link><br/><br/>
            </div>
        )
    }

    return (
        <>
        {
            (!currentCompany || currentCompany.subscription_frequency == constants.subscription_frequencies.free.key) ?
                <></>
                :
                <div className="flex-grid-item">
                    <h3>Property Communications</h3>
                    {!communicationsLoaded || communicationCount > 0 ?
                        <ListPage
                            title=""
                            hideSearch={true}
                            hideNavCol={true}
                            titleImage={<React.Fragment/>}
                            runSearch={runSearch}
                            generateTableRow={generateTableRow}
                        />
                        :
                        <div className="flex-line-blockwrap">
                            <p>Drop us a note. We'd love to hear from you.</p>
                        </div>
                    }

                    <div className="spacer"></div>
                    <NavLink to={insightRoutes.communicationCenter(currentUser)} className="btn btn-bottom btn-red"><span>Contact Us</span></NavLink>
                </div>
        }
        </>
    )}

export default CommunicationsBlock;

