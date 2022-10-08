const TO_VIDEO = true;

const PAINT = !TO_VIDEO;

const TELEPORT = false;
const TELEPORT_TO = 6;
let trackLine = true;
let trackMouse = false;
const SKIP_TO_STATE = 0;


const W = 320;
const H = 180;
let MODE = 1;
let PRECISE = false;


let scene = 1;
let px = 0;
let py = 0;
let sx = 0;
let sy = 0;
let state = -1;
let mx = 0;
let my = 0;
let followX = 0;
let followY = 0;
let mdown = false;
let speed = 0;

let ty=100, tx=100;

let disable = false;


const DTs = 1 / 60;
let lineIdx = 0;
let lineSpeed = 0;
let lineSpeedPos = 0;

let waitForScene = 0;
let waitToIter = 0;
let iter = 0;
let lags = 0;
let startTime = 0;

let lastT = performance.now();

function PLAYER_CHANGED(p = 
{
    x: 0,
    y: 0,
    gx: 0,
    gy: 0,
}) {
    if (disable)
        return;
        
    const t = performance.now();
    const dt = (t - lastT) / 1000;
    if (dt > 0.01) {
        const endDraw = startDraw();

        scene = 10 - Math.floor(p.gy / H);
        lineSpeed = 0;
        PRECISE = false;
        MODE = 1;

        iter++;
        if (startTime == 0 && p.y > 0){
            iter = 0;
            startTime = performance.now() + (DTs * 0 * 1000);
        } 
    
        if (state == 7) {
            MODE = 0;
            PRECISE = true;
            lineSpeed = 1.2;
            if (lineIdx > 1040) lineSpeed = 0.8; 
        }
        if (state == 10) {
            if (lineIdx > 700 && lineSpeedPos == 0) {
                lineSpeedPos = lineIdx;
            }
            if (lineSpeedPos > 0) {
                lineSpeed = 0.5;
                MODE = 0;
                PRECISE = true;
                if (lineIdx > 850) lineSpeed = 2; 
                if (lineIdx > 1000) lineSpeed = 0.5;
                if (lineIdx > 1100) lineSpeed = 1.5;
            }
        }

        lastT = t;
        const alpha = (MODE && !PRECISE) ? 0.5 : 0;
        sx = sx * alpha + (1-alpha) * (p.x - px) / dt;
        sy = sy * alpha + (1-alpha) * (p.y - py) / dt;
        px = p.x;
        py = p.y;

        speed = speed * 0.9 + 0.1 * Math.sqrt(sx**2 + sy**2);

        let maxSpeed = 9999;
        let distanceD = 10;

        if (SKIP_TO_STATE && state < SKIP_TO_STATE && state != 5)
            distanceD = 20;

        if (state == 6) {
            lineSpeed = 2;
            if (lineIdx > 250)
                lineSpeed = 0.9;
        }


        if (TELEPORT && state == 99) {
            if (py > 0 && py < 20) {
                [followX, followY] = [W / 2, H];
                this.setY(H * 11 - 20);
            }
            if (py > 100) {
                let line = lines[TELEPORT_TO];
                if (TELEPORT_TO == 4) {
                    setTimeout(() => {
                        [followX, followY] = [100, 0];
                        this.setX(90);
                        this.setY(H * 6 + 20);
                        lineIdx = line.length - 40;
                    }, 1000)
                }
                if (TELEPORT_TO == 5) {
                    setTimeout(() => {
                        [followX, followY] = [100, 0];
                        this.setX(230);
                        this.setY(H * 5 + 80);
                        lineIdx = line.length - 80;
                    }, 1000)
                }
                if (TELEPORT_TO == 6) {
                    setTimeout(() => {
                        [followX, followY] = [100, 0];
                        this.setX(100);
                        this.setY(H * 4 + 70);
                        lineIdx = line.length - 40;
                        lineSpeedPos = lineIdx;
                    }, 1000)
                }
                if (TELEPORT_TO == 9) {
                    setTimeout(() => {
                        this.setX(W / 2);
                        this.setY(H * 1 + 20);
                        lineIdx = line.length - 40;
                        [followX, followY] = line[lineIdx];
                    }, 1000)
                }
                state = TELEPORT_TO;
                waitForScene = TELEPORT_TO;
            }
        } else if (state >= 0) {
            if (dt > 0.03) {
                lags++;
                console.log('lag', dt);
            }

            let tX = followX;
            let tY = followY;
            if (trackMouse) {
                tX = mx;
                tY = my;
            }

            if (trackLine) {
                let line = lines[state];
                if (scene == waitForScene && iter >= waitToIter) {
                    if(line) {
                        function checkSleep() {
                            let sleep = sleeps[state]?.find(s => s[0] == lineIdx);
                            if (sleep) {
                                waitToIter = iter + Math.round(sleep[1] / DTs);
                            }
                        }

                        lineSpeedPos += lineSpeed;
                        if (lineSpeedPos > 0) {
                            lineIdx = Math.round(lineSpeedPos);
                            if (lineIdx < line.length) {
                                [tX, tY] = line[lineIdx];
                                if (state == 7) {
                                    if ((lineIdx > 570 && lineIdx < 700) || (lineIdx > 1040 && lineIdx < 1100)) tX += 2; 
                                    if (lineIdx > 780 && lineIdx < 900) tX -= 2; 
                                }
                                [followX, followY] = [tX, tY];
                                checkSleep();
                            } else {
                                waitForScene = scene + 1;
                                state++;
                                [followX, followY] = [px, -10];
                                lineIdx = 0;
                                lineSpeedPos = 0;
                            }
                        } else {
                            let lastDist = 0;
                            do {
                                [tX, tY] = line[lineIdx];
                                if (state == 5) {
                                    // tY += 0.5; 
                                }

                                let dist = distance([tX, tY], [px, py]);
                                if (dist < (MODE ? (speed > maxSpeed ? 4 : distanceD) : 7) && dist >= lastDist) {
                                    lastDist = dist;
                                    lineIdx++;
                                    if (lineIdx >= line.length) {
                                        waitForScene = scene + 1;
                                        if (state == 99) {
                                            state = 0;
                                            waitForScene = 0;
                                        } else {
                                            state++;
                                        }
                                        [followX, followY] = [px, -10];
                                        lineIdx = 0;
                                    }
                                    [followX, followY] = [tX, tY];
                                    checkSleep();
                                } else break;
                                if (speed > maxSpeed)
                                    break;
                            } while(1);
                        }
                    } else {
                        followY = H - 10;
                    }
                }
            }

            if (state == 11 && px <= 174 && py <= 23) {
                disable = true;
                releaseLeft();
                releaseSpace();
                releaseRight();
                holdingSpace = false;
                holdingArrow = 0;
            }

            if (!disable) {
                if (PAINT) {
                    color = [255, 0,0, 255];
                    drawPoint([tX, tY]);
                }
    
                ty = py - 1.5;
                let sy1 = sy;
                while (sy1 != 0) {
                    ty += sy1 * dt *  (PRECISE ? 3 : (MODE ? 1.3 : 2));
                    let sy2 = sy1 - Math.sign(sy1) * 1.577;
                    if (Math.sign(sy1) != Math.sign(sy2))
                        break;
                    sy1 = sy2;
                }
                if ((ty > tY)) {
                    holdingSpace = true;
                    holdSpace();
                }
                if ((ty <= tY) && holdingSpace) {
                    holdingSpace = false;
                    releaseSpace();
                }
        
                let px1 = px - 1.5;
                tx = px1;
                let sx1 = sx;
                while (sx1 != 0) {
                    tx += sx1 * dt * (PRECISE ? 3 : (MODE ? 1.3 : 2));
                    let sx2 = sx1 - Math.sign(sx1) * 3.1;
                    if (Math.sign(sx1) != Math.sign(sx2))
                        break;
                    sx1 = sx2;
                }
    
    
                if ((((tx > tX) || (tx < tX)))) {
                    let toHold = tx > tX ? 1 : -1;
                    if (holdingArrow != toHold) {
                        releaseLeft();
                        releaseRight();
                    }
                    holdingArrow = toHold;
                    if (holdingArrow == 1) holdLeft(); else holdRight();
                }
                if ((Math.abs(tx - tX) <= 0.9) && holdingArrow) {
                    if (holdingArrow > 0) releaseLeft();
                    else releaseRight();
                    holdingArrow = 0;
                }
            }
        }


        $('#pos').text('pos: ' + px.toFixed(1) + ' ' + py.toFixed(1));
        // $('#mouse').text('mouse: ' + mx.toFixed(1) + ' ' + my.toFixed(1));
        $('#mouse').text('speed: ' + speed.toFixed(1));
        $('#state').text('state: ' + state + ' idx: ' + lineIdx + (iter < waitToIter ? ', sleep' : ''));
        $('#lags').text('lags: ' + lags);
        if (startTime > 0) {
            let timeMs = Math.max(0, (performance.now() - startTime));
            let secs = Math.floor(timeMs / 1000);
            $('#time .value').text(Math.floor(secs / 60) + ':' + (secs%60).toString().padStart(2, '0'));
            $('#time .ms').text((Math.floor(timeMs / 10) % 100).toString().padStart(2, '0'));
            $('#iter .value').text(iter);
        }

        // console.log((dt*1000).toFixed(1), 'pos: ', px.toFixed(1), py.toFixed(1), 'speed', sx.toFixed(1), sy.toFixed(1));

        if (PAINT) {
            color = [0, 255, 0, 80];
            let line1 = lines[state];
            pairs(line1).forEach(p => bline(p[0], p[1]));
            color = [255, 0,0, 128];
            pairs(line).forEach(p => bline(p[0], p[1]));
        }

        $('#bt_left').toggleClass('pressed', pressedLeft || holdingArrow == 1);
        $('#bt_right').toggleClass('pressed', pressedRight || holdingArrow == -1);
        $('#bt_up').toggleClass('pressed', pressedUp || holdingSpace);
        pressedLeft = false;
        pressedRight = false;
        pressedUp = false;
        endDraw();
    }
}

let line = [];
let holdingSpace = false;
let holdingArrow = 0;

async function mainRun() {
    console.log('main');
    $(window).on('keypress', (event) => {
        switch (event.key.toLowerCase()) {
            case 't':
                trackMouse = !trackMouse;
                followX = px;
                followY = py;
            break;
            case 'd': disable = !disable; break;

            default: 
        }
    })
    $('#canvas1').on('mousemove', (ev) => {
        mx = ev.clientX;
        my = ev.clientY;
        if (mdown) {
            line.push([mx, my]);
        }
    })
    $('#canvas1').on('mouseup mouseleave', (ev) => {
        // lines.push(line);
        mdown = false;
        console.log('mouseup');
        navigator.clipboard.writeText(`lines[${scene}] = ${JSON.stringify(line)};`);
    })
    $('#canvas1').on('mousedown', (ev) => {
        line = [];
        mdown = true;
        console.log('mousedown');
    })


    await sleep(2000);
    
    await pressEnter(); await sleep(200);
    await pressEnter(); await sleep(200);
    await pressEnter(); await sleep(200);
    await pressEnter(); await sleep(200);
    
    state = 99;
}

async function sleep(timeMs = 0) {
    return new Promise(resolve => setTimeout(resolve, timeMs));
}


function startDraw() {
    if (!PAINT)
        return () => {};
    var c = getCanvas();
    if (c.width != W) {
        c.width = W;
        c.height = H;
    }
    var ctx = c.getContext("2d");
    if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);

        const imgData = ctx.getImageData(0,0, c.width, c.height);
        _imgData = imgData.data;

        return () => {
            ctx.putImageData(imgData,0,0);
        }
    }
}


let _imgData;
let color = [255, 0,0, 255];
function setPixel(x, y) {
    const n=(y * W + x) * 4;
    _imgData[n]=color[0];
    _imgData[n+1]=color[1];
    _imgData[n+2]=color[2];
    _imgData[n+3]=color[3];
}

// Refer to: http://rosettacode.org/wiki/Bitmap/Bresenham's_line_algorithm#JavaScript
function bline(p1, p2) {
    let x0 = p1[0], y0=p1[1], x1=p2[0], y1=p2[1];
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; 
    var err = (dx>dy ? dx : -dy) / 2;        
    while (true) {
        setPixel(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }
}
function drawPoint(p1) {
    p1[0] = Math.round(p1[0]);
    p1[1] = Math.round(p1[1]);
    bline([p1[0]-1, p1[1]-1], [p1[0]+1, p1[1]+1]);
    bline([p1[0]+1, p1[1]-1], [p1[0]-1, p1[1]+1]);
}


function getCanvas() {
    let a = document.getElementsByTagName('canvas')[1];
    return a;
}
function pairs(arr) {
    const out = [];
    for (let i = 1; i < arr?.length; i++) {
        out.push([arr[i-1], arr[i]]);
    }
    return out;
}

const distance = (c1, c2) => Math.sqrt((c1[0] - c2[0]) * (c1[0] - c2[0]) + (c1[1] - c2[1]) * (c1[1] - c2[1]));

async function holdKey(key) {
    window['simulateKey']?.({
        keyCode: key,
        type: 'keydown',
        preventDefault: () => {},
    });
}
async function releaseKey(key) {
    window['simulateKey']?.({
        keyCode: key,
        type: 'keyup',
        preventDefault: () => {},
    }); 
}
async function press(key) {
    holdKey(key);
    await sleep(20);
    releaseKey(key);
}

const holdSpace = () => holdKey(32);
const releaseSpace = () => releaseKey(32);

const holdRight = () => holdKey(39);
const releaseRight = () => releaseKey(39);
const holdLeft = () => holdKey(37);
const releaseLeft = () => releaseKey(37);

let pressedLeft = false;
let pressedRight = false;
let pressedUp = false;
const pressSpace = () => { press(32); pressedUp = true; };
const pressLeft = () => { press(37); pressedLeft = true; };
// const pressUp = () => press(38);
const pressRight = () => { press(39); pressedRight = true; }
// const pressDown = () => press(40);
const pressEnter = () => press(13);
