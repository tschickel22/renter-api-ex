import React from 'react';

const Page = ({title, subTitle, titleImage, nav, children}) => {

    return (
        <>
            <div className="section">

                {titleImage || <img className="section-img" src="/images/photo-properties.jpg" />}

                {(title || subTitle) && <div className="title-block">
                    <h1>{title}</h1>
                    {subTitle && <div className="subtitle">{subTitle}</div>}
                </div>}

                <div className="section-table-wrap">
                    {nav}

                    {children}

                </div>

            </div>
        </>

    )}

export default Page;

