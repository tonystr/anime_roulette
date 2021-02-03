import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';

const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

export { monthNames };

const parseShowTitle = name => {
    const match = name.match(/(\s*\(\d+\)\s*$)/);
    if (match) {
        return name.slice(0, match.index).trim();
    }
    return name.trim();
}

export default function ShowInpsectorModal({ show, updateShowProp, users, beginWatching = null, ...props }) {
    const findUser = uuid => users.find(u => u.uuid === uuid);

    return (
        <ReactModal
            className='show-inspector modal-screen'
            ariaHideApp={false}
            {...props}
        >
            {show && (<>
                <h2 className='title'>
                    <input
                        className='show-name'
                        defaultValue={show.name}
                        onChange={e => {
                            updateShowProp(show, 'name',  e.target.value);
                            updateShowProp(show, 'title', parseShowTitle(e.target.value));
                        }}
                    />
                    {beginWatching ? (
                        <button className='begin-wating' onClick={beginWatching}>Start watching</button>
                    ) : (
                        <select
                            className='state'
                            defaultValue={show.state}
                            onChange={e => updateShowProp(show, 'state', e.target.value)}
                        >
                            <option>Watching</option>
                            <option>Completed</option>
                            <option>Dropped</option>
                        </select>
                    )}
                </h2>
                <div className='middle' style={!show.banner ? { backgroundColor: show.color } : null}>
                    {show.banner && <img className='banner' alt='banner' src={show.banner} />}
                    <input
                        className={'banner-url hover-input ' + (show.banner ? '' : 'visible')}
                        type='text'
                        placeholder='Insert banner url...'
                        onKeyDown={e => e.key === 'Enter' && e.target.value && updateShowProp(show, 'banner', e.target.value)}
                        onBlur={e => e.target.value && updateShowProp(show, 'banner', e.target.value)}
                    />
                    <div className='buttons-overlay'>
                        {show.color && <button onClick={() => updateShowProp(show, 'color', null)} className='clear-color' title='Clear color'></button>}
                        <ColorInput
                            value={show.color ?? '#8b4049'}
                            updateValue={value => updateShowProp(show, 'color', value)}
                        />
                    </div>
                </div>
                {show.state === 'Watching' && (
                    <div className='links'>
                        {show.watchingUrl && <span>Watching at <a href={show.watchingUrl} rel="noreferrer" target='_blank'>{(show.watchingUrl.match(/\w+(\.\w+)+/) || [])[0]}</a></span>}
                        <input
                            className={'watching-url hover-input ' + (show.watchingUrl ? '' : 'visible')}
                            type='text'
                            placeholder={`${show.watchingUrl ? 'Replace' : 'Insert'} watching url...`}
                            onKeyDown={e => e.key === 'Enter' && e.target.value && updateShowProp(show, 'watchingUrl', e.target.value)}
                            onBlur={e => e.target.value && updateShowProp(show, 'watchingUrl', e.target.value)}
                        />
                    </div>
                )}
                <div className='bottom'>
                    <div className='owner-field'>
                        Suggested by&nbsp;
                        <span className='user'>
                            <select
                                className='user-select'
                                value={show.owner?.uuid || show.owner}
                                onChange={e => e.target.value && updateShowProp(
                                    show,
                                    'owner',
                                    e.target.value
                                )}
                            >
                                {users.map(user => <option key={user.uuid} value={user.uuid}>{user.name}</option>)}
                            </select>
                            {show.owner?.name || findUser(show.owner)?.name}
                        </span>
                    </div>
                    {show.date && (
                        <div className='date'>
                            {!beginWatching && 'Started watching at'}&nbsp;
                            <span className='date-string'>
                                <input type='date' defaultValue={show.date.toLocaleDateString('en-CA')} onChange={e => updateShowProp(show, 'date', new Date(e.target.value))} />
                                {show.date.getDate()}&nbsp;
                                {monthNames[show.date.getMonth()]}.&nbsp;
                                {show.date.getFullYear()}
                            </span>
                        </div>
                    )}
                </div>
            </>)}
        </ReactModal>
    );
};

function ColorInput({ value, updateValue }) {
    const [localValue, setLocalValue] = useState(value);
    const [focus, setFocus] = useState(false);

    useEffect(() => {
        if (localValue === value) return;

        if (!focus) {
            setLocalValue(() => value);
            return;
        }

        const timer = setTimeout(() => {
            updateValue(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, value, focus, updateValue]);

    return (
        <div className='color-picker' style={localValue ? { backgroundColor: localValue } : null}>
            <input
                value={localValue}
                onChange={e => setLocalValue(() => e.target.value)}
                type='color'
                onFocus={() => setFocus(() => true)}
                onBlur={() => setFocus(() => false)}
            />
        </div>
    );
}
