import React, { useState, useEffect } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import { BrowserRouter, Route, NavLink, Redirect } from 'react-router-dom';
import RegisterUser from './RegisterUser';
import ManageWheels from './ManageWheels';
import AccessRequests from './AccessRequests';
import WheelPage from './WheelPage';
import ManageWheel from './ManageWheel';
import SignIn from './SignIn';
import { ReactComponent as HamburgerMenuIcon } from '../icons/hamenu.svg';


/*
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
                userUid={user.uid}
                users={users}
            />
        );
    }
*/

export default function PageRenderer() {
    const noWheelName = 'Select wheel';
    const [user, userLoading] = useAuthState(auth);

    const [wheelTitles, setWheelTitles] = useState({});
    const [wheelIcons, setWheelIcons] = useState({});

    const [manageWheel, setManageWheel] = useState(false);
    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = userData?.wheels || [];

    // Load wheel titles and icons
    useEffect(() => {
        for (const wheelId of wheels) {
            if (!wheelTitles[wheelId] || !wheelIcons[wheelId]) {
                firestore.collection('wheels').doc(wheelId).get().then(snap => {
                    if (!snap.exists) return;
                    const { title, icon } = snap.data();
                    if (title) setWheelTitles(prev => ({ ...prev, [wheelId]: title }));
                    if (icon) setWheelIcons(prev => ({ ...prev, [wheelId]: icon }));
                });
            }
        }
    }, [wheels.length]);

    const passWheelId = func => (({ location }) => func(location.pathname.match(/[^\/]*$/)[0]));

    return (
        <BrowserRouter>
            <div className='page-wrapper'>
                <Route path='/' render={user && passWheelId(selectedWheelId => (
                    <Aside
                        wheels={wheels}
                        wheelIcons={wheelIcons}
                        wheelTitles={wheelTitles}
                        selectedWheelId={selectedWheelId}
                    />
                ))} />
                <div className='main-content'>
                    <Route path='/' render={passWheelId(selectedWheelId => (
                        <Header
                            user={user}
                            selectedWheelId={selectedWheelId}
                            wheelTitle={wheelTitles[selectedWheelId] || selectedWheelId}
                        />
                    ))} />
                    <main>
                        <Route path='/' render={() => !user && !userLoading ? <Redirect to='/sign_in' /> : null} />
                        <Route path='/sign_in' render={() => !user || userDataLoading ? <SignIn /> : <Redirect to={`/wheels/${wheels[0]}`} />} />
                        <Route path='/select_wheel' render={() => user && userData ? (
                            <ManageWheels
                                uid={user.uid}
                                userWheels={wheels}
                                selectWheelName={name => {
                                    // setWheelName(() => name);
                                    firestore.doc(`users/${user.uid}`).update({ wheels: [...wheels, name] });
                                }}
                            />
                        ) : <Redirect to='/' />} />
                        <Route path='/wheels/:wheelId' render={() => user && (
                            <WheelPage userUid={user.uid} />
                        )} />
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
};

function Aside({ wheels, wheelIcons, wheelTitles, selectedWheelId }) {
    const [showAside, setShowAside] = useState(true);

    const iconTitle = title => (title || '???').replace(/\W*(\w)\w+\W*/g, '$1').toUpperCase();

    return (
        <aside className={showAside ? '' : 'hidden'}>
            <div className='hamburger'>
                <HamburgerMenuIcon width='24' height='24' onClick={() => setShowAside(prev => !prev)} />
            </div>
            <div className='content'>
                {wheels.map(wheelId => (
                    <NavLink key={wheelId} to={`/wheels/${wheelId}`}>
                        <div
                            className={`wheel-button ${wheelId === selectedWheelId ? 'selected' : ''}`}
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

function Header({ user, selectedWheelId, wheelTitle }) {
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
                <AccessRequests wheelName={selectedWheelId} userUid={user?.uid} />
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
