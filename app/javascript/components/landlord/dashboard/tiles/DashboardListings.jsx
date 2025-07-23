import React, {useEffect, useState} from 'react';

import store from "../../../../app/store";

import insightRoutes from "../../../../app/insightRoutes";
import {Link, useNavigate} from "react-router-dom";
import {searchForUnitListings} from "../../../../slices/unitListingSlice";
import {searchForUnits} from "../../../../slices/unitSlice";
import DashboardTile from "../DashboardTile";

const DashboardListings = ({}) => {

    const [total, setTotal] = useState(null)
    const [stats, setStats] = useState(null)

    useEffect(async() => {

        let stats = {"occupied": {"has_listing": 0, "no_listing": 0}, "vacant": {"has_listing": 0, "no_listing": 0}}
        const unitsResults = await store.dispatch(searchForUnits({})).unwrap()

        if (unitsResults.data.units) {
            const listingsResults = await store.dispatch(searchForUnitListings({})).unwrap()

            const unitListings = listingsResults.data.unit_listings || []

            unitsResults.data.units.forEach((unit) => {
                const unitListing = unitListings.find((ul) => ul.unit_id == unit.id)
                const unitStatus = ["occupied", "vacant_leased"].indexOf(unit.status) >= 0 ? "occupied" : "vacant"

                if (unitListing && unitListing.status == "active") {
                    stats[unitStatus]["has_listing"] = stats[unitStatus]["has_listing"] + 1
                }
                else {
                    stats[unitStatus]["no_listing"] = stats[unitStatus]["no_listing"] + 1
                }
            })
        }


        setTotal(stats["occupied"]["has_listing"] + stats["vacant"]["has_listing"])
        setStats(stats)
    }, []);

    return (
        <>
            <DashboardTile icon={<i className="fal fa-memo"/>} title="Listings" total={total} viewAllPath={insightRoutes.propertyListingList()} className="tile tile-list">
                {stats && <div className="section-table-wrap">
                    <div className="section-list">

                        <div className="st-row">
                            <div className="st-col-100">
                                <table style={{width: "100%"}}>
                                    <thead>
                                    <tr><th></th><th style={{paddingBottom: "10px"}}>Vacant</th><th style={{paddingBottom: "10px"}}>Occupied</th></tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td style={{paddingBottom: "10px"}}>Has Listings:</td>
                                        <td style={{paddingBottom: "10px"}} align="center"><Link to={insightRoutes.propertyListingList()}>{stats.vacant.has_listing}</Link></td>
                                        <td style={{paddingBottom: "10px"}} align="center"><Link to={insightRoutes.propertyListingList()}>{stats.occupied.has_listing}</Link></td>
                                    </tr>
                                    <tr>
                                        <td style={{paddingBottom: "10px"}}>No Listings:</td>
                                        <td style={{paddingBottom: "10px"}} align="center"><Link to={insightRoutes.unitList(null, "vacant")}>{stats.vacant.no_listing}</Link></td>
                                        <td style={{paddingBottom: "10px"}} align="center"><Link to={insightRoutes.unitList(null, "occupied")}>{stats.occupied.no_listing}</Link></td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>}
                <div className="tile-spacer" />
                <Link to={insightRoutes.propertyListingList()} className="tile-pagination">View All</Link>

            </DashboardTile>
        </>

    )}

export default DashboardListings;

