import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as ArrowDown } from './icons/arrow_down.svg';
import { ReactComponent as UserIcon  } from './icons/user.svg';
import { v4 as uuidv4 } from 'uuid';
import './index.scss';
import reportWebVitals from './reportWebVitals';

function choose(...args) {
    return args[Math.floor(Math.random() * args.length)];
}

function arrayRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
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
    constructor(active = true, offset = 0) {
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

            if (date > rotate.endDate) {
                const winnerIndex = Math.floor((1 - ((rotate.offset / (Math.PI * 2) + rotate.rng + .25) % 1)) * shows.length);
                setRotate(prev => ({
                    ...prev,
                    active: false,
                    winner: shows[winnerIndex]
                }));
                setArrowColor(() => pickColor(winnerIndex, colors, shows));
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
        <div class='user-shows'>
            <h3 key={'h3 ' + user.name} className={i === 0 ? 'first-h3' : ''}>{user.name}</h3>
            {shows.filter(show => show.owner.name === user.name).map(renderShows)}
            <AddNewButton key={'add new button ' + user.name} user={user} setShows={setShows} />
        </div>
    ));
}

function Shows({ shows, users, setShows, colors, ...props }) {
    const [showUsers, setShowUsers] = useState(true);

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

function WheelPage() {
    const [users, setUsers] = useState([
        { name: 'Tony' },
        { name: 'Espen' },
        { name: 'Jørgen' },
        { name: 'Sigurd' }
    ]);
    const [shows, setShows] = useState(() => ['Kaiji', 'Haikyuu', 'Panty & Stocking', 'Beans', 'Crumbs', 'Wheat', 'Snails'].map(
        name => ({
            name,
            uuid: uuidv4(),
            owner: arrayRandom(users)
        })
    ));

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
            <Shows className='left shows'   users={users} shows={shows} setShows={setShows} colors={colors} />
            <Wheel className='center wheel' users={users} shows={shows} colors={colors} />
            <div className='right' />
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
