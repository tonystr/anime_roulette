import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function AddNewButton({ user, addShow }) {
    const [add, setAdd] = useState('');

    const addNew = () => {
        addShow({
            name: add,
            uuid: uuidv4(),
            owner: user.uuid || user,
            date: new Date()
        });
        setAdd(() => '');
    };

    return (
        <input
            type='text'
            className='show add-new'
            placeholder='Add Show +'
            value={add}
            onChange={e => setAdd(() => e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add && addNew()}
            onBlur={e => add && addNew()}
        />
    );
};