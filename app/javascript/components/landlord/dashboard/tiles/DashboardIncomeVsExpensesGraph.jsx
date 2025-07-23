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

const DashboardIncomeVsExpensesGraph = ({dashboardData}) => {

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
            let income = []
            let expenses = []
            let labels = []

            // Only show 6 months
            Object.keys(dashboardData.rent_breakdown).reverse().forEach((reportDate) => {
                if (labels.length < 6) {
                    let reportDateMoment = moment(reportDate)
                    labels.push(reportDateMoment.format('MMM'))
                    income.push(dashboardData.rent_breakdown[reportDate].income)
                    expenses.push(dashboardData.rent_breakdown[reportDate].expenses * -1)
                }
            })

            // When adding to the data set, reverse them back
            labels = labels.reverse()
            income = income.reverse()
            expenses = expenses.reverse()

            const newData = {
                labels,
                datasets: [
                    {
                        label: 'Income',
                        data: income,
                        backgroundColor: 'rgb(0, 117, 11, 1)'
                    },
                    {
                        label: 'Expenses',
                        data: expenses,
                        backgroundColor: 'rgba(147, 147, 147, 0.75)',
                    }
                ],
            };

            setData(newData)
        }
    }, []);

    return (
        <>
            <DashboardTile icon={<i className="fal fa-dollar-circle"/>} title="Income vs. Expense">
                <div style={{height: '210px', padding: '0 10px', cursor: 'pointer'}} onClick={() => navigate(insightRoutes.reportRun('income_statement'))}>
                    {data && <Bar options={options} data={data} />}
                </div>
            </DashboardTile>
        </>

    )}

export default DashboardIncomeVsExpensesGraph;

