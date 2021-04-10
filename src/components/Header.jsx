import React from 'react';
import AccessRequests from './AccessRequests';
import { auth } from '../firestore';

function SignOut({ className='', ...props }) {
    return auth.currentUser ? (
        <button
            {...props}
            className={'clickable-faded ' + className}
            onClick={() => auth.signOut()}
        >
            Sign out
        </button>
    ) : null;
}

export default function Header({ user, selectedWheelId, wheelTitle }) {
    const websiteTitle = false ? 'Anime Roulette' : 'Roulette Wheel';

    return (
        <header>
            <div className='wheel-meta'>
                {selectedWheelId && user && <AccessRequests wheelId={selectedWheelId} userUid={user?.uid} />}
            </div>
            <h1>{websiteTitle}</h1>
            <div className="export-import">
                <SignOut />
            </div>
        </header>
    )
}
