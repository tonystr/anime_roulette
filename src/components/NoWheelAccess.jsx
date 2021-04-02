import React, { useState } from 'react';
import firestore from '../firestore';

export default function NoWheelAccess({ wheel, userUid }) {
    const [requested, setRequested] = useState(false);

    const requestAccess = () => {
        if (!wheel) return;
        const docRef = firestore.doc(`wheels${window.location.pathname.match(/\/[^/]+$/)}`)
        docRef.get().then(docSnap => {
            if (!docSnap.exists) {
                return;
            }

            const accessRequests = docSnap.data()?.accessRequests || [];

            if (accessRequests.includes(userUid)) {
                // setError(() => 'You have already requested access to this wheel. Wait for the owner to accept.');
                return;
            }

            docRef.update({ accessRequests: [...accessRequests, userUid] });
        });

        setRequested(() => true);
    };

    return (
        <div className='no-wheel-access'>
            <p>
                There is either no wheel here, or the wheel visibility is set to private.
            </p>
            {requested ?
                <p>You have requested access. Wait for the owner to accept.</p> :
                <button onClick={requestAccess}>Request access</button>}
        </div>
    )
}
