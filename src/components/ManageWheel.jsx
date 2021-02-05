import React from 'react';
import firestore from '../firestore';

export default function ManageWheel({ escape, userUid, wheelId, resetWheelName }) {
    const deleteWheel = () => {
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
        <div>
            <h2>Manage wheel</h2>
            <button onClick={escape}>Return</button>
            <button onClick={deleteWheel}>Delete Wheel</button>
        </div>
    );
};
