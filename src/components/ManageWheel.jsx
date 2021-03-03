import React from 'react';
import firestore from '../firestore';

export default function ManageWheel({ escape, userUid, wheelId, resetWheelName, users }) {
    const deleteWheel = () => {
        if (!window.confirm(`Are you sure you want to delete ${wheelId}?`)) return;
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
    }

    return (
        <div id='manage-wheel'>
            <h2>Manage wheel</h2>
            <ul className='users'>
                {users.map(user => (
                    <li>
                        <span className='username'>{user.name}</span>
                        {user.uuid === userUid ?
                            <span className='owner-tag'>Owner</span> :
                            <button className='kick-button' onClick={() => {}}>Kick</button>}
                    </li>
                ))}
            </ul>
            <button onClick={escape}>Return to wheel</button>
            <button onClick={deleteWheel} className='danger'>Delete Wheel</button>
        </div>
    );
};
