import React, { useState, useEffect, useMemo } from 'react';
import firestore, { auth, useDocumentData, useAuthState } from '../firestore';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import Aside from './Aside';
import Header from './Header';
import SignIn from './SignIn';
import RegisterUser from './RegisterUser';
import ManageWheels from './ManageWheels';
import WheelPage from './WheelPage';
import WheelSettings from './WheelSettings';

export default function PageRenderer() {
    const [user, userLoading] = useAuthState(auth);
    const [wheelTitles, setWheelTitles] = useState({});
    const [wheelIcons, setWheelIcons] = useState({});
    const [userData, userDataLoading] = useDocumentData(firestore.collection('users').doc(user?.uid || 'UNDEFINED'));
    const wheels = useMemo(() => userData?.wheels || [], [userData]);

    // Load wheel titles and icons
    useEffect(() => {
        const titlesToUpdate = {};
        const iconsToUpdate = {};
        for (const wheelId of wheels) {
            if (!wheelTitles[wheelId] || !wheelIcons[wheelId]) {
                // Prevent duplicate requests by setting the props to a truthy value;

                if (!wheelTitles[wheelId]) titlesToUpdate[wheelId] = 'Loading...';
                if (!wheelIcons[ wheelId]) iconsToUpdate[ wheelId] = 'Loading...';

                firestore.collection('wheels').doc(wheelId).get().then(snap => {
                    if (!snap.exists) {
                        setWheelTitles(prev => ({ ...prev, [wheelId]: 'Unknown Wheel' }));
                        setWheelIcons( prev => ({ ...prev, [wheelId]: null }));
                        console.error('Wheel/wheelId not exist when getting wheel titles and icons');
                        return;
                    }
                    const { title, icon } = snap.data();
                    setWheelTitles(prev => ({ ...prev, [wheelId]: title }));
                    setWheelIcons( prev => ({ ...prev, [wheelId]: icon  }));
                });
            }
        }
        if (Object.keys(titlesToUpdate).length) setWheelTitles(prev => ({ ...prev, ...titlesToUpdate }));
        if (Object.keys( iconsToUpdate).length)  setWheelIcons(prev => ({ ...prev,  ...iconsToUpdate }));
    }, [wheels.length, wheels]); // eslint-disable-line

    const passWheelId = func => ({ location }) => func(location.pathname.match(/[^/]*$/)[0]);

    const leaveWheel = wheelId => {
        if (!user.uid || !wheels || !wheels.length) return;
        firestore.doc(`users/${user.uid}`).update({ wheels: wheels.filter(w => w !== wheelId) });
    };

    return (
        <BrowserRouter>
            <div className='page-wrapper'>
                <Route path='/' render={user && userData && passWheelId(selectedWheelId => (
                    <Aside
                        wheels={wheels}
                        wheelIcons={wheelIcons}
                        wheelTitles={wheelTitles}
                        selectedWheelId={selectedWheelId}
                        userUid={user?.uid}
                        leaveWheel={leaveWheel}
                    />
                ))} />
                <div className='main-content'>
                    <Route path='/' render={passWheelId(selectedWheelId => (
                        <Header
                            user={user}
                            selectedWheelId={selectedWheelId}
                            wheelTitle={wheels.includes(selectedWheelId) ? wheelTitles[selectedWheelId] : 'Anime Roulette'}
                        />
                    ))} />
                    <main>
                        <Route path='/' render={() => !user && !userLoading && <Redirect to='/sign_in' />} />
                        <Route path='/sign_in' render={() => !user || userDataLoading ? <SignIn /> : <Redirect to={`/wheels/${wheels[0]}`} />} />
                        <Route path='/' render={() => user && !userData && !userDataLoading && <Redirect to='/register' />} />
                        <Route path='/register' render={() => <RegisterUser userUid={user?.uid} userIsRegistered={!!userData} />} />

                        <Route exact path={['/select_wheel', '/']} render={({ history }) => user && userData && (
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
                            <WheelPage userUid={user.uid} wheels={wheels} />
                        )} />
                        <Route path='/wheels/:wheelId/settings' render={({ history }) => user && (
                            <WheelSettings
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
