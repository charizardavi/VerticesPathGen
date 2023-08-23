const canvas = document.getElementById('bezierCanvas');
const ctx = canvas.getContext('2d');

let isDragging = false;
let draggedPoint;

// Initial values
let startPoint = { x: -50, y: 0 };
let controlPoint = { x: 0, y: 50 };
let endPoint = { x: 50, y: 0 };

canvas.addEventListener('mousedown', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (distance({ x, y }, convertToCanvasCoords(startPoint)) < 10) {
        isDragging = true;
        draggedPoint = 'start';
    } else if (distance({ x, y }, convertToCanvasCoords(controlPoint)) < 10) {
        isDragging = true;
        draggedPoint = 'control';
    } else if (distance({ x, y }, convertToCanvasCoords(endPoint)) < 10) {
        isDragging = true;
        draggedPoint = 'end';
    }
});

canvas.addEventListener('mousemove', function (event) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (draggedPoint === 'start') {
        startPoint = convertToUserCoords({ x, y });
    } else if (draggedPoint === 'control') {
        controlPoint = convertToUserCoords({ x, y });
    } else if (draggedPoint === 'end') {
        endPoint = convertToUserCoords({ x, y });
    }

    render();
});

canvas.addEventListener('mouseup', function () {
    isDragging = false;
    draggedPoint = null;
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

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the coordinate axis
    drawAxis();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...Object.values(convertToCanvasCoords(startPoint)));
    ctx.quadraticCurveTo(...Object.values(convertToCanvasCoords(controlPoint)), ...Object.values(convertToCanvasCoords(endPoint)));
    ctx.stroke();

    ctx.fillStyle = 'red';
    for (let point of [startPoint, controlPoint, endPoint]) {
        const { x, y } = convertToCanvasCoords(point);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    document.getElementById('output').textContent = `B(t) = (1-t)²(${startPoint.x}, ${startPoint.y}) + 2(1-t)t(${controlPoint.x}, ${controlPoint.y}) + t²(${endPoint.x}, ${endPoint.y})`;
}

function drawAxis() {
    ctx.strokeStyle = '#333'; // Color of the axis
    ctx.lineWidth = 1;

    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Add markers on x and y axis
    ctx.fillStyle = '#666'; // Color of the markers
    for (let i = -72; i <= 72; i+=12) { // You can adjust the step of 12 if needed
        if (i === 0) continue;
        let {x, y} = convertToCanvasCoords({x: i, y: 0});
        ctx.fillRect(x, canvas.height / 2 - 5, 1, 10); // x-axis markers

        x = convertToCanvasCoords({x: 0, y: i}).x;
        y = convertToCanvasCoords({x: i, y: 0}).y;
        ctx.fillRect(canvas.width / 2 - 5, y, 10, 1); // y-axis markers
    }
}

render();
