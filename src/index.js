import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
// Components
import ManageWheels from './components/ManageWheels';
import AccessRequests from './components/AccessRequests';
import ManageWheel from './components/ManageWheel';
import WheelPage from './components/WheelPage';

import FacebookLogo from './icons/facebook_logo.png';
import GoogleLogo from './icons/google_logo.png';
import firestore, { firebase, auth, useDocumentData, useAuthState } from './firestore';
import './index.scss';
import reportWebVitals from './reportWebVitals';

function SignIn() {
    return (
        <div className='sign-in-panel'>
            <h2>Sign in with</h2>

            <button className='sign-in google' onClick={() => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithRedirect(provider);
            }}>
                <img alt='Google Logo' className='google-logo' src={GoogleLogo} width={50} height={50} />
                Google
            </button>

            <button className='sign-in facebook' onClick={() => {
                const provider = new firebase.auth.FacebookAuthProvider();
                auth.signInWithRedirect(provider);
            }}>
                <img alt='Facebook Logo' className='facebook-logo' src={FacebookLogo} width={50} height={50} />
                Facebook
            </button>
        </div>
    );
}

function SignOut({ className='', ...props }) {
    return auth.currentUser && (
        <button {...props}
            className={'clickable-faded ' + className}
            onClick={() => auth.signOut()}
        >Sign out</button>
    );
}

function RegisterUser({ userUid }) {
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

        console.log(firestore.collection('users').doc(userUid));

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
}

function PageRenderer() {
    const noWheelName = 'Select wheel';
    const [wheelName, setWheelName] = useState(() => localStorage.getItem('wheel-name') || noWheelName);
    const [user, userLoading] = useAuthState(auth);
    const [wheelTitles, setWheelTitles] = useState({});
    const [manageWheel, setManageWheel] = useState(false);

    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = userData?.wheels || [];

    useEffect(() => {
        for (const wheelId of wheels) {
            if (!wheelTitles[wheelId]) {
                firestore.collection('wheels').doc(wheelId).get().then(snap => {
                    if (!snap.exists) return;
                    setWheelTitles(prev => ({ ...prev, [wheelId]: snap.data().title }));
                });
            }
        }
    }, [wheels.length]);

    const [wheel, wheelLoading] = useDocumentData(firestore.collection('wheels').doc(wheelName));

    const wheelTitle = 'Anime Roulette' || 'Roulette Wheel';

    useEffect(() => {
        localStorage.setItem('wheel-name', wheelName);
    }, [wheelName]);

    const renderPage = () => {
        const loadingDiv = <div className='loading'>Loading...</div>;
        if (userLoading || wheelLoading || userDataLoading) return loadingDiv;
        if (!user) return <SignIn />;
        if (!userData) return <RegisterUser userUid={user.uid} />
        if (wheels.length < 1 || !wheel || !wheel?.users?.includes(user.uid)) {
            return (
                <ManageWheels uid={user.uid} noWheels={wheels.length < 1} userWheels={wheels} selectWheelName={name => {
                    setWheelName(() => name);
                    firestore.collection('users').doc(user.uid).update({ wheels: [...wheels, name] });
                }} />
            );
        }
        if (manageWheel && user?.uid) {
            return <ManageWheel escape={() => setManageWheel(() => false)} userUid={user.uid} wheelId={wheelName} resetWheelName={() => setWheelName(noWheelName)} />
        }
        return (
            <WheelPage
                wheelName={wheelName}
                userUid={user.uid}
            />
        );
    }

    return (
        <div>
            <header>
                <div className='wheel-meta'>
                    {user && (
                        <div className='wheel-name'>
                            <span className='select clickable-faded'>
                                {wheelTitles[wheelName] || wheelName}
                                <select value={wheelName} onChange={e => setWheelName(() => e.target.value)}>
                                    <option>{noWheelName}</option>
                                    {wheels.map(wheelId => <option key={wheelId} value={wheelId}>{wheelTitles[wheelId]}</option>)}
                                </select>
                            </span>
                            <span className='faded'>
                                <span className='colorized'>|</span>
                                <button onClick={() => setManageWheel(prev => !prev)} className='clickable-faded manage-wheel'>
                                    manage
                                </button>
                            </span>
                        </div>
                    )}
                    <AccessRequests wheelName={wheelName} userUid={user?.uid} />
                </div>
                <h1>{wheelTitle}</h1>
                <div className="export-import">
                    <SignOut />
                </div>
            </header>
            {renderPage()}
        </div>
    );
}

ReactDOM.render(
    <React.StrictMode>
        <PageRenderer />
    </React.StrictMode>,
    document.getElementById('root')
);

// reportWebVitals(console.log) || https://bit.ly/CRA-vitals
reportWebVitals();
