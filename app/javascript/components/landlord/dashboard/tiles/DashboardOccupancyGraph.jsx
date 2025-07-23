import React, {useEffect, useRef, useState} from 'react';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend, ArcElement,
} from 'chart.js';

import {Bar, Pie} from 'react-chartjs-2';

import DashboardTile from "../DashboardTile";
import moment from "moment";
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const DashboardOccupancyGraph = ({dashboardData}) => {

    let navigate = useNavigate()

    ChartJS.register(ArcElement, Tooltip, Legend);

    function handlePieClick(e, piecesClicked) {
        if (piecesClicked.length > 0){
            const pieceClicked = piecesClicked[0]

            if (pieceClicked.index === 0) {
                navigate(insightRoutes.unitList(null, "occupied"))
            }
            else if (pieceClicked.index === 1) {
                navigate(insightRoutes.unitList(null, "vacant_leased"))
            }
            else if (pieceClicked.index === 2) {
                navigate(insightRoutes.unitList(null, "vacant"))
            }
        }
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
            }
        },
        onClick: handlePieClick
    };

    const [data, setData] = useState(null)

    useEffect(async() => {
        if (dashboardData.rent_breakdown) {

            let lastMonth = Object.keys(dashboardData.rent_breakdown).reverse()[0]
            let rentData = dashboardData.rent_breakdown[lastMonth]
            
            const newData = {
                labels: ['Occupied', 'Vacant Leased', 'Vacant'],
                datasets: [
                    {
                        data: [rentData.units_occupied, rentData.units_vacant_leased, rentData.units_total - (rentData.units_occupied + rentData.units_vacant_leased)],
                        backgroundColor: [
                            'rgb(0, 117, 11, 0.75)',
                            'rgb(39,179,118, 0.75)',
                            'rgba(196, 76, 61, 0.75)',
                        ],
                        borderColor: [
                            'rgb(0, 117, 11, 1)',
                            'rgb(39,179,118, 1)',
                            'rgba(196, 76, 61, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            }

            setData(newData)
        }
    }, []);

    return (
        <>
            <DashboardTile icon={<i className="fal fa-house"/>} title="Occupancy" total={parseInt(dashboardData.occupancy_pct).toString() + "%"} viewAllPath={insightRoutes.unitList(null, "vacant")}>
                <div style={{height: '210px', padding: '10px 10px 0', cursor: 'pointer'}}>
                    {data && <Pie options={options} data={data} />}
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardOccupancyGraph;
