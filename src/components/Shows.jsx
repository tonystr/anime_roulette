import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { ReactComponent as UserIcon  } from '../icons/user.svg';
import ShowInpsectorModal from './ShowInspectorModal';
import AddNewButton from './AddNewButton';

export default function Shows({ users, shows, removeShow, addHistory, updateShowProp, addShow, colors, wheelName, userUid, ...props }) {
    const [showUsers, setShowUsers] = useState(false);
    const [inspectingShow, setInspectingShow] = useState(null);

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;
        updateShowProp(show.uuid, prop, value);
        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    const renderShows = show => (
        <div className='show' key={show.uuid}>
            <ShowInput
                show={show}
                value={show.name}
                style={{ borderLeftColor: pickColor(shows.findIndex(s => s === show), colors, shows) }}
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

    return (
        <div {...props}>
            <div className='shows-list'>
                <div className='top-bar'>
                    <h2>Shows</h2>
                    <button className='show-users-button' onClick={() => setShowUsers(prev => !prev)}><UserIcon /></button>
                </div>
                {showUsers ?
                    <UserShows shows={shows} users={users} renderShows={renderShows} addShow={addShow} /> :
                    [shows && shows.map(renderShows), <AddNewButton key={'global add new button'} user={userUid} addShow={addShow} disabled={testLimit(shows)} />]}
            </div>
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

function testLimit(shows) {
    return shows.length >= 24;
}

function UserShows({ users, shows, renderShows, addShow }) {
    return users.map((user, i) => (
        <div className='user-shows' key={user.name}>
            <h3 key={'h3 ' + user.name} className={i === 0 ? 'first-h3' : ''}>{user.name}</h3>
            {shows && shows
                .filter(show => show.owner === user.uuid)
                .map(renderShows)}
            <AddNewButton key={'add new button ' + user.name} user={user} addShow={addShow} disabled={testLimit(shows)}  />
        </div>
    ));
}

function pickColor(i, colors, shows) {
    const index = i % colors.length + (shows.length % colors.length < 2 && i >= colors.length) * 2;
    return shows.length >= 1 ? (shows[i]?.color ?? colors[index]) : '#313132';
}
