import React, { useState, useEffect, useMemo } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import RegisterUser from './RegisterUser';
import ManageWheels from './ManageWheels';
import AccessRequests from './AccessRequests';
import WheelPage from './WheelPage';
import ManageWheel from './ManageWheel';
import SignIn from './SignIn';
import Aside from './Aside';

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

                        <Route path='/select_wheel' render={({ history }) => user && userData && (
                            <ManageWheels
                                uid={user.uid}
                                userWheels={wheels}
                                selectWheelName={name => {
                                    history.push(`/wheels/${name}`);
                                    firestore.doc(`users/${user.uid}`).update({ wheels: [...wheels, name] });
                                }}
                            />
                        )} />
                        <Route exact path='/wheels/:wheelId' render={() => user && (
                            <WheelPage userUid={user.uid} />
                        )} />
                        <Route path='/wheels/:wheelId/settings' render={({ history }) => user && (
                            <ManageWheel
                                userUid={user.uid}
                                redirect={history.push}
                            />
                        )} />
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
};

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
