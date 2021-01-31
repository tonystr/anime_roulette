import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
// Components
import Wheel   from './components/Wheel.jsx';
import Shows   from './components/Shows.jsx';
import History from './components/History.jsx';

import FacebookLogo from './icons/facebook_logo.png';
import GoogleLogo from './icons/google_logo.png';
import firestore, { firebase, auth } from './firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import './index.scss';
import reportWebVitals from './reportWebVitals';

function translateCDDates([ array=[] ]) {
    return array.map(h => ({ ...h, date: h.date.toDate ?
        h.date.toDate() :
        new Date(h.date)
    }));
}

function WheelPage({ wheelName, setWheelName, userUid }) {
    const [users, setUsers] = useState(() => [
        { name: 'Tony'  , uuid: 'ZO1t12VfzKfA3z4DSRkhwH8Hghu2' },
        { name: 'Espen' , uuid: 'ArklXKxySSfXCn1JQHcYBiBJrbp1' },
        { name: 'Jørgen', uuid: 'DiOHXZRe7iP7FHxkG7xEigQoLFF3' },
        { name: 'Sigurd', uuid: '9893123siggurdnouuidda!2121x' }
    ]);

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

    return (
        <main id='home' role='main'>
            <Shows   className='left   shows'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} addShow={addShow} setUsers={setUsers} wheelName={wheelName} userUid={userUid} />
            <Wheel   className='center wheel'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} wheelName={wheelName} />
            <History className='right  history' users={users} shows={shows} history={history} updateHistoryProp={updateHistoryProp} />
        </main>
    );
}

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

function convertWheelName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
}

function ManageWheels({ uid, selectWheelName, userWheels=[], noWheels=false }) {
    const [requestName, setRequestName] = useState('');
    const [ownName, setOwnName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [requestDisabled, setRequestDisabled] = useState(true);
    const [ownDisabled, setOwnDisabled] = useState(true);

    const requestAccess = () => {
        if (requestDisabled) return;
        const docRef = firestore.collection('wheels').doc(requestName);
        docRef.get().then(docSnap => {
            if (!docSnap.exists) {
                setError(() => 'Wheel does not exist. Check your spelling.');
                return;
            }

            const accessRequests = docSnap.data()?.accessRequests || [];

            if (accessRequests.includes(uid)) {
                setError(() => 'You have already requested access to this wheel. Wait for the owner to accept.');
                return;
            }

            docRef.update({
                accessRequests: [...accessRequests, uid]
            });

            setError(() => '');
            setSuccess(() => `Successfully requested access to ${requestName}. Wait for the owner to accept your request.`);
            selectWheelName(requestName);

            console.log('Requested access to join wheel.');
        });
    };

    const createWheel = () => {
        if (ownDisabled) return;
        const ownConverted = convertWheelName(ownName);
        if (!ownConverted) {
            setError(() => 'Invalid name. Check your input.');
            return;
        }
        const title = ownName.trim();
        firestore.collection('wheels').doc(ownConverted).set({
            title,
            owner: uid,
            rotate: {
                date: new Date(),
                endDate: +(new Date()),
                offset: Math.PI,
                rng: 0,
                spinning: false
            },
            users: [uid]
        });
        firestore.collection('users').doc(uid).update({
            wheels: [...userWheels, ownConverted]
        });
        selectWheelName(ownConverted);
    };

    useEffect(() => {
        if (requestDisabled === !requestName) return;
        setRequestDisabled(() => !requestName);
    }, [requestName, requestDisabled]);

    useEffect(() => {
        if (error) setSuccess(() => '');
    }, [error]);

    useEffect(() => {
        if (!ownName) {
            setError(() => '');
            setOwnDisabled(() => true);
            return;
        }

        firestore.collection('wheels').doc(ownName).get().then(docSnap => {
            setError(() => docSnap.exists ? 'Error: Wheel name taken' : '');
            setOwnDisabled(() => docSnap.exists);
        });

    }, [ownName]);

    return (
        <div className='no-wheels page-form'>
            <h2>{noWheels ? 'You don\'t have access to any wheels' : 'Select a wheel from the top-left menu, or'}</h2>
            <div>
                <label htmlFor='request-access'>Request access:</label>
                <input
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    type='text'
                    id='request-access'
                    placeholder='Wheel name'
                    onKeyDown={e => e.key === 'Enter' && requestAccess()}
                />
                <button type='submit' className={requestDisabled ? 'disabled' : ''} onClick={requestAccess}>Request</button>
            </div>
            <div className='or'>or</div>
            <div>
                <label htmlFor='make-your-own'>Make your own:</label>
                <input
                    value={ownName}
                    placeholder='Wheel name'
                    onChange={e => setOwnName(e.target.value)}
                    type='text'
                    id='make-your-own'
                    onKeyDown={e => e.key === 'Enter' && createWheel()}
                />
                <button type='submit' className={ownDisabled ? 'disabled' : ''} onClick={createWheel}>Create</button>
            </div>
            <div className='error'>{error}</div>
            <div className='success'>{success}</div>
        </div>
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

function AccessRequests({ wheelName, userUid }) {
    const [userNames, setUserNames] = useState({});

    const [wheel] = useDocumentData(firestore.doc(`wheels/${wheelName}`));
    const requests = wheel?.accessRequests;
    const wheelOwner = wheel?.owner;

    useEffect(() => {
        if (!requests) return;
        for (const uuid of requests) {
            if (userNames[uuid] !== undefined) continue;
            firestore.doc(`users/${uuid}`).get().then(docSnap => {
                if (!docSnap.exists) {
                    console.log('not exists');
                    return;
                }
                setUserNames(prev => ({ ...prev, [uuid]: docSnap.data().name }))
            }).catch(console.error);
        }
    }, [requests, userNames]);

    const accept = uuid => {
        const newRequests = requests.filter(user => user !== uuid);
        firestore.doc(`wheels/${wheelName}`).update({
            accessRequests: newRequests,
            users: [...wheel.users, uuid]
        });
    };

    const reject = uuid => {
        const newRequests = requests.filter(user => user !== uuid);
        firestore.doc(`wheels/${wheelName}`).update({
            accessRequests: newRequests
        });
    };

    return userUid !== null && userUid === wheelOwner && requests ? (
        <div className='access-requests'>
            {requests.map(uuid => (
                <div key={uuid} className='request'>
                    {userNames[uuid] ? <span className='username'>{userNames[uuid]}</span> : 'Someone'}
                    &nbsp;is requesting access to this wheel.
                    <button className='blop' onClick={() => accept(uuid)}>Accept</button> /
                    <button className='blop' onClick={() => reject(uuid)}>Deny  </button>
                </div>
            ))}
        </div>
    ) : null;
}

function ManageWheel({ escape }) {
    return (
        <div>
            <h2>Manage wheel</h2>
            <button onClick={escape}>Escape</button>
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
        if (manageWheel) {
            return <ManageWheel escape={() => setManageWheel(() => false)} />
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
                                {wheelTitles[wheelName]}
                                <select value={wheelName} onChange={e => setWheelName(() => e.target.value)}>
                                    <option>{noWheelName}</option>
                                    {wheels.map(wheelId => <option key={wheelId} value={wheelId}>{wheelTitles[wheelId]}</option>)}
                                </select>
                            </span>
                            <span className='faded'>
                                <span className='colorized'>|</span>
                                <button onClick={() => setManageWheel(() => true)} className='clickable-faded manage-wheel'>
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
