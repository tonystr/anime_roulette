import React, { useState } from 'react';
import firestore from '../firestore';
import confirmAction from '../scripts/confirmAction';

const weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageWheel({ escape, userUid, wheel, wheelId, resetWheelName, users, iconUrl, setIconUrl }) {
    const deleteWheel = () => confirmAction(`Are you sure you want to delete ${wheelId}?`).then(confirmed => {
        if (!confirmed) return;

        firestore.collection('wheels').doc(wheelId).update({
            deleted: true
        });

        const userRef = firestore.collection('users').doc(userUid);
        userRef.get().then(snap => {
            userRef.update({
                wheels: snap.data().wheels.filter(wheel => wheel !== wheelId)
            });
            resetWheelName();
        });
    });

    const kickUser = user => {
        if (user.uuid === userUid) return window.alert('I have no idea how you managed to try to kick yourself, but ya can\'t, buddy. Tell me what you did to get this message because that\'s surely a bug. Anyway if you want to kick yourself, you need to delete the wheel. Should be a big red button on the bottom of this page or whatever. Have a good ' + weekDay[(new Date()).getDay()] + '.');
        confirmAction(`Are you sure you want to kick ${user.name} [uid:${user.uuid}]?`).then(confirmed => {
            if (!confirmed) return;

            const wheelRef = firestore.doc(`wheels/${wheelId}`);
            wheelRef.get().then(docSnap => {
                const users = docSnap?.data()?.users;
                if (!users) return;
                wheelRef.update({
                    users: users.filter(uid => uid !== user.uuid)
                });
            });
        });
    }

    return (
        <div id='manage-wheel'>
            <h2>Manage wheel <span className='wheel-title'>{wheel?.title}</span></h2>
            <div className='manage-icon'>
                <div className='wheel-icon'>
                    <img src={iconUrl} alt='' />
                </div>
                <div>
                    <h3>Wheel icon</h3>
                    <input type='text' className='ginput' value={iconUrl} onChange={e => setIconUrl(() => e.target.value)} />
                </div>
            </div>
            <ul className='users'>
                {users.map(user => (
                    <li key={user.uuid}>
                        <span className='username'>{user.name}</span>
                        {user.uuid === userUid ?
                            <span className='owner-tag'>Owner</span> :
                            <button className='kick-button' onClick={() => kickUser(user)}>Kick</button>}
                    </li>
                ))}
            </ul>
            <button onClick={escape}>Return to wheel</button>
            <button onClick={deleteWheel} className='danger'>Delete Wheel</button>
        </div>
    );
};
