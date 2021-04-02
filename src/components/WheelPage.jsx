import React, { useState, useEffect } from 'react';
import firestore, { useCollectionData, useDocumentData } from '../firestore';
import Wheel   from './Wheel';
import Shows   from './Shows';
import History from './History';
import NoWheelAccess from './NoWheelAccess';
import { useParams } from 'react-router-dom';

window.arrays = [];

export default function WheelPage({ userUid }) {
    const [users, setUsers] = useState(() => []);
    const { wheelId } = useParams();
    const [wheel, wheelLoading] = useDocumentData(firestore.doc(`wheels/${wheelId}`));
    const userCanEdit = wheel?.users?.includes(userUid);
    const userCanView = userCanEdit || !wheel?.private;

    const joinedUsers = wheel?.users?.join(',') || '';
    useEffect(() => {
        if (!joinedUsers) return;
        const wheelUsers = joinedUsers.split(',');
        setUsers(prev => wheelUsers.map(uuid => ({ name: 'User', uuid })));
        for (const uuid of wheelUsers) {
            firestore.collection('users').doc(uuid).get().then(docSnap => {
                const userDoc = docSnap.data();
                const name = userDoc.name;
                setUsers(prev => prev.map(user => user.uuid === uuid ? ({ ...user, name }) : user));
            })
        }
    }, [joinedUsers]);

    const wheelRef = firestore.doc(`wheels/${wheelId}`);

    const shows   = translateCDDates(useCollectionData(wheelRef.collection(userCanView ? 'shows'   : 'UNDEFINED').orderBy('date')));
    const history = translateCDDates(useCollectionData(wheelRef.collection(userCanView ? 'history' : 'UNDEFINED').orderBy('date')));

    const colors = [
        '#caa05a',
        '#ae6a47',
        '#8b4049',
        '#543344',
        '#515262',
        '#63787d',
        '#8ea091',
        '#8B9863'
    ];

    const removeShow = uuid => wheelRef.collection(`shows`)
        .doc(uuid).delete()
        .then(() => console.log('Document successfully deleted!'))
        .catch(err => console.error('Error removing document: ', err));

    const addShow = show => wheelRef.collection('shows')
        .doc(show.uuid).set(show)
        .then(() => console.log('Document successfully added!'))
        .catch(err => console.error('Error adding document: ', err));

    const updateShowProp = (uuid, prop, value) => wheelRef.collection('shows')
        .doc(uuid).update({ [prop]: value })
        .then(() => console.log('Document successfully updated!'))
        .catch(err => console.error('Error updating document: ', err));


    const addHistory = show => wheelRef.collection('history')
        .doc(show.uuid).set(show)
        .then(() => console.log('Document successfully added!'))
        .catch(err => console.error('Error adding document: ', err));

    const updateHistoryProp = (uuid, prop, value) => wheelRef.collection('history')
        .doc(uuid).update({ [prop]: value })
        .then(() => console.log('Document successfully updated!'))
        .catch(err => console.error('Error updating document: ', err));

    const deleteHistoryShow = uuid => wheelRef.collection('history')
        .doc(uuid).delete()
        .then(() => console.log('Document successfully updated!'))
        .catch(err => console.error('Error updating document: ', err));

    return !wheelLoading && (!wheel || (wheel.private && !wheel.users.includes(userUid))) ? (
        <NoWheelAccess wheel={wheel} userUid={userUid} />
    ) : (
        <main id='home' role='main'>
            <Shows   className='left   shows'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} addShow={addShow} wheelName={wheelId} userUid={userUid} userCanEdit={userCanEdit} />
            <Wheel   className='center wheel'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} wheelId={wheelId} userCanEdit={userCanEdit} />
            <History className='right  history' users={users} shows={shows} history={history} updateHistoryProp={updateHistoryProp} deleteShow={deleteHistoryShow} userCanEdit={userCanEdit} />
        </main>
    );
};

function translateCDDates([ array=[] ]) {
    return array.map(h => ({ ...h, date: h.date.toDate ?
        h.date.toDate() :
        new Date(h.date)
    }));
}
