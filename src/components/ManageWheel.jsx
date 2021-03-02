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
            {users.map(user => (
                <div>{user.name} [{user.uuid}]</div>
            ))}
            <button onClick={escape}>Return</button>
            <button onClick={deleteWheel}>Delete Wheel</button>
        </div>
    );
};
