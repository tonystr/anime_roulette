import React, { useState, useEffect } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import RegisterUser from './RegisterUser';
import ManageWheels from './ManageWheels';
import AccessRequests from './AccessRequests';
import WheelPage from './WheelPage';
import ManageWheel from './ManageWheel';
import SignIn from './SignIn';
import { ReactComponent as HamburgerMenuIcon } from '../icons/hamenu.svg';

export default function PageRenderer() {
    const noWheelName = 'Select wheel';
    const [wheelName, setWheelName] = useState(() => localStorage.getItem('wheel-name') || noWheelName);
    const [user, userLoading] = useAuthState(auth);
    const [wheelTitles, setWheelTitles] = useState({});
    const [manageWheel, setManageWheel] = useState(false);
    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = userData?.wheels || [];
    const [users, setUsers] = useState(() => []);
    const [wheel, wheelLoading] = useDocumentData(firestore.collection('wheels').doc(wheelName));
    const [iconUrl, setIconUrl] = useState('https://media.discordapp.net/attachments/392980753228496896/824268317949952000/unknown.png?width=112&height=113');
    const [showAside, setShowAside] = useState(true);

    const wheelTitle = 'Anime Roulette' || 'Roulette Wheel';

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

    useEffect(() => {
        if (!wheel?.users) return;
        setUsers(() => wheel.users.map(uuid => ({ name: 'User', uuid })));
        for (const uuid of wheel.users) {
            firestore.collection('users').doc(uuid).get().then(docSnap => {
                const userDoc = docSnap.data();
                const name = userDoc.name;
                setUsers(prev => prev.map(user => user.uuid === uuid ? ({ ...user, name }) : user));
            })
        }
    }, [wheel?.users]);

    useEffect(() => {
        localStorage.setItem('wheel-name', wheelName);
    }, [wheelName]);

    const renderPage = () => {
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
            if (wheel?.owner !== user.uid) {
                setManageWheel(() => false);
            } else {
                return (
                    <ManageWheel
                        escape={() => setManageWheel(() => false)}
                        userUid={user.uid}
                        wheelId={wheelName}
                        wheel={wheel}
                        resetWheelName={() => setWheelName(noWheelName)}
                        users={users}
                        iconUrl={iconUrl}
                        setIconUrl={setIconUrl}
                    />
                );
            }
        }
        return (
            <WheelPage
                wheelName={wheelName}
                userUid={user.uid}
                users={users}
            />
        );
    }

    return (
        <div className='page-wrapper'>
            <aside className={showAside ? '' : 'hidden'}>
                <div className='hamburger'>
                    <HamburgerMenuIcon width='24' height='24' onClick={() => setShowAside(prev => !prev)} />
                </div>
            </aside>
            <div className='main-content'>
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
                                {user?.uid && wheel?.owner === user.uid && (
                                    <span className='faded'>
                                        <span className='colorized'>|</span>
                                        <button onClick={() => setManageWheel(prev => !prev)} className='clickable-faded manage-wheel'>
                                            manage
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                        <AccessRequests wheelName={wheelName} userUid={user?.uid} />
                    </div>
                    <h1>{wheelTitle}</h1>
                    <div className="export-import">
                        <SignOut />
                    </div>
                </header>
                {(userLoading || wheelLoading || userDataLoading) ?
                    <div className='loading'>Loading...</div> :
                    renderPage()}
            </div>
        </div>
    );
};

function SignOut({ className='', ...props }) {
    return auth.currentUser ? (
        <button {...props}
            className={'clickable-faded ' + className}
            onClick={() => auth.signOut()}
        >
            Sign out
        </button>
    ) : null;
}
