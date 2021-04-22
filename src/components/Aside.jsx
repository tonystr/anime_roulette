import React, { useState } from 'react';
import { ReactComponent as HamburgerMenuIcon } from '../icons/hamenu.svg';
import { ReactComponent as SettingsIcon } from '../icons/settings.svg';
import { ReactComponent as LeaveIcon } from '../icons/logout.svg';
import { NavLink, Link } from 'react-router-dom';
import firestore, { useDocumentData, auth } from '../firestore';

function SignOut({ className='', ...props }) {
    return auth.currentUser ? (
        <button
            {...props}
            className={'clickable-faded ' + className}
            onClick={() => auth.signOut()}
        >
            Sign out
        </button>
    ) : null;
}

function WheelButton({ wheelId, wheelIcon, wheelTitle, selected, isOwner=false, ownerLoading=false }) {
    const iconTitle = title => (title || '???').replace(/\W*(\w)\w+\W*/g, '$1').toUpperCase();

    return (
        <div className='wheel-button-wrapper'>
            <div className='title'>{wheelTitle}</div>
            <button className={`wheel-button ${selected ? 'selected' : ''}`}>
                {wheelIcon && wheelIcon !== 'Loading...' ?
                    <img src={wheelIcon} alt={iconTitle(wheelTitle)} /> :
                    <span className='icon-title'>{iconTitle(wheelTitle)}</span>}
                {selected && !ownerLoading && (
                    isOwner ? (
                        <Link to={`/wheels/${wheelId}/settings`}>
                            <span className='sub-button settings'><SettingsIcon /></span>
                        </Link>
                    ) : (
                        <span className='sub-button leave'><LeaveIcon /></span>
                    )
                )}
            </button>
        </div>
    );
}

export default function Aside({ wheels, wheelIcons, wheelTitles, selectedWheelId, userUid }) {
    const [showAside, setShowAside] = useState(true);
    const [wheel, wheelLoading] = useDocumentData(firestore.doc(`wheels/${selectedWheelId || 'UNDEFINED'}`));

    return (
        <aside className={showAside ? '' : 'hidden'}>
            <div className='hamburger'>
                <HamburgerMenuIcon width='24' height='24' onClick={() => setShowAside(prev => !prev)} />
            </div>
            <div className='content'>
                {wheels.map(wheelId => wheelId === selectedWheelId ? (
                    <WheelButton
                        key={wheelId}
                        wheelId={wheelId}
                        wheelIcon={wheelIcons[wheelId]}
                        wheelTitle={wheelTitles[wheelId]}
                        selected={wheelId === selectedWheelId}
                        isOwner={userUid && wheel?.owner === userUid}
                        ownerLoading={wheelLoading}
                    />
                ) : (
                    <NavLink key={wheelId} to={`/wheels/${wheelId}`}>
                        <WheelButton
                            wheelId={wheelId}
                            wheelIcon={wheelIcons[wheelId]}
                            wheelTitle={wheelTitles[wheelId]}
                            selected={wheelId === selectedWheelId}
                        />
                    </NavLink>
                ))}
                <NavLink to='/select_wheel'>
                    <button className='wheel-button add-new'><span className='icon-title'>+</span></button>
                </NavLink>
            </div>
            <div className='bottom'>
                <SignOut />
            </div>
        </aside>
    );
}
