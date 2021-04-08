import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import firestore, { useDocumentData } from '../firestore';
import confirmAction from '../scripts/confirmAction';

const weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WheelSettings({ userUid, redirect }) {
    const [users, setUsers] = useState(() => []);
    const [iconUrl, setIconUrl] = useState('');
    const iconUrlLoaded = useRef(false);
    const { wheelId } = useParams();
    const [wheel] = useDocumentData(firestore.doc(`wheels/${wheelId}`));
    const iconTitle = (wheel?.title || '???').replace(/\W*(\w)\w+\W*/g, '$1').toUpperCase();

    useEffect(() => {
        if (!iconUrl && wheel?.icon && !iconUrlLoaded.current) {
            setIconUrl(() => wheel?.icon);
            iconUrlLoaded.current = true;
        }
    }, [wheel?.icon, iconUrl]);

    useEffect(() => {
        if (!wheel?.users) return;
        setUsers(prev => wheel.users.map(uuid => ({ name: 'User', uuid })));
        for (const uuid of wheel.users) {
            firestore.collection('users').doc(uuid).get().then(docSnap => {
                const userDoc = docSnap.data();
                const name = userDoc.name;
                setUsers(prev => prev.map(user => user.uuid === uuid ? ({ ...user, name }) : user));
            })
        }
    }, [wheel?.users?.length]);

    const updateShowProp = (prop, value) => firestore
        .doc(`wheels/${wheelId}`)
        .update({ [prop]: value })
        .then(() => console.log('Document successfully updated!'))
        .catch(err => console.error('Error updating document: ', err));

    const deleteWheel = () => confirmAction(`Are you sure you want to delete ${wheelId}?`).then(confirmed => {
        if (!confirmed) return;

        firestore.doc(`wheels/${wheelId}`).update({ deleted: true });

        const userRef = firestore.doc(`users/${userUid}`);
        userRef.get().then(snap => {
            userRef.update({
                wheels: snap.data().wheels.filter(wheel => wheel !== wheelId)
            });
            redirect('/select_wheel');
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
        <div id='wheel-settings'>
            <h2>Manage wheel <span className='wheel-title'>{wheel?.title}</span></h2>
            <div className='manage-icon'>
                <div className='wheel-icon'>
                    {iconUrl ?
                        <img src={iconUrl} alt={iconTitle} /> :
                        <div className='icon-title'>{iconTitle}</div>}
                </div>
                <div>
                    <h3>Wheel icon</h3>
                    <input
                        type='text'
                        className='ginput'
                        value={iconUrl}
                        onChange={e => {
                            setIconUrl(() => e.target.value);
                            updateShowProp('icon', e.target.value);
                        }}
                        placeholder='Insert Icon Url...'
                    />
                </div>
            </div>
            <div className='wheel-visibility'>
                <div className='top'>
                    <h3>Wheel visibility</h3>
                    <button
                        className={'toggle' + (wheel?.private ? ' off' : ' on')}
                        onClick={() => updateShowProp('private', !wheel?.private)}
                    />
                </div>
                {wheel?.private ?? false ?
                    <p>This wheel is currently set to <b>private</b>. Users need an account to view this wheel, and they must be given access by you. You can see all users with access in the list below. </p> :
                    <p>This wheel is currently set to <b>public</b>. Anyone can view (but not interract with) the wheel by visiting this link: <Link to={window.location.href}>{window.location.href}</Link></p>}
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
            <Link to={`/wheels/${wheelId}`}><button>Return to wheel</button></Link>
            <button onClick={deleteWheel} className='danger'>Delete Wheel</button>
        </div>
    );
};
