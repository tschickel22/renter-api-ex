import React from "react";
import {useSelector} from "react-redux";
import Modal from "./Modal";
import store from "../../app/store";
import {displayAlertMessage} from "../../slices/dashboardSlice";
import {useNavigate} from "react-router-dom";

const AlertMessageModal = () => {

    const navigate = useNavigate()

    const { alertMessage, alertLinkText, alertUrl, alertNavigateState, alertHideCloseOption } = useSelector((state) => state.dashboard)

    function closeModal() {
        store.dispatch(displayAlertMessage({message:""}))
    }

    return (
        <>
            {alertMessage &&
                <Modal preventClickOutsideToClose={true} closeModal={!alertHideCloseOption ? closeModal : null} extraClassName="overlay-box-small text-center">
                    <br/><br/>
                    <div dangerouslySetInnerHTML={{__html: alertMessage}} />
                    <br/><br/>
                    {alertUrl && alertLinkText ?
                        <>
                            {!alertHideCloseOption && <>
                                <button onClick={closeModal} className="btn btn-gray">Close</button>
                                &nbsp;
                            </>}
                            <button onClick={() => {
                                navigate(alertUrl, alertNavigateState);
                                closeModal()
                            }} className="btn btn-red">{alertLinkText}</button>
                        </>
                        :
                        <button onClick={closeModal} className="btn btn-red">OK</button>
                    }
                </Modal>
            }
        </>
    )
}

export default AlertMessageModal;