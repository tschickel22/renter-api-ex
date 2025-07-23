import React from 'react';
import {useNavigate} from "react-router-dom";

const DashboardTile = ({children, className, icon, title, total, viewAllPath}) => {

    let navigate = useNavigate()

    return (
        <>
            <div className={className || "tile"}>
                {total === undefined ?
                    <div className="tile-title-bar">
                        <div className="tile-icon">{icon}</div>
                        <div className="tile-title">{title}</div>
                    </div>
                    :
                    <div className="tile-title-bar with-total">
                        <div className="tile-icon">{icon}</div>
                        <div className="tile-title">{title}</div>
                        {viewAllPath ?
                            <div className="tile-total cursor-pointer" onClick={() => navigate(viewAllPath)}>{total}</div>
                            :
                            <div className="tile-total">{total}</div>
                        }
                    </div>
                }
                {children}
            </div>
        </>

    )}

export default DashboardTile;

