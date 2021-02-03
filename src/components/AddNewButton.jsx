import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function AddNewButton({ user, addShow, disabled=false, disabledMessage='Show limit reached (24)' }) {
    const [add, setAdd] = useState('');

    const parseShowTitle = name => {
        const match = name.match(/(\s*\(\d+\)\s*$)/);
        if (match) {
            return name.slice(0, match.index).trim();
        }
        return name.trim();
    }

    const addNew = () => {
        addShow({
            name: add.trim(),
            title: parseShowTitle(add),
            uuid: uuidv4(),
            owner: user.uuid || user,
            date: new Date()
        });
        setAdd(() => '');
    };

    return disabled ? (
        <div className='add-new disabled'>
            {disabledMessage}
        </div>
    ) : (
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
