import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactComponent as ArrowDown } from '../icons/arrow_down.svg';
import ShowInpsectorModal from './ShowInspectorModal';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import firestore from '../firestore';

const imageCache = {};
const imageLoading = {};

export default function Wheel({ shows, removeShow, wheelId, users, updateShowProp, colors, addHistory, userCanEdit, ...props }) {
    const canvasRef = useRef(null);
    const widthRef = useRef(null);
    const [size, setSize] = useState(960);
    const [arrowColor, setArrowColor] = useState('#262628');
    const [winner, setWinner] = useState(null);
    const [showWinner, setShowWinner] = useState(false);
    const [arrowHover, setArrowHover] = useState(false);
    const [rotate, setRotateLocal] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(0);

    const [wheel] = useDocumentData(firestore.doc(`wheels/${wheelId}`));
    const rotateServer = wheel ? wheel.rotate || null : rotate;

    useEffect(() => {
        for (const show of shows) {
            if (show.banner && !imageCache[show.banner] && !imageLoading[show.banner]) {
                imageLoading[show.banner] = true;
                loadImage({ src: show.banner, maxSeconds : 10 }, status => {
                    if (status.err) return console.log(status.err);
                    imageCache[show.banner] = status.img;
                    imageLoading[show.banner] = false;
                    setImagesLoaded(prev => prev + 1);
                });
            }
        }
    }, [shows]);

    useEffect(() => {
        if (compareRotates(rotateServer, rotate) || !rotateServer) return;
        const newRotate = { ...rotateServer, date: rotateServer.date.toDate() };
        setRotateLocal(() => newRotate);
    }, [
        rotate,
        rotateServer,
        rotateServer?.rng,
        rotateServer?.endDate,
        rotateServer?.offset
    ]);

    const setRotate = useCallback(
        newRotate => {
            firestore.doc(`wheels/${wheelId}`).update({
                rotate: typeof newRotate === 'function' ? newRotate(rotate) : newRotate
            });
            setRotateLocal(newRotate);
        },
        [rotate, wheelId]
    );

    // Draw wheel
    useEffect(() => {
        if (!canvasRef || !canvasRef.current || (rotate && rotate.spinning) || !shows) return;

        // Draw wheel
        const ctx = extendContext(canvasRef.current.getContext('2d'), size);
        ctx.drawWheel(shows, colors, rotate ? rotate.offset + rotate.rng * Math.PI * 2 : 0);

        // Set Arrow color with default state
        if (!rotate) {
            const targetIndex = Math.floor(.75 * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));
        } else {
            const off = rotate.offset / (Math.PI * 2) + rotate.rng + .25;
            const targetIndex = Math.floor((1 - (off % 1)) * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));
        }
    }, [canvasRef, size, rotate, rotate?.spinning, shows, colors, imagesLoaded]);

    // Resize
    useEffect(() => {
        if (!widthRef) return;

        const observer = new ResizeObserver(obs => {
            const width = obs[0].contentRect.width;
            if (size !== width) {
                setSize(() => width);
            }
        });

        const observee = widthRef.current;
        observer.observe(observee);

        return () => observer.unobserve(observee);
    }, [widthRef, size]);

    // Rotation of doom
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

                setRotate(() => ({ ...rotate, spinning: false }));
                setShowWinner(() => true);
                setArrowColor(() => winnerColor);
                return;
            }

            let easeInOutQuint = x => (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2);
            let time = easeInOutQuint((date - rotate.date) / (rotate.endDate - rotate.date));

            const targetIndex = Math.floor((1 - (((rotate.offset + time * (Math.PI * 2 * 13 + rotate.rng * Math.PI * 2)) / (Math.PI * 2) + .25) % 1)) * shows.length);
            setArrowColor(() => pickColor(targetIndex, colors, shows));

            const ctx = extendContext(canvasRef.current.getContext('2d'), size);

            ctx.drawWheel(shows, colors, rotate.offset + time * (Math.PI * 2 * 13 + rotate.rng * Math.PI * 2));
        };

        if (rotate?.spinning) {
            const interval = setInterval(handleRotate, 10);
            return () => clearInterval(interval);
        }
    }, [rotate, rotate?.spinning, setRotate, canvasRef, shows, colors, size]);

    const updateInspectingShowProp = (show, prop, value) => {
        if (show[prop] === value) return;
        updateShowProp(show.uuid, prop, value);
        setWinner(prev => ({ ...prev, [prop]: value }));
    }

    return (
        <div {...props} id='wheel-width' ref={widthRef} className={userCanEdit ? 'user-edit' : 'user-no-edit'}>
            <div className='wheel-box'>
                <div className={'arrow' + (winner ? ' has-winner' : '')}>
                    <div className={'line' + (arrowHover ? ' arrow-hover' : '')} />
                    <ArrowDown
                        onClick={() => winner && userCanEdit && setShowWinner(() => true)}
                        onMouseEnter={() => setArrowHover(() => true)}
                        onMouseLeave={() => setArrowHover(() => false)}
                        style={{ fill: arrowColor }}
                    />
                </div>
                <canvas
                    id='wheel'
                    className={!shows || shows.length === 0 ? 'empty' : 'populated'}
                    onClick={() => userCanEdit && setRotate(prev => {
                        if (prev && rotate.spinning) return prev;

                        const date = new Date();
                        const rng = Math.random();

                        return {
                            date,
                            offset: prev ? prev.offset + prev.rng * Math.PI * 2 : 0,
                            rng,
                            endDate: +date + 8000 + rng * 1000, // 8-9 seconds after start
                            spinning: true
                        };
                    })}
                    ref={canvasRef}
                    width={size}
                    height={size}
                />
            </div>
            <ShowInpsectorModal
                isOpen={showWinner && userCanEdit}
                onRequestClose={() => setShowWinner(() => false)}
                updateShowProp={updateInspectingShowProp}
                show={rotate && winner}
                users={users}
                beginWatching={rotate ? () => {
                    addHistory({ ...winner, state: 'Watching' });
                    removeShow(winner.uuid);
                    setShowWinner(() => false);
                    setWinner(() => null);
                } : null}
            />
        </div>
    );
}

function compareRotates(r1, r2) {
    if (r1 === r2) return true;
    if (!r1 || !r2) return false;
    return (
        r1.endDate === r2.endDate &&
        r1.offset  === r2.offset &&
        r1.rng     === r2.rng
    );
}

function pickColor(i, colors, shows) {
    const index = i % colors.length + (shows.length % colors.length < 2 && i >= colors.length) * 2;
    return shows.length >= 1 ? (shows[i]?.color ?? colors[index]) : '#313132';
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
    drawPieSliceImage(x, y, radius, startAngle, endAngle, image, alpha=1) {
        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.clip();
        ctx.translate(x, y);
        ctx.rotate((startAngle + endAngle) / 2);
        const height = radius * 2; // image.height * (radius / image.width);
        const width = (image.width / image.height) * height;
        ctx.drawImage(image, -width / 3, -height / 2, width, height);

        ctx.globalAlpha = 1;
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

        if (shows.length === 0) {
            this.drawPieSlice(
                half, half, half,
                -.013,
                2 * Math.PI,
                '#6a6a66'
            );
        }

        for (let i = 0; i < shows.length; i++) {
            const toRad = t => (t / shows.length) * 2 * Math.PI;
            const show = shows[i];
            this.drawPieSlice(
                half, half, half,
                toRad(i) - .013 + wheelAngle,
                toRad(i + 1)    + wheelAngle,
                show?.color ?? pickColor(i, colors, shows)
            );

            const angle = toRad(i + .5) + wheelAngle;

            const image = imageCache[show.banner];
            if (image) {
                this.drawPieSliceImage(
                    half, half, half,
                    toRad(i) - .013 + wheelAngle,
                    toRad(i + 1)    + wheelAngle,
                    image,
                    .15
                );
            }

            this.drawTextRotated(
                half + Math.cos(angle) * half / 1.9,
                half + Math.sin(angle) * half / 1.9,
                show?.title || show.name,
                angle
            );
        }
    }
});

function loadImage(options, callback) {
    let seconds = 0;
    let maxSeconds = 10;
    let complete = false;
    let done = false;

    if (options.maxSeconds) {
        maxSeconds = options.maxSeconds;
    }

    const tryImage = () => {
        if (done) return;
        if (seconds >= maxSeconds) {
            callback({ err: 'timeout' });
            done = true;
            return;
        }
        if (complete && img.complete) {
            if (img.width && img.height) {
                callback({ img: img });
                done = true;
                return;
            }
            callback({ err: '404' });
            done = true;
            return;
        } else if (img.complete) {
            complete = true;
        }
        seconds++;
        callback.tryImage = setTimeout(tryImage, 1000);
    }

    var img = new Image();
    img.onload = tryImage();
    img.src = options.src;
    tryImage();
}
