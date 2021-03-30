import React, { useState, useEffect, useMemo } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import { BrowserRouter, Route, NavLink, Link, Redirect } from 'react-router-dom';
import RegisterUser from './RegisterUser';
import ManageWheels from './ManageWheels';
import AccessRequests from './AccessRequests';
import WheelPage from './WheelPage';
import ManageWheel from './ManageWheel';
import SignIn from './SignIn';
import { ReactComponent as HamburgerMenuIcon } from '../icons/hamenu.svg';
import { ReactComponent as SettingsIcon } from '../icons/settings.svg';

export default function PageRenderer() {
    const [user, userLoading] = useAuthState(auth);

    const [wheelTitles, setWheelTitles] = useState({});
    const [wheelIcons, setWheelIcons] = useState({});

    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = useMemo(() => userData?.wheels || [], [userData]);

    // Load wheel titles and icons
    useEffect(() => {
        for (const wheelId of wheels) {
            if (!wheelTitles[wheelId] || !wheelIcons[wheelId]) {
                // Prevent duplicate requests by setting the props to a truthy value;
                if (!wheelTitles[wheelId]) wheelTitles[wheelId] = 'Loading...';
                if (!wheelIcons[ wheelId]) wheelIcons[ wheelId] = 'Loading...';

                firestore.collection('wheels').doc(wheelId).get().then(snap => {
                    if (!snap.exists) return;
                    const { title, icon } = snap.data();
                    setWheelTitles(prev => ({ ...prev, [wheelId]: title }));
                    setWheelIcons( prev => ({ ...prev, [wheelId]: icon  }));
                });
            }
        }
    }, [wheels.length, wheelIcons, wheelTitles, wheels]);

    const passWheelId = func => (({ location }) => func(location.pathname.match(/[^/]*$/)[0]));

    return (
        <BrowserRouter>
            <div className='page-wrapper'>
                <Route path='/' render={user && userData && passWheelId(selectedWheelId => (
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
                        <Route path='/' render={() => !user && !userLoading && <Redirect to='/sign_in' />} />
                        <Route path='/sign_in' render={() => !user || userDataLoading ? <SignIn /> : <Redirect to={`/wheels/${wheels[0]}`} />} />
                        <Route path='/' render={() => user && !userData && !userDataLoading && <Redirect to='/register' />} />
                        <Route path='/register' render={() => <RegisterUser userUid={user?.uid} userIsRegistered={!!userData} />} />

                        <Route path='/select_wheel' render={() => user && userData && (
                            <ManageWheels
                                uid={user.uid}
                                userWheels={wheels}
                                selectWheelName={name => {
                                    // setWheelName(() => name);
                                    firestore.doc(`users/${user.uid}`).update({ wheels: [...wheels, name] });
                                }}
                            />
                        )} />
                        <Route exact path='/wheels/:wheelId' render={() => user && (
                            <WheelPage userUid={user.uid} />
                        )} />
                        <Route path='/wheels/:wheelId/settings' render={() => user && (
                            <ManageWheel
                                userUid={user.uid}
                                resetWheelName={() => /* ?? setWheelName(noWheelName) */null}
                            />
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
                        <button className={`wheel-button ${wheelId === selectedWheelId ? 'selected' : ''}`}>
                            {wheelIcons[wheelId] ?
                                <img src={wheelIcons[wheelId]} alt={iconTitle(wheelTitles[wheelId])} /> :
                                <span className='icon-title'>{iconTitle(wheelTitles[wheelId])}</span>}
                            {wheelId === selectedWheelId && (
                                <Link to={`/wheels/${wheelId}/settings`}>
                                    <span className='settings-button'><SettingsIcon /></span>
                                </Link>
                            )}
                        </button>
                    </NavLink>
                ))}
                <NavLink to='/select_wheel'>
                    <button className='wheel-button add-new'><span className='icon-title'>+</span></button>
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
                {selectedWheelId && user && <AccessRequests wheelName={selectedWheelId} userUid={user?.uid} />}
            </div>
            <h1>{websiteTitle}</h1>
            <div className="export-import">
                <SignOut />
            </div>
        </header>
    )
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
