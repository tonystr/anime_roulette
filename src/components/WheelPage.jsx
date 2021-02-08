import React, { useState } from 'react';
import firestore, { useCollectionData } from '../firestore';
import Wheel   from './Wheel';
import Shows   from './Shows';
import History from './History';

export default function WheelPage({ wheelName, setWheelName, userUid }) {
    const [users, setUsers] = useState(() => [
        { name: 'Tony'  , uuid: 'ZO1t12VfzKfA3z4DSRkhwH8Hghu2' },
        { name: 'Espen' , uuid: 'ArklXKxySSfXCn1JQHcYBiBJrbp1' },
        { name: 'Jørgen', uuid: 'DiOHXZRe7iP7FHxkG7xEigQoLFF3' },
        { name: 'Sigurd', uuid: '9893123siggurdnouuidda!2121x' }
    ]);

    const wheelRef = firestore.collection('wheels').doc(wheelName);
    const showsQuery   = wheelRef.collection('shows'  ).orderBy('date');
    const historyQuery = wheelRef.collection('history').orderBy('date');

    const shows   = translateCDDates(useCollectionData(showsQuery));
    const history = translateCDDates(useCollectionData(historyQuery));

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

    return (
        <main id='home' role='main'>
            <Shows   className='left   shows'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} addShow={addShow} setUsers={setUsers} wheelName={wheelName} userUid={userUid} />
            <Wheel   className='center wheel'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} wheelName={wheelName} />
            <History className='right  history' users={users} shows={shows} history={history} updateHistoryProp={updateHistoryProp} />
        </main>
    );
};

function translateCDDates([ array=[] ]) {
    return array.map(h => ({ ...h, date: h.date.toDate ?
        h.date.toDate() :
        new Date(h.date)
    }));
}
