import React from 'react';
import firestore, { useCollectionData } from '../firestore';
import Wheel   from './Wheel';
import Shows   from './Shows';
import History from './History';
import { useParams } from 'react-router-dom';

export default function WheelPage({ users, setWheelName, userUid }) {
    const { wheelId } = useParams();
    const wheelName = wheelId;

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

    const deleteHistoryShow = uuid => wheelRef.collection('history')
        .doc(uuid).delete()
        .then(() => console.log('Document successfully updated!'))
        .catch(err => console.error('Error updating document: ', err));

    return (
        <main id='home' role='main'>
            <Shows   className='left   shows'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} addShow={addShow} wheelName={wheelName} userUid={userUid} />
            <Wheel   className='center wheel'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} wheelName={wheelName} />
            <History className='right  history' users={users} shows={shows} history={history} updateHistoryProp={updateHistoryProp} deleteShow={deleteHistoryShow} />
        </main>
    );
};

function translateCDDates([ array=[] ]) {
    return array.map(h => ({ ...h, date: h.date.toDate ?
        h.date.toDate() :
        new Date(h.date)
    }));
}
