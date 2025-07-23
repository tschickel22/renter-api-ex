import React, {useEffect, useRef, useState} from 'react';
import insightUtils from "../../app/insightUtils";

const RowMenu = ({children, rowMenuOpen, setRowMenuOpen}) => {
    const closeable = useRef()

    useEffect(() => {
        if (rowMenuOpen) {
            return insightUtils.handleCloseIfClickedOutside(closeable, true, () => setRowMenuOpen(false))
        }
    }, [rowMenuOpen])

    return (
        <>
            <i onClick={()=>setRowMenuOpen(!rowMenuOpen)} className="far fa-ellipsis-v btn-st-nav"></i>
            {rowMenuOpen &&
                <ul className="st-row-nav" ref={closeable}>
                    {children}
                </ul>
            }
        </>
    )}

export default RowMenu;

