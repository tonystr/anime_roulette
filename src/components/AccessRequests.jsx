import React, { useState, useEffect } from 'react';
import firestore, { useDocumentData } from '../firestore';

export default function AccessRequests({ wheelId, userUid }) {
    const [userNames, setUserNames] = useState({});

    const [wheel] = useDocumentData(firestore.doc(`wheels/${wheelId}`));
    const requests = wheel?.accessRequests;
    const wheelOwner = wheel?.owner;

    useEffect(() => {
        if (!requests) return;
        for (const uuid of requests) {
            if (userNames[uuid] !== undefined) continue;
            firestore.doc(`users/${uuid}`).get().then(docSnap => {
                if (!docSnap.exists) {
                    console.log('not exists');
                    return;
                }
                setUserNames(prev => ({ ...prev, [uuid]: docSnap.data().name }))
            }).catch(console.error);
        }
    }, [requests, userNames]);

    const accept = uuid => {
        firestore.doc(`wheels/${wheelId}`).update({
            accessRequests: requests.filter(user => user !== uuid),
            users: [...wheel.users, uuid]
        });
    };

    const reject = uuid => {
        firestore.doc(`wheels/${wheelId}`).update({
            accessRequests: requests.filter(user => user !== uuid)
        });
    };

    return userUid !== null && userUid === wheelOwner && requests ? (
        <div className='access-requests'>
            {requests.map(uuid => (
                <div key={uuid} className='request'>
                    {userNames[uuid] ? <span className='username'>{userNames[uuid]}</span> : 'Someone'}
                    &nbsp;is requesting access to this wheel.
                    <button className='blop' onClick={() => accept(uuid)}>Accept</button> /
                    <button className='blop' onClick={() => reject(uuid)}>Deny  </button>
                </div>
            ))}
        </div>
    ) : null;
};
