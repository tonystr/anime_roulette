import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import firestore from '../firestore';

export default function RegisterUser({ userUid, userIsRegistered }) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const registerUsername = () => {
        if (!username) {
            setError(() => 'Please enter a username');
            return;
        }

        if (!username.match(/^[\w\s]+$/)) {
            setError(() => 'Username must only include word characters (a-z, 0-9, _)');
            return;
        }

        if (username.toLowerCase() === 'tony' || username.toLowerCase() === 'tonystr') {
            setError(() => 'There can only be one Tony');
            return;
        }

        firestore.collection('users').doc(userUid).set({
            name: username.trim()
        }).catch(err => {
            setError(() => 'Error registering username.');
            console.log(err);
        });
    };

    if (!userUid) {
        return <div>Error: no user ID found</div>
    }

    return (
        <div className='register-user page-form'>
            {userIsRegistered && <Redirect to='/select_wheel' />}
            <h2>Welcome to anime roulette! Please register a username</h2>
            <div>
                <label htmlFor='register-username'>Username:</label>
                <input
                    type='text'
                    id='register-username'
                    value={username}
                    onChange={e => {
                        setUsername(() => e.target.value);
                        setError(() => '');
                    }}
                    onKeyDown={key => key === 'Enter' && registerUsername()}
                />
                <button onClick={registerUsername}>Register</button>
            </div>
            <div className='error'>{error}</div>
            <div className='faded'>
                (This can not be changed later, and the username is visible to other users)
            </div>
        </div>
    );
};
