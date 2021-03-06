import React, { useState } from 'react';
import ShowInpsectorModal, { monthNames } from './ShowInspectorModal';
import firestore from '../firestore';

export default function History({ users, shows, history, wheelId, userCanEdit, ...props }) {
    const [inspectingShow, setInspectingShow] = useState(null);

    const deleteShow = uuid => firestore.doc(`wheels/${wheelId}/history/${uuid}`).delete();

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;

        firestore.doc(`wheels/${wheelId}/history/${show.uuid}`).update({ [prop]: value })

        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    const parseShowTitle = name => {
        const match = name.match(/(\s*\(\d+\)\s*$)/);
        if (match) {
            return name.slice(0, match.index).trim();
        }
        return name.trim();
    }

    return (
        <div>
            <div {...props}>
                <h2>History</h2>
                <div className='list'>
                    {[...history].reverse().map(show => (
                        <div key={show.uuid} className='show' onClick={() => setInspectingShow(show)}>
                            <span className='title'>{show?.title ?? parseShowTitle(show.name)}</span>
                            <span className='date'>
                                - {show.date.getDate()} {monthNames[show.date.getMonth()]}.
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {userCanEdit && <ShowInpsectorModal
                isOpen={!!inspectingShow}
                onRequestClose={() => setInspectingShow(null)}
                show={inspectingShow}
                updateShowProp={updateInspectingShowProp}
                deleteShow={deleteShow}
                users={users}
            />}
        </div>
    );
}
