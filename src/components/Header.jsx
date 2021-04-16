import React from 'react';
import AccessRequests from './AccessRequests';

export default function Header({ user, selectedWheelId }) {
    const websiteTitle = false ? 'Anime Roulette' : 'Roulette Wheel';

    return (
        <header>
            <div className='wheel-meta'>
                {selectedWheelId && user && <AccessRequests wheelId={selectedWheelId} userUid={user?.uid} />}
            </div>
            <h1>{websiteTitle}</h1>
        </header>
    )
}
