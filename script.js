const canvas = document.getElementById('bezierCanvas');
const ctx = canvas.getContext('2d');
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#FF00FF', '#00FFFF', '#800080', '#808000', '#008080', '#800000'];
const pointsData = document.getElementById('pointsData');
pointsData.addEventListener('input', function(event) {
    const element = event.target;
    if (element.tagName === 'INPUT') {
        const index = element.getAttribute('data-index');
        const key = element.getAttribute('data-key').split('-');
        const value = parseFloat(element.value);

        if (Number.isFinite(value)) {
            beziers[index][key[0]][key[1]] = value;

            if (key[0] === 'endPoint' && key[1] === 'x' && index < beziers.length - 1) {
                beziers[parseInt(index) + 1].startPoint.x = value;
            }

            render();
        }
    }
});

let isDragging = false;
let draggedBezierIndex = null;
let draggedPointKey = null;

let beziers = [{
    startPoint: { x: -50, y: 0 },
    controlPoint: { x: 0, y: 50 },
    endPoint: { x: 50, y: 0 }
}];

function addBezier() {
    const lastBezier = beziers[beziers.length - 1];
    const newEndPointX = Math.min(lastBezier.endPoint.x + 50, 72);
    
    beziers.push({
        startPoint: { ...lastBezier.endPoint },
        controlPoint: { x: (lastBezier.endPoint.x + newEndPointX) / 2, y: lastBezier.endPoint.y - 50 },
        endPoint: { x: newEndPointX, y: lastBezier.endPoint.y }
    });
    
    updateInputs();
    render();
}

canvas.addEventListener('mousedown', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < beziers.length; i++) {
        for (let key of ['startPoint', 'controlPoint', 'endPoint']) {
            if (i > 0 && key === 'startPoint') continue; // Skip non-first start points as they're shared
            if (distance({ x, y }, convertToCanvasCoords(beziers[i][key])) < 10) {
                isDragging = true;
                draggedBezierIndex = i;
                draggedPointKey = key;
                return;
            }
        }
    }
});

canvas.addEventListener('mousemove', function(event) {
    if (!isDragging || draggedBezierIndex === null) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    beziers[draggedBezierIndex][draggedPointKey] = convertToUserCoords({ x, y });

    if (draggedPointKey === 'endPoint' && draggedBezierIndex < beziers.length - 1) {
        beziers[draggedBezierIndex + 1].startPoint = beziers[draggedBezierIndex].endPoint;
    }

    updateInputs();
    render();
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
    draggedBezierIndex = null;
    draggedPointKey = null;
});

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function convertToCanvasCoords(point) {
    return {
        x: canvas.width / 2 + (point.x / 144) * canvas.width,
        y: canvas.height / 2 - (point.y / 144) * canvas.height
    };
}

function convertToUserCoords(point) {
    return {
        x: (point.x - canvas.width / 2) / (canvas.width / 144),
        y: (canvas.height / 2 - point.y) / (canvas.height / 144)
    };
}

function updateInputs() {
    pointsData.innerHTML = '';  // clear current inputs
    beziers.forEach((bezier, index) => {
        const equation = generateBezierEquation(bezier);
        const div = document.createElement('div');
        div.innerHTML = `
            <strong>Bezier ${index + 1}</strong><br>
            Equation: x(t) = ${equation.x}, y(t) = ${equation.y} <br>
            Start: <input type="text" value="${bezier.startPoint.x}" data-index="${index}" data-key="startPoint-x"> <input type="text" value="${bezier.startPoint.y}" data-index="${index}" data-key="startPoint-y"><br>
            Control: <input type="text" value="${bezier.controlPoint.x}" data-index="${index}" data-key="controlPoint-x"> <input type="text" value="${bezier.controlPoint.y}" data-index="${index}" data-key="controlPoint-y"><br>
            End: <input type="text" value="${bezier.endPoint.x}" data-index="${index}" data-key="endPoint-x"> <input type="text" value="${bezier.endPoint.y}" data-index="${index}" data-key="endPoint-y">
        `;
        pointsData.appendChild(div);
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxis();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    beziers.forEach((bezier, index) => {
        ctx.beginPath();
        ctx.moveTo(...Object.values(convertToCanvasCoords(bezier.startPoint)));
        ctx.quadraticCurveTo(...Object.values(convertToCanvasCoords(bezier.controlPoint)), ...Object.values(convertToCanvasCoords(bezier.endPoint)));
        ctx.stroke();

        ctx.fillStyle = colors[index % colors.length];
        for (let point of [bezier.startPoint, bezier.controlPoint, bezier.endPoint]) {
            const { x, y } = convertToCanvasCoords(point);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

function drawAxis() {
    ctx.strokeStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function generateBezierEquation(bezier) {
    const eqX = `(1-t)^2(${bezier.startPoint.x}) + 2(1-t)t(${bezier.controlPoint.x}) + t^2(${bezier.endPoint.x})`;
    const eqY = `(1-t)^2(${bezier.startPoint.y}) + 2(1-t)t(${bezier.controlPoint.y}) + t^2(${bezier.endPoint.y})`;
    return {
        x: eqX,
        y: eqY
    };
}

document.getElementById('addBezier').addEventListener('click', addBezier);

updateInputs();
render();
