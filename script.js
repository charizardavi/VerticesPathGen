class EPointF {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(factor, ePointF) {
        return new EPointF(this.x + factor * ePointF.x, this.y + factor * ePointF.y);
    }

    minus(factor, ePointF) {
        return new EPointF(this.x - factor * ePointF.x, this.y - factor * ePointF.y);
    }

    scaleBy(factor) {
        return new EPointF(factor * this.x, factor * this.y);
    }
}

// Compute a smooth path with n cubic Bezier curves
function computePathThroughKnots(knots) {
    if (knots.length < 2) {
        throw new Error("Collection must contain at least two knots");
    }

    const polyBezierPath = [];
    const firstKnot = knots[0];
    polyBezierPath.push(`M ${firstKnot.x} ${firstKnot.y}`);

    const n = knots.length - 1;

    if (n === 1) {
        const lastKnot = knots[1];
        polyBezierPath.push(`L ${lastKnot.x} ${lastKnot.y}`);
    } else {
        const controlPoints = computeControlPoints(n, knots);

        for (let i = 0; i < n; i++) {
            const targetKnot = knots[i + 1];
            appendCurveToPath(polyBezierPath, controlPoints[i], controlPoints[n + i], targetKnot);
        }
    }

    return polyBezierPath.join(' ');
}

function computeControlPoints(n, knots) {
    const result = new Array(2 * n);

    const target = constructTargetVector(n, knots);
    const lowerDiag = constructLowerDiagonalVector(n - 1);
    const mainDiag = constructMainDiagonalVector(n);
    const upperDiag = constructUpperDiagonalVector(n - 1);

    const newTarget = new Array(n);
    const newUpperDiag = new Array(n - 1);

    newUpperDiag[0] = upperDiag[0] / mainDiag[0];
    newTarget[0] = target[0].scaleBy(1 / mainDiag[0]);

    for (let i = 1; i < n - 1; i++) {
        newUpperDiag[i] = upperDiag[i] / (mainDiag[i] - lowerDiag[i - 1] * newUpperDiag[i - 1]);
    }

    for (let i = 1; i < n; i++) {
        const targetScale = 1 / (mainDiag[i] - lowerDiag[i - 1] * newUpperDiag[i - 1]);
        newTarget[i] = target[i].minus(newTarget[i - 1].scaleBy(lowerDiag[i - 1])).scaleBy(targetScale);
    }

    result[n - 1] = newTarget[n - 1];

    for (let i = n - 2; i >= 0; i--) {
        result[i] = newTarget[i].minus(newUpperDiag[i], result[i + 1]);
    }

    for (let i = 0; i < n - 1; i++) {
        result[n + i] = knots[i + 1].scaleBy(2).minus(result[i + 1]);
    }

    result[2 * n - 1] = knots[n].plus(result[n - 1]).scaleBy(0.5);

    return result;
}

function constructTargetVector(n, knots) {
    const result = new Array(n);

    result[0] = knots[0].plus(2, knots[1]);

    for (let i = 1; i < n - 1; i++) {
        result[i] = knots[i].scaleBy(2).plus(knots[i + 1]).scaleBy(2);
    }

    result[n - 1] = knots[n - 1].scaleBy(8).plus(knots[n]);

    return result;
}

function constructLowerDiagonalVector(length) {
    const result = new Array(length);

    for (let i = 0; i < result.length - 1; i++) {
        result[i] = 1;
    }

    result[result.length - 1] = 2;

    return result;
}

function constructMainDiagonalVector(n) {
    const result = new Array(n);

    result[0] = 2;

    for (let i = 1; i < result.length - 1; i++) {
        result[i] = 4;
    }

    result[result.length - 1] = 7;

    return result;
}

function constructUpperDiagonalVector(length) {
    const result = new Array(length);

    for (let i = 0; i < result.length; i++) {
        result[i] = 1;
    }

    return result;
}

function appendCurveToPath(pathArray, control1, control2, targetKnot) {
    pathArray.push(`C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${targetKnot.x} ${targetKnot.y}`);
}

// JavaScript equivalent of EPointF class (same as before)

const knots = [];

// JavaScript equivalent of EPointF class (same as before)

const knots = [];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Function to compute the cubic Bezier path and plot it on the canvas
function updatePath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (knots.length >= 4) {
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        ctx.moveTo(knots[0].x, knots[0].y);

        for (let i = 1; i < knots.length - 2; i += 3) {
            ctx.bezierCurveTo(
                knots[i].x, knots[i].y,
                knots[i + 1].x, knots[i + 1].y,
                knots[i + 2].x, knots[i + 2].y
            );
        }

        ctx.stroke();
    }
}

// Add a knot based on user input
function addKnot() {
    const xInput = document.getElementById("x");
    const yInput = document.getElementById("y");

    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    if (!isNaN(x) && !isNaN(y)) {
        knots.push(new EPointF(x, y));
        xInput.value = ""; // Clear input fields
        yInput.value = "";
        updatePath();
    } else {
        alert("Please enter valid coordinates.");
    }
}

// Handle form submission
document.getElementById("add-knot").addEventListener("click", addKnot);

// Compute and display the initial path
updatePath();

// Compute the path
const pathData = computePathThroughKnots(knots);

// Display the path on an SVG element
const svg = document.getElementById("curve-container");
const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
path.setAttribute("d", pathData);
path.setAttribute("stroke", "blue");
path.setAttribute("fill", "none");
svg.appendChild(path);
