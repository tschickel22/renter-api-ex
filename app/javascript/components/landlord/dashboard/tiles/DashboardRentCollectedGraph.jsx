import React, {useEffect, useState} from 'react';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

import DashboardTile from "../DashboardTile";
import moment from "moment";
import insightUtils from "../../../../app/insightUtils";
import insightRoutes from "../../../../app/insightRoutes";
import {useNavigate} from "react-router-dom";

const DashboardRentCollectedGraph = ({dashboardData}) => {

    let navigate = useNavigate()

    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend
    );

    const options = {
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 2,
            },
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';

                        if (label) {
                            label += ': ';
                        }

                        if (context.raw !== null) {
                            label += insightUtils.numberToCurrency(context.raw)
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                stacked: true,
            },
            x: {
                ticks: {
                    callback: function(value, index, values) {
                        return insightUtils.numberToCurrency(value);
                    }
                }
            }
        }
    };

    const [data, setData] = useState(null)

    useEffect(async() => {
        if (dashboardData.rent_breakdown) {
            let rentBilled = []
            let rentCollected = []
            let labels = []

            // Only show 6 months
            Object.keys(dashboardData.rent_breakdown).reverse().forEach((reportDate) => {
                if (labels.length < 6) {
                    let reportDateMoment = moment(reportDate)
                    labels.push(reportDateMoment.format('MMM'))
                    rentBilled.push(dashboardData.rent_breakdown[reportDate].rent_billed)
                    rentCollected.push(dashboardData.rent_breakdown[reportDate].rent_collected)
                }
            })

            // When adding to the data set, reverse them back
            labels = labels.reverse()
            rentBilled = rentBilled.reverse()
            rentCollected = rentCollected.reverse()

            const newData = {
                labels,
                datasets: [
                    {
                        label: 'Collected',
                        data: rentCollected,
                        backgroundColor: 'rgb(0, 117, 11, 1)',
                    },
                    {
                        label: 'Billed',
                        data: rentBilled,
                        backgroundColor: 'rgba(147, 147, 147, 0.75)',
                    }
                ],
            };

            setData(newData)
        }
    }, []);

    return (
        <>
            <DashboardTile icon={<i className="fal fa-dollar-circle"/>} title="Rent Collected">
                <div style={{height: '210px', padding: '0 10px', cursor: 'pointer'}} onClick={() => navigate(insightRoutes.reportRun('aging') + "?aging_detail_sort_by=total_due&aging_detail_sort_dir=desc")}>
                    {data && <Bar options={options} data={data} />}
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardRentCollectedGraph;

