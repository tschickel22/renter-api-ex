import React from 'react';
import Moment from "react-moment";

const HistoryRow = ({historyItem}) => {

    return (
        <div className="st-row-wrap">
            <div className="st-row">
                <div className="st-col-25 hidden-md st-first-col">
                    <div>
                        <strong>{historyItem.title}</strong>
                        {historyItem.sub_title && <br/>}
                        {historyItem.sub_title && <div className="text-muted">{historyItem.sub_title}</div>}
                    </div>
                </div>
                <div className="st-col-50 st-col-md-75">
                    <div>
                        <div className="hidden visible-md">
                            <strong>{historyItem.title}</strong>
                            {historyItem.sub_title && <span className="text-muted"> ({historyItem.sub_title}}</span>}
                        </div>
                        <div dangerouslySetInnerHTML={{__html: historyItem.changes_html}} />
                    </div>
                </div>
                <div className="st-col-25">
                    <Moment date={historyItem.updated_at} format="MM/DD/YYYY [at] hh:mm A" />
                    {historyItem.user_full_name && <div className="text-muted">
                        by {historyItem.user_full_name}
                    </div>}
                </div>
                <span className="st-nav-col"></span>
            </div>
        </div>
    )}

export default HistoryRow;

