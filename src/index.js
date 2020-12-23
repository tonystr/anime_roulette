import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import { ReactComponent as ArrowDown } from './icons/arrow_down.svg';
import { ReactComponent as UserIcon  } from './icons/user.svg';
import { v4 as uuidv4 } from 'uuid';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import './index.scss';
import reportWebVitals from './reportWebVitals';

firebase.initializeApp({
    apiKey: 'AIzaSyCKEr3NLxFL9SXJuONJONhQAZct6Yqt2AY',
    authDomain: 'anime-roulette.firebaseapp.com',
    projectId: 'anime-roulette',
    storageBucket: 'anime-roulette.appspot.com',
    messagingSenderId: '5143254771',
    appId: '1:5143254771:web:bc9f978bb85bff4cdb8986'
});
const auth = firebase.auth();
const firestore = firebase.firestore();
window.firestore = firestore;

const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

function tryParseJSON(source, test=null) {
    let json = null;
    try {
        json = JSON.parse(source);
        if (test && !test(json)) {
            return null;
        }
    } catch(err) {
        return null;
    }
    return json;
}

function parseHistory(historySauce) {
    const json = tryParseJSON(historySauce, Array.isArray);
    return json ? json.map(h => ({ ...h, date: new Date(h.date) })) : [];
}

function parseShows(showsSauce) {
    return tryParseJSON(showsSauce, Array.isArray) || [];
}

function arrayReverse(array) {
    const newArray = array.slice();
    newArray.reverse();
    return newArray;
}

function pickColor(i, colors, shows) {
    return colors[i % colors.length + (shows.length % colors.length < 2 && i >= colors.length) * 2];
}

const extendContext = (ctx, size) => ({
    ...ctx,
    translate: ctx.translate,
    drawLine(x, y, endX, endY) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    },
    drawArc(x, y, radius, startAngle, endAngle) {
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();
    },
    drawPieSlice(x, y, radius, startAngle, endAngle, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
    },
    drawPieSliceImage(x, y, radius, startAngle, endAngle, image) {
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.clip();
        ctx.translate(x, y);
        ctx.rotate((startAngle + endAngle) / 2);
        ctx.drawImage(image, 0, -image.height / 2);
        ctx.restore();
    },
    drawTextRotated(x, y, text, angle, color) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = "1.6rem -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";
        ctx.translate(x, y);
        ctx.rotate(angle);
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, -textWidth / 2, 4);
        ctx.restore();
    },
    drawWheel(shows, colors, wheelAngle = 0) {
        ctx.clearRect(0, 0, size, size);
        const half = size / 2;

        for (let i = 0; i < shows.length; i++) {
            const toRad = t => (t / shows.length) * 2 * Math.PI;
            this.drawPieSlice(
                half, half, half,
                toRad(i) - .013 + wheelAngle,
                toRad(i + 1)    + wheelAngle,
                pickColor(i, colors, shows)
            );
            const angle = toRad(i + .5) + wheelAngle;
            this.drawTextRotated(
                half + Math.cos(angle) * half / 1.9,
                half + Math.sin(angle) * half / 1.9,
                shows[i].name,
                angle
            );
        }
    }
});

function Wheel({ shows, removeShow, users, colors, addHistory, ...props }) {
    const canvasRef = useRef(null);
    const [size, setSize] = useState(960);
    const [rotate, setRotate] = useState(null);
    const [arrowColor, setArrowColor] = useState('#afb8c6');
    const [showWinner, setShowWinner] = useState(false);
    const [winner, setWinner] = useState(null);
    const [rotating, setRotating] = useState(false);

    // Draw wheel
    useEffect(() => {
        if (!canvasRef || !canvasRef.current || (rotate && rotating) || !shows) return;

        // Draw wheel
        const ctx = extendContext(canvasRef.current.getContext('2d'), size);
        ctx.drawWheel(shows, colors, rotate ? rotate.offset + rotate.rng * Math.PI * 2 : 0);

        // Set Arrow color with default state
        if (!rotate) {
            const targetIndex = Math.floor(.75 * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));
        }

    }, [canvasRef, size, rotate, rotating, shows, colors]);

    // Resize
    useEffect(() => {
        if (!canvasRef) return;

        const handleResize = e => {
            if (!canvasRef || !canvasRef.current) return;

            const parentWidth = document.getElementById('wheel-width').getBoundingClientRect().width;
            if (size !== parentWidth) {
                setSize(() => parentWidth);
            }
        }

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [canvasRef, size]);

    // Rotation
    useEffect(() => {
        if (!canvasRef || !rotate || !shows) return;

        const handleRotate = () => {
            const date = new Date();

            // Rotation end
            if (date > rotate.endDate) {
                const winnerIndex = Math.floor((1 - ((rotate.offset / (Math.PI * 2) + rotate.rng + .25) % 1)) * shows.length);
                const winnerColor = pickColor(winnerIndex, colors, shows);

                setWinner(() => ({
                    ...shows[winnerIndex],
                    date: new Date(),
                    color: winnerColor
                }));

                setShowWinner(() => true);
                setArrowColor(() => winnerColor);
                return;
            }

            let easeInOutQuint = x => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
            let time = easeInOutQuint((date - rotate.date) / (rotate.endDate - rotate.date));

            const targetIndex = Math.floor((1 - (((rotate.offset + time * (Math.PI * 2 * 13 + rotate.rng * Math.PI * 2)) / (Math.PI * 2) + .25) % 1)) * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));

            const ctx = extendContext(canvasRef.current.getContext('2d'), size);
            ctx.drawWheel(shows, colors, rotate.offset + time * (Math.PI * 2 * 13 + rotate.rng * Math.PI * 2));
        };

        if (rotating) {
            const interval = setInterval(handleRotate, 10);
            return () => clearInterval(interval);
        }
    }, [rotate, rotating, canvasRef, shows, colors, size]);

    return (
        <div {...props} id='wheel-width'>
            <div className='wheel-box'>
                <div className='arrow'>
                    <ArrowDown style={{ fill: arrowColor }} />
                </div>
                <canvas
                    id='wheel'
                    onClick={() => setRotate(prev => {
                        if (prev && rotating) return prev;

                        const date = new Date();
                        const rng = Math.random();

                        setRotating(() => true);

                        return {
                            date,
                            offset: prev ? prev.offset + prev.rng * Math.PI * 2 : 0,
                            rng,
                            endDate: +date + 8000 + rng * 1000 // 8-9 seconds after start
                        };
                    })}
                    ref={canvasRef}
                    width={size}
                    height={size}
                />
            </div>
            <div className='result'>{rotate && (winner ? winner.name : 'Spinning...')}</div>
            <ShowInpsectorModal
                isOpen={showWinner}
                onRequestClose={() => {
                    setShowWinner(() => false);
                    setRotate(() => null);
                    setWinner(() => null);
                }}
                show={rotate && winner}
                beginWatching={rotate ? () => {
                    addHistory(winner);
                    removeShow(winner.uuid);
                    setShowWinner(() => false);
                    setRotate(() => null);
                    setWinner(() => null);
                } : null}
            />
        </div>
    );
}

function AddNewButton({ user, addShow }) {
    const [add, setAdd] = useState('');

    const addNew = () => {
        addShow({
            name: add,
            uuid: uuidv4(),
            owner: user
        });
        setAdd(() => '');
    };

    return (
        <input
            type='text'
            className='show add-new'
            placeholder='Add Show +'
            value={add}
            onChange={e => setAdd(() => e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add && addNew()}
            onBlur={e => add && addNew()}
        />
    );
}

function UserShows({ users, shows, renderShows, addShow }) {
    return users.map((user, i) => (
        <div className='user-shows' key={user.name}>
            <h3 key={'h3 ' + user.name} className={i === 0 ? 'first-h3' : ''}>{user.name}</h3>
            {shows && shows.filter(show => show.owner.name === user.name).map(renderShows)}
            <AddNewButton key={'add new button ' + user.name} user={user} addShow={addShow} />
        </div>
    ));
}

function Shows({ users, setUsers, shows, removeShow, addHistory, updateShowProp, addShow, colors, ...props }) {
    const [showUsers, setShowUsers] = useState(false);
    const [inspectingShow, setInspectingShow] = useState(null);
    const [editUsers, setEditUsers] = useState(false);

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;
        updateShowProp(show.uuid, prop, value);
        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    const renderShows = show => {
        const i = shows.findIndex(s => s === show);
        return (
            <div className='show' key={show.uuid}>
                <input
                    type='text'
                    value={show.name}
                    onChange={e => updateShowProp(show.uuid, 'name', e.target.value)}
                    style={{ borderLeftColor: pickColor(i, colors, shows) }}
                />
                <button className='delete' onClick={e => removeShow(show.uuid)}>×</button>
                <button className='clickable-faded edit' onClick={() => setInspectingShow(() => show)}>edit</button>
                <ShowInpsectorModal
                    isOpen={!!inspectingShow && inspectingShow.uuid === show.uuid}
                    onRequestClose={() => setInspectingShow(null)}
                    show={inspectingShow}
                    updateShowProp={updateInspectingShowProp}
                    beginWatching={inspectingShow ? () => {
                        addHistory({ ...inspectingShow, date: new Date() });
                        removeShow(inspectingShow.uuid);
                        setInspectingShow(null);
                    } : null}
                />
            </div>
        );
    };

    return (
        <div {...props}>
            <div className='shows-list'>
                <div className='top-bar'>
                    <h2>Shows</h2>
                    <button className='show-users-button' onClick={() => setShowUsers(prev => !prev)}><UserIcon  /></button>
                    <button className='clickable-faded edit' onClick={() => setEditUsers(() => true)}>edit users</button>
                </div>
                {showUsers ?
                    <UserShows shows={shows} users={users} renderShows={renderShows} addShow={addShow} /> :
                    [shows && shows.map(renderShows), <AddNewButton key={'global add new button'} user={users[0]} addShow={addShow} />]}
            </div>
            <ReactModal
                className='edit-users-modal modal-screen'
                ariaHideApp={false}
                isOpen={editUsers}
                onRequestClose={() => setEditUsers(() => false)}
            >
                <h2>Manage Users</h2>
                <div className='users-list'>
                    {users.map(user => (
                        <div key={user.uuid}>
                            <input
                                type='text'
                                defaultValue={user.name}
                                onChange={e => setUsers(prev => prev.map(
                                    u => u.uuid === user.uuid ?
                                    { ...user, name: e.target.value } :
                                    { ...u }
                                ))}
                            />
                        </div>
                    ))}
                </div>
            </ReactModal>
        </div>
    );
}

function History({ users, shows, history, updateHistoryProp, ...props }) {
    const [inspectingShow, setInspectingShow] = useState(null);

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;
        updateHistoryProp(show.uuid, prop, value);
        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    return (
        <div>
            <div {...props}>
                <h2>History</h2>
                <div className='list'>
                    {arrayReverse(history).map(show => (
                        <div key={show.uuid} className='show' onClick={() => setInspectingShow(show)}>
                            <span className='title'>{show.name}</span>
                            <span className='date'> - {show.date.getDate()} {monthNames[show.date.getMonth()]}.</span>
                        </div>
                    ))}
                </div>
            </div>
            <ShowInpsectorModal
                isOpen={!!inspectingShow}
                onRequestClose={() => setInspectingShow(null)}
                show={inspectingShow}
                updateShowProp={updateInspectingShowProp}
            />
        </div>
    );
}

function ShowInpsectorModal({ show, updateShowProp, beginWatching = null, ...props }) {
    return (
        <ReactModal
            className='show-inspector modal-screen'
            ariaHideApp={false}
            {...props}
        >
            {show && (<>
                <h2 className='title'>
                    {show.name}
                    {beginWatching ? (
                        <button className='begin-wating' onClick={beginWatching}>Start watching</button>
                    ) : (
                        <select
                            className='state'
                            defaultValue={show.state}
                            onChange={e => updateShowProp(show, 'state', e.target.value)}
                        >
                            <option>Watching</option>
                            <option>Completed</option>
                            <option>Dropped</option>
                        </select>
                    )}

                </h2>
                <div className='middle' style={{ backgroundColor: show.color }}>
                    {show.banner && <img className='banner' alt='banner' src={show.banner} />}
                    <input
                        className={'banner-url hover-input ' + (show.banner ? '' : 'visible')}
                        type='text'
                        placeholder='Insert banner url...'
                        onKeyDown={e => e.key === 'Enter' && e.target.value && updateShowProp(show, 'banner', e.target.value)}
                        onBlur={e => e.target.value && updateShowProp(show, 'banner', e.target.value)}
                    />
                </div>
                {show.state === 'Watching' && (
                    <div className='links'>
                        {show.watchingUrl && <span>Watching at <a href={show.watchingUrl} rel="noreferrer" target='_blank'>{(show.watchingUrl.match(/\w+(\.\w+)+/) || [])[0]}</a></span>}
                        <input
                            className={'watching-url hover-input ' + (show.watchingUrl ? '' : 'visible')}
                            type='text'
                            placeholder={`${show.watchingUrl ? 'Replace' : 'Insert'} watching url...`}
                            onKeyDown={e => e.key === 'Enter' && e.target.value && updateShowProp(show, 'watchingUrl', e.target.value)}
                            onBlur={e => e.target.value && updateShowProp(show, 'watchingUrl', e.target.value)}
                        />
                    </div>
                )}
                <div className='bottom'>
                    <div className='owner-field'>
                        Suggested by <span className='user'>{show.owner.name}</span>
                    </div>
                    {show.date && (
                        <div className='date'>
                            {!beginWatching && 'Started watching at'}&nbsp;
                            <span className='date-string'>
                                <input type='date' defaultValue={show.date.toLocaleDateString('en-CA')} onChange={e => updateShowProp(show, 'date', new Date(e.target.value))} />
                                {show.date.getDate()}&nbsp;
                                {monthNames[show.date.getMonth()]}.&nbsp;
                                {show.date.getFullYear()}
                            </span>
                            .
                        </div>
                    )}
                </div>
            </>)}
        </ReactModal>
    );
}

function WheelPage({ wheelName, setWheelName, wheelQuery, showsQuery, historyQuery }) {
    const [users, setUsers] = useState(() => [
        { name: 'Tony'  , uuid: uuidv4() },
        { name: 'Espen' , uuid: uuidv4() },
        { name: 'Jørgen', uuid: uuidv4() },
        { name: 'Sigurd', uuid: uuidv4() }
    ]);
    // const [shows,   setShows  ] = useState(() => parseShows(  localStorage.getItem(`${wheelName}-shows`  )));
    // const [history, setHistory] = useState(() => parseHistory(localStorage.getItem(`${wheelName}-history`)));

    const [shows] = useCollectionData(showsQuery);
    const historyCD = useCollectionData(historyQuery);

    const history = (historyCD[0] || []).map(h => ({ ...h, date: new Date(h.date) }));

    const setShows   = () => {};
    const setHistory = () => {};


    useEffect(() => {
        setShows(  () => parseShows(  localStorage.getItem(`${wheelName}-shows`  )));
        setHistory(() => parseHistory(localStorage.getItem(`${wheelName}-history`)));
    }, [wheelName]);

    // useEffect(() => {
    //     localStorage.setItem(`${wheelName}-shows`, JSON.stringify(shows));
    // }, [shows, wheelName]);

    // useEffect(() => {
    //     localStorage.setItem(`${wheelName}-history`, JSON.stringify(history));
    // }, [history, wheelName]);


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

    const exportData = () => {
        const data = JSON.stringify({ users, shows, history });
        const anchor = document.createElement('a');
        anchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
        anchor.setAttribute('download', `${wheelName} Anime Roulette Data.json`);
        anchor.innerText = `Click here to download data export of ${wheelName}`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    const importData = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.innerText = `Click here to upload data to ${wheelName}`;
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        input.addEventListener('change', e => {
            const file = e.target.files[0];
            document.body.removeChild(input);
            if (!file) return;
            file.text()
                .then(text => {
                    //localStorage.setItem(`${wheelName}-shows`, '[]');
                    //localStorage.setItem(`${wheelName}-history`, '[]');

                    const { users, shows, history } = JSON.parse(text);
                    setUsers(() => users);
                    setShows(() => shows);
                    setHistory(() => history.map(show => ({ ...show, date: new Date(show.date) })));
                })
                .catch(console.log);
        })
    };

    const removeShow = uuid => {
        setShows(prev => prev.filter(show => show.uuid !== uuid));
    };
    const addShow = show => setShows(prev => [...prev, show]);
    const updateShowProp = (uuid, prop, value) => setShows(prev => prev.map(
        hShow => hShow.uuid === uuid ?
            { ...hShow, [prop]: value } :
            { ...hShow }
    ));

    const addHistory = show => setHistory(prev => [...prev, show]);
    const updateHistoryProp = (uuid, prop, value) => setHistory(prev => prev.map(
        hShow => hShow.uuid === uuid ?
            { ...hShow, [prop]: value } :
            { ...hShow }
    ));

    return (
        <div id='home'>
            <header>
                <div>
                    <div className='wheel-name clickable-faded'>
                        {wheelName}
                        <select defaultValue={wheelName} onChange={e => setWheelName(() => e.target.value)}>
                            <option>Anime Abuse</option>
                            <option>Testing Wheel</option>
                            <option>Animal Abuse</option>
                            <option>Third one for show</option>
                            <option>WHEEL OF IMPORT</option>
                            <option>Test Wheel</option>
                        </select>
                    </div>
                </div>
                <h1>Anime Roulette</h1>
                <div className="export-import">
                    <button className='export-data clickable-faded' onClick={exportData}>Export Data</button>
                    /
                    <button className='import-data clickable-faded' onClick={importData}>Import Data</button>
                </div>
            </header>
            <main>
                <Shows   className='left   shows'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} updateShowProp={updateShowProp} addShow={addShow} setUsers={setUsers} />
                <Wheel   className='center wheel'   users={users} shows={shows} addHistory={addHistory} colors={colors} removeShow={removeShow} />
                <History className='right  history' users={users} shows={shows} history={history} updateHistoryProp={updateHistoryProp} />
            </main>
        </div>
    );
}

function SignIn() {
    return (
        <button onClick={() => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithRedirect(provider);
        }}>Sign in with Google</button>
    );
}

function SignOut() {
    return auth.currentUser && (
        <button onClick={auth.signOut}>Sign out</button>
    );
}

function PageRenderer() {
    const [wheelName, setWheelName] = useState(() => localStorage.getItem('wheel-name') || 'Select wheel');
    const [user] = useAuthState(auth);

    const wheelsRef = firestore.collection('wheels');
    const query = wheelsRef.where('title', '==', 'Test Wheel');

    const showsQuery = firestore.collection(`shows-${wheelName}`);
    const historyQuery = firestore.collection(`history-${wheelName}`).orderBy('date');

    useEffect(() => {
        localStorage.setItem('wheel-name', wheelName);
    }, [wheelName]);

    return user ?
        <WheelPage
            wheelName={wheelName}
            setWheelName={setWheelName}
            wheelQuery={query}
            showsQuery={showsQuery}
            historyQuery={historyQuery}
        /> :
        <SignIn />;
}

ReactDOM.render(
    <React.StrictMode>
        <PageRenderer />
    </React.StrictMode>,
    document.getElementById('root')
);

// reportWebVitals(console.log) || https://bit.ly/CRA-vitals
reportWebVitals();
