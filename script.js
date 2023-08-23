// JavaScript equivalent of EPointF class (same as before)

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const backgroundImage = document.getElementById("background-image");

const knots = [
    new EPointF(100, 300),
    new EPointF(300, 100),
    new EPointF(500, 500),
    new EPointF(700, 300)
];

const controlPoints = computeControlPoints(knots);

function drawBezierCurve() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(knots[0].x, knots[0].y);

    for (let i = 1; i < knots.length; i += 3) {
        ctx.bezierCurveTo(
            controlPoints[i - 1].x, controlPoints[i - 1].y,
            controlPoints[i].x, controlPoints[i].y,
            knots[i].x, knots[i].y
        );
    }

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function computeControlPoints(knots) {
    const n = knots.length - 1;
    const controlPoints = [];

    for (let i = 0; i < n; i++) {
        if (i === 0) {
            controlPoints.push(knots[0]);
            controlPoints.push(knots[0].plus(2 / 3, knots[1]));
        } else {
            const prevControl = controlPoints[controlPoints.length - 1];
            const nextKnot = knots[i + 1];

            controlPoints.push(prevControl.plus(1 / 3, nextKnot.minus(prevControl)));
            controlPoints.push(nextKnot);
        }
    }

    return controlPoints;
}

function updateKnotPosition(index, x, y) {
    knots[index] = new EPointF(x, y);
    controlPoints = computeControlPoints(knots);
    drawBezierCurve();
}

function drawKnots() {
    ctx.fillStyle = "red";

    for (let i = 0; i < knots.length; i++) {
        ctx.beginPath();
        ctx.arc(knots[i].x, knots[i].y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function findKnotIndex(x, y) {
    for (let i = 0; i < knots.length; i++) {
        if (Math.sqrt((knots[i].x - x) ** 2 + (knots[i].y - y) ** 2) <= 5) {
            return i;
        }
    }
    return -1;
}

let selectedKnotIndex = -1;
let isDragging = false;

canvas.addEventListener("mousedown", (e) => {
    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;
    selectedKnotIndex = findKnotIndex(x, y);

    if (selectedKnotIndex !== -1) {
        isDragging = true;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;
        updateKnotPosition(selectedKnotIndex, x, y);
    }
});

canvas.addEventListener("mouseup", () => {
    isDragging = false;
    selectedKnotIndex = -1;
});

drawBezierCurve();
drawKnots();
