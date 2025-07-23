import React, {Component, useEffect, useRef} from "react";
import { createPortal } from "react-dom";
import insightUtils from "../../app/insightUtils";

const Modal = ({onClick, closeModal, children, preventClickOutsideToClose, extraClassName}) => {

        const closeable = useRef()

        useEffect(() => {
            return insightUtils.handleCloseIfClickedOutside(closeable, !preventClickOutsideToClose, () => closeModal())
        }, [])

        return createPortal(
            <div onClick={onClick}>
                <div className="overlay-container">
                    <div className={"overlay-box " + (extraClassName || '')}>
                        {closeModal && <a onClick={closeModal} className="btn-close-overlay">
                            <i className="fal fa-times-circle"></i>
                        </a>}
                        <div className="overlay-box-content" ref={closeable}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>,
            document.getElementById("react-modal")
        );
}

export default Modal;