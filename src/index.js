import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import { ReactComponent as ArrowDown } from './icons/arrow_down.svg';
import { ReactComponent as UserIcon  } from './icons/user.svg';
import { v4 as uuidv4 } from 'uuid';
import './index.scss';
import reportWebVitals from './reportWebVitals';
// import historySauce from './history.json';

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

function choose(...args) {
    return args[Math.floor(Math.random() * args.length)];
}

function arrayRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function parseHistory(historySauce) {
    return JSON.parse(historySauce).map(h => ({ ...h, date: new Date(h.date) }));
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

class Rotate {
    constructor(active = true, offset = 0, showWinner = false) {
        this.date = new Date();
        this.offset = offset;
        this.rng = Math.random();
        this.endDate = +this.date + 8000 + this.rng * 1000;
        this.active = active
        this.winner = '';
    }
}

function Wheel({ shows, users, colors, ...props }) {
    const canvasRef = useRef(null);
    const [size, setSize] = useState(960);
    const [rotate, setRotate] = useState(null);
    const [arrowColor, setArrowColor] = useState('#afb8c6');
    const [showWinner, setShowWinner] = useState(false);

    // Draw wheel
    useEffect(() => {
        if (!canvasRef || !canvasRef.current || (rotate && rotate.active)) return;

        // Draw wheel
        const ctx = extendContext(canvasRef.current.getContext('2d'), size);
        ctx.drawWheel(shows, colors, rotate ? rotate.offset + rotate.rng * Math.PI * 2 : 0);

        // Set Arrow color with default state
        if (!rotate) {
            const targetIndex = Math.floor(.75 * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));
        }

    }, [canvasRef, size, rotate, shows, colors]);

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
        if (!canvasRef || !rotate) return;

        const handleRotate = () => {
            const date = new Date();

            // Rotation end
            if (date > rotate.endDate) {
                const winnerIndex = Math.floor((1 - ((rotate.offset / (Math.PI * 2) + rotate.rng + .25) % 1)) * shows.length);
                const winnerColor = pickColor(winnerIndex, colors, shows);

                setRotate(prev => ({
                    ...prev,
                    active: false,
                    winner: {
                        ...shows[winnerIndex],
                        date: new Date(),
                        color: winnerColor
                    }
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

        if (rotate.active) {
            const interval = setInterval(handleRotate, 10);
            return () => clearInterval(interval);
        }
    }, [rotate, canvasRef, shows, colors, size]);

    return (
        <div {...props} id='wheel-width'>
            <div className='wheel-box'>
                <div className='arrow'>
                    <ArrowDown style={{ fill: arrowColor }} />
                </div>
                <canvas
                    id='wheel'
                    onClick={() => setRotate(prev => prev ? (prev.active ? prev : new Rotate(true, prev.offset + prev.rng * Math.PI * 2)) : new Rotate())}
                    ref={canvasRef}
                    width={size}
                    height={size}
                />
            </div>
            <div className='result'>{rotate ? rotate.winner.name || 'Spinning...' : ''}</div>
            <ReactModal
                className='show-inspector'
                isOpen={showWinner}
                onRequestClose={() => setShowWinner(false)}
                ariaHideApp={false}
            >
                {showWinner && <ShowInpsector show={rotate.winner} beginWatching={() => console.log('begin watching')} />}
            </ReactModal>
        </div>
    );
}

function AddNewButton({ user, setShows }) {
    const [add, setAdd] = useState('');

    const addNew = () => {
        setShows(prev => [
            ...prev,
            {
                name: add,
                uuid: uuidv4(),
                owner: user
            }
        ]);
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

function UserShows({ users, shows, renderShows, setShows }) {
    return users.map((user, i) => (
        <div className='user-shows' key={user.name}>
            <h3 key={'h3 ' + user.name} className={i === 0 ? 'first-h3' : ''}>{user.name}</h3>
            {shows.filter(show => show.owner.name === user.name).map(renderShows)}
            <AddNewButton key={'add new button ' + user.name} user={user} setShows={setShows} />
        </div>
    ));
}

function Shows({ users, shows, setShows, colors, ...props }) {
    const [showUsers, setShowUsers] = useState(false);

    const renderShows = show => {
        const i = shows.findIndex(s => s === show);
        return (
            <div className='show' key={show.uuid}>
                <input
                    type='text'
                    defaultValue={show.name}
                    onChange={e => setShows(prev => [
                        ...prev.slice(0, i),
                        { ...show, name: e.target.value },
                        ...prev.slice(i + 1)
                    ])}
                    style={{ borderLeftColor: pickColor(i, colors, shows) }}
                />
                <button className='delete' onClick={e => setShows(prev => [
                    ...prev.slice(0, i),
                    ...prev.slice(i + 1)
                ])}>×</button>
            </div>
        );
    };

    return (
        <div {...props}>
            <div className='shows-list'>
                <h2>Shows <span className='show-users-button' onClick={() => setShowUsers(prev => !prev)}><UserIcon  /></span></h2>
                {showUsers ?
                    <UserShows shows={shows} users={users} renderShows={renderShows} setShows={setShows} /> :
                    [shows.map(renderShows), <AddNewButton key={'global add new button'} user={users[0]} setShows={setShows} />]}
            </div>
        </div>
    );
}

function History({ users, shows, history, setHistory, ...props }) {
    const [inspectingShow, setInspectingShow] = useState(null);

    const updateHistoryProp = (show, prop, value) => {
        if (show[prop] === value) return;
        setHistory(prev => prev.map(
            hShow => hShow.uuid === show.uuid ? { ...hShow, [prop]: value } : { ...hShow }
        ));
        setInspectingShow(prev => ({ ...prev, [prop]: value }));
    }

    return (
        <div>
            <div {...props}>
                <h2>History</h2>
                {arrayReverse(history).map(show => (
                    <div key={show.uuid} className='show' onClick={() => setInspectingShow(show)}>
                        <span className='title'>{show.name}</span>
                        <span className='date'> - {show.date.getDate()} {monthNames[show.date.getMonth()]}.</span>
                    </div>
                ))}
            </div>
            <ReactModal
                className='show-inspector'
                isOpen={!!inspectingShow}
                onRequestClose={() => setInspectingShow(null)}
                ariaHideApp={false}
            >
                {inspectingShow && <ShowInpsector show={inspectingShow} updateShowProp={updateHistoryProp} setHistory={setHistory} />}
            </ReactModal>
        </div>
    );
}

function ShowInpsector({ show, updateShowProp, setHistory, beginWatching = null }) {
    return (
        <>
            <h2 className='title'>
                {show.name}
                {beginWatching ? (
                    <button className='begin-wating' onClick={beginWatching}>Start watching</button>
                ) : (
                    <select className='state' defaultValue={show.state} onChange={e => setHistory(prev => prev.map(
                        v => v.uuid === show.uuid ? { ...v, state: e.target.value } : { ...v }
                    ))}>
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
                    {show.watchingUrl && <span>Watching at <a href={show.watchingUrl} target='_blank'>{(show.watchingUrl.match(/\w+(\.\w+)+/) || [])[0]}</a></span>}
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
                <div className='date'>
                    {!beginWatching &&'Started watching at'}&nbsp;
                    <span className='date-string'>
                        {show.date.getDate()}&nbsp;
                        {monthNames[show.date.getMonth()]}.&nbsp;
                        {show.date.getFullYear()}
                    </span>
                    .
                </div>
            </div>
        </>
    );
}

function WheelPage() {
    const [users, setUsers] = useState(() => [
        { name: 'Tony' },
        { name: 'Espen' },
        { name: 'Jørgen' },
        { name: 'Sigurd' }
    ]);
    const [shows, setShows] = useState(() => JSON.parse(localStorage.getItem('shows')));
    const [history, setHistory] = useState(() => parseHistory(localStorage.getItem('history')));

    useEffect(() => {
        localStorage.setItem('shows', JSON.stringify(shows));
    }, [shows]);

    useEffect(() => {
        localStorage.setItem('history', JSON.stringify(history));
    }, [history]);

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

    return (
        <div id='home'>
            <h1>Anime Roulette</h1>
            <main>
                <Shows   className='left   shows'   users={users} shows={shows} setShows={setShows} colors={colors} />
                <Wheel   className='center wheel'   users={users} shows={shows} colors={colors} />
                <History className='right  history' users={users} shows={shows} history={history} setHistory={setHistory} />
            </main>
        </div>
    );
}

ReactDOM.render(
    <React.StrictMode>
        <WheelPage />
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
