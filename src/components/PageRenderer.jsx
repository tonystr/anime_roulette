import React, { useState, useEffect } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import { BrowserRouter, Route, Link, NavLink, Redirect } from 'react-router-dom';
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
    const [wheelIcons, setWheelIcons] = useState({});

    const [manageWheel, setManageWheel] = useState(false);
    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = userData?.wheels || [];
    const [users, setUsers] = useState(() => []);
    const [wheel, wheelLoading] = useDocumentData(firestore.collection('wheels').doc(wheelName));
    const [iconUrl, setIconUrl] = useState(null);

    // Load wheel titles and icons
    useEffect(() => {
        for (const wheelId of wheels) {
            const isSelectedWheel = wheelId === wheelName;
            if (!wheelTitles[wheelId] || !wheelIcons[wheelId] || (isSelectedWheel && wheelIcons[wheelId] !== iconUrl)) {
                firestore.collection('wheels').doc(wheelId).get().then(snap => {
                    if (!snap.exists) return;
                    const { title, icon } = snap.data();
                    if (title) setWheelTitles(prev => ({ ...prev, [wheelId]: title }));
                    if (icon) {
                        setWheelIcons(prev => ({ ...prev, [wheelId]: icon }));
                        if (isSelectedWheel) {
                            setIconUrl(() => icon);
                        }
                    }
                });
            }
        }
    }, [wheels.length, iconUrl]);

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
        setIconUrl(() => wheelIcons[wheelName]);
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
        <BrowserRouter>
            <div className='page-wrapper'>
                <Aside
                    wheels={wheels}
                    wheelIcons={wheelIcons}
                    wheelTitles={wheelTitles}
                    wheelName={wheelName}
                />
                <div className='main-content'>
                    <Header
                        user={user}
                        wheelName={wheelName}
                        wheelTitle={wheelTitles[wheelName] || wheelName}
                    />
                    <main>
                        <Route path='/select_wheel' render={() => user && userData ? (
                            <ManageWheels
                                uid={user.uid}
                                userWheels={wheels}
                                selectWheelName={name => {
                                    setWheelName(() => name);
                                    firestore.collection('users').doc(user.uid).update({ wheels: [...wheels, name] });
                                }}
                            />
                        ) : <Redirect to='/' />} />
                        <Route path='/wheels/:wheelId' render={() => (
                            <WheelPage
                                userUid={user.uid}
                                users={users}
                            />
                        )} />
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
};

function Aside({ wheels, wheelIcons, wheelTitles, wheelName }) {
    const [showAside, setShowAside] = useState(true);

    const iconTitle = title => (title || '???').replace(/\W*(\w)\w+\W*/g, '$1').toUpperCase();

    return (
        <aside className={showAside ? '' : 'hidden'}>
            <div className='hamburger'>
                <HamburgerMenuIcon width='24' height='24' onClick={() => setShowAside(prev => !prev)} />
            </div>
            <div className='content'>
                {wheels.map(wheelId => (
                    <NavLink to={`/wheels/${wheelId}`}>
                        <div
                            key={wheelId}
                            className={`wheel-button ${wheelId === wheelName ? 'selected' : ''}`}
                            onClick={null/*() => setWheelName(wheelId)*/}
                        >
                            {wheelIcons[wheelId] ?
                                <img src={wheelIcons[wheelId]} alt={iconTitle(wheelTitles[wheelId])} /> :
                                <span className='icon-title'>{iconTitle(wheelTitles[wheelId])}</span>}
                        </div>
                    </NavLink>
                ))}
                <NavLink to='/select_wheel'>
                    <div className='wheel-button add-new'><span className='icon-title'>+</span></div>
                </NavLink>
            </div>
        </aside>
    );
}

function Header({ user, wheelName, wheelTitle }) {
    const websiteTitle = true ? 'Anime Roulette' : 'Roulette Wheel';

    return (
        <header>
            <div className='wheel-meta'>
                {/*user && (
                    <div className='wheel-name'>
                        <span className='wheel-title'>
                            {wheelTitle}
                        </span>
                        {/*user?.uid && wheel?.owner === user.uid && (
                            <span className='faded'>
                                <span className='colorized'>|</span>
                                <button onClick={null/*() => setManageWheel(prev => !prev)***} className='clickable-faded manage-wheel'>
                                    manage
                                </button>
                            </span>
                        )***}
                    </div>
                )*/}
                <AccessRequests wheelName={wheelName} userUid={user?.uid} />
            </div>
            <h1>{websiteTitle}</h1>
            <div className="export-import">
                <SignOut />
            </div>
        </header>
    )
}

function Loading() {
    return <div className='loading'>Loading...</div>;
}

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
