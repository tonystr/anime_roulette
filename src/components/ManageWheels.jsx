import React, { useState, useEffect }  from 'react';
import firestore from '../firestore';

function convertWheelName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export default function ManageWheels({ uid, selectWheelName, userWheels=[] }) {
    const [requestName, setRequestName] = useState('');
    const [ownName, setOwnName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [requestDisabled, setRequestDisabled] = useState(true);
    const [ownDisabled, setOwnDisabled] = useState(true);
    const noWheels = userWheels.length < 1

    const requestAccess = () => {
        if (requestDisabled) return;
        const docRef = firestore.doc(`wheels/${convertWheelName(requestName)}`)
        docRef.get().then(docSnap => {
            if (!docSnap.exists) {
                setError(() => 'Wheel does not exist. Check your spelling.');
                return;
            }

            const accessRequests = docSnap.data()?.accessRequests || [];

            if (accessRequests.includes(uid)) {
                setError(() => 'You have already requested access to this wheel. Wait for the owner to accept.');
                return;
            }

            docRef.update({ accessRequests: [...accessRequests, uid] });

            setError(() => '');
            setSuccess(() => `Successfully requested access to ${requestName}. Wait for the owner to accept your request.`);
            selectWheelName(convertWheelName(requestName));

            console.log('Requested access to join wheel.');
        });
    };

    const createWheel = () => {
        if (ownDisabled) return;
        const ownConverted = convertWheelName(ownName);
        if (!ownConverted) {
            setError(() => 'Invalid name. Check your input.');
            return;
        }
        const title = ownName.trim();
        firestore.doc(`wheels/${ownConverted}`).set({
            title,
            owner: uid,
            rotate: {
                date: new Date(),
                endDate: +(new Date()),
                offset: Math.PI,
                rng: 0,
                spinning: false
            },
            users: [uid]
        });
        firestore.doc(`users/${uid}`).update({ wheels: [...userWheels, ownConverted] });
        selectWheelName(ownConverted);
    };

    useEffect(() => {
        if (requestDisabled === !requestName) return;
        setRequestDisabled(() => !requestName);
    }, [requestName, requestDisabled]);

    useEffect(() => {
        if (error) setSuccess(() => '');
    }, [error]);

    useEffect(() => {
        if (!ownName) {
            setError(() => '');
            setOwnDisabled(() => true);
            return;
        }

        firestore.collection('wheels').doc(ownName).get().then(docSnap => {
            setError(() => docSnap.exists ? 'Error: Wheel name taken' : '');
            setOwnDisabled(() => docSnap.exists);
        });

    }, [ownName]);

    return (
        <div className='no-wheels page-form'>
            <h2>{noWheels ? 'You don\'t have access to any wheels' : 'Select a wheel from the top-left menu, or'}</h2>
            <div>
                <label htmlFor='request-access'>Request access:</label>
                <input
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    type='text'
                    id='request-access'
                    placeholder='Wheel name'
                    onKeyDown={e => e.key === 'Enter' && requestAccess()}
                />
                <button type='submit' className={requestDisabled ? 'disabled' : ''} onClick={requestAccess}>Request</button>
            </div>
            <div className='or'>or</div>
            <div>
                <label htmlFor='make-your-own'>Make your own:</label>
                <input
                    value={ownName}
                    placeholder='Wheel name'
                    onChange={e => setOwnName(e.target.value)}
                    type='text'
                    id='make-your-own'
                    onKeyDown={e => e.key === 'Enter' && createWheel()}
                />
                <button type='submit' className={ownDisabled ? 'disabled' : ''} onClick={createWheel}>Create</button>
            </div>
            <div className='error'>{error}</div>
            <div className='success'>{success}</div>
        </div>
    );
}
