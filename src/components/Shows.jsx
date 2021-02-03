import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { ReactComponent as UserIcon  } from '../icons/user.svg';
import ShowInpsectorModal from './ShowInspectorModal';
import AddNewButton from './AddNewButton';

export default function Shows({ users, setUsers, shows, removeShow, addHistory, updateShowProp, addShow, colors, wheelName, userUid, ...props }) {
    const [showUsers, setShowUsers] = useState(false);
    const [inspectingShow, setInspectingShow] = useState(null);
    const [editUsers, setEditUsers] = useState(false);

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;
        updateShowProp(show.uuid, prop, value);
        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    const renderShows = show => {
        const i = shows.findIndex(s => s === show);
        return (
            <div className='show' key={show.uuid}>
                <ShowInput
                    show={show}
                    value={show.name}
                    style={{ borderLeftColor: pickColor(i, colors, shows) }}
                    updateShowProp={updateShowProp}
                />
                <button className='delete' onClick={e => removeShow(show.uuid)}>×</button>
                <button className='clickable-faded edit' onClick={() => setInspectingShow(() => show)}>edit</button>
                <ShowInpsectorModal
                    isOpen={!!inspectingShow && inspectingShow.uuid === show.uuid}
                    onRequestClose={() => setInspectingShow(null)}
                    show={inspectingShow}
                    updateShowProp={updateInspectingShowProp}
                    users={users}
                    beginWatching={inspectingShow ? () => {
                        addHistory({ ...inspectingShow, date: new Date() });
                        removeShow(inspectingShow.uuid);
                        setInspectingShow(null);
                    } : null}
                />
            </div>
        );
    };

    return (
        <div {...props}>
            <div className='shows-list'>
                <div className='top-bar'>
                    <h2>Shows</h2>
                    <button className='show-users-button' onClick={() => setShowUsers(prev => !prev)}><UserIcon  /></button>
                    <button className='clickable-faded edit' onClick={() => {
                        setEditUsers(() => true);

                        //const collection = firestore.collection('users');
                        //collection
                        //    .where('wheels', 'array-contains', wheelName)
                        //    .get()
                        //    .then(querySnapshot => querySnapshot.forEach(user => (
                        //        console.log(user.data())
                        //    )));
                    }}>edit users</button>
                </div>
                {showUsers ?
                    <UserShows shows={shows} users={users} renderShows={renderShows} addShow={addShow} /> :
                    [shows && shows.map(renderShows), <AddNewButton key={'global add new button'} user={userUid} addShow={addShow} />]}
            </div>
            <ReactModal
                className='edit-users-modal modal-screen'
                ariaHideApp={false}
                isOpen={editUsers}
                onRequestClose={() => setEditUsers(() => false)}
            >
                <h2>Manage Users</h2>
                <div className='users-list'>
                    {users.map(user => (
                        <div key={user.uuid}>
                            <input
                                type='text'
                                defaultValue={user.name}
                                onChange={e => setUsers(prev => prev.map(
                                    u => u.uuid === user.uuid ?
                                    { ...user, name: e.target.value } :
                                    { ...u }
                                ))}
                            />
                        </div>
                    ))}
                </div>
            </ReactModal>
        </div>
    );
};

function ShowInput({ value, style, show, updateShowProp, ...props }) {
    const [localValue, setLocalValue] = useState(value);

    const parseShowTitle = name => {
        const match = name.match(/(\s*\(\d+\)\s*$)/);
        if (match) {
            return name.slice(0, match.index).trim();
        }
        return name.trim();
    }

    const updateValue = value => {
        updateShowProp(show.uuid, 'name', value.trim());
        updateShowProp(show.uuid, 'title', parseShowTitle(value));
    }

    return (
        <input
            type='text'
            value={localValue}
            onChange={e => setLocalValue(() => e.target.value)}
            style={style}
            onBlur={e => updateValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && updateValue(e.target.value)}
            {...props}
        />
    );
}

function UserShows({ users, shows, renderShows, addShow }) {
    return users.map((user, i) => (
        <div className='user-shows' key={user.name}>
            <h3 key={'h3 ' + user.name} className={i === 0 ? 'first-h3' : ''}>{user.name}</h3>
            {shows && shows
                .filter(show => show.owner === user.uuid)
                .map(renderShows)}
            <AddNewButton key={'add new button ' + user.name} user={user} addShow={addShow} />
        </div>
    ));
}

function pickColor(i, colors, shows) {
    const index = i % colors.length + (shows.length % colors.length < 2 && i >= colors.length) * 2;
    return shows.length >= 1 ? (shows[i]?.color ?? colors[index]) : '#313132';
}
