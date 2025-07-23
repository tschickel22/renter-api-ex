import React from 'react';
import insightUtils from "../../app/insightUtils";

const PaginationControls = ({page, setPage, total, numberPerPage}) => {

    const totalPages = Math.ceil(total / numberPerPage)

    return (
        totalPages <= 1 ? <></>
        :
        <div className="pagination">
            {page == 1 ?
                <span className="previous_page disabled">← Previous</span>
                :
                <a onClick={() => setPage(page - 1)}>← Previous</a>
            }

            {Array.from(Array(totalPages), (e, index) => {
                const i = index + 1

                if (page == i) {
                    return <span key={i} className="current">{i}</span>
                }
                else {
                    return <a key={i} onClick={() => setPage(i)}>{i}</a>
                }
            })}

            {false && <span className="gap">…</span>}

            {page == totalPages ?
                <span className="next_page disabled">Next →</span>
            :
                <a onClick={() => setPage(page + 1)}>Next →</a>
            }
        </div>
    )}

export default PaginationControls;

