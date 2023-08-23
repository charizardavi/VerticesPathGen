const canvas = document.getElementById("bezierCanvas");
const ctx = canvas.getContext("2d");
const bgImage = new Image();

bgImage.onload = function () {
  render();
};
bgImage.src = "background.png";

const colors = [
  "#FF0000", // Red
  "#00FF00", // Lime
  "#0000FF", // Blue
  "#FFA500", // Orange
  "#FF00FF", // Fuchsia
  "#00FFFF", // Aqua
  "#800080", // Purple
  "#808000", // Olive
  "#008080", // Teal
  "#800000", // Maroon
  "#FFD700", // Gold
  "#C0C0C0", // Silver
  "#32CD32", // LimeGreen
  "#FA8072", // Salmon
  "#6B8E23", // OliveDrab
  "#8B4513", // SaddleBrown
  "#5F9EA0", // CadetBlue
  "#D2691E", // Chocolate
  "#B0E0E6", // PowderBlue
  "#20B2AA", // LightSeaGreen
];
const pointsData = document.getElementById("pointsData");

pointsData.addEventListener("input", function (event) {
  const element = event.target;
  if (element.tagName === "INPUT") {
    const index = element.getAttribute("data-index");
    const key = element.getAttribute("data-key").split("-");
    const value = parseFloat(element.value);

    if (Number.isFinite(value)) {
      shapes[index][key[0]][key[1]] = value;

      if (
        key[0] === "endPoint" &&
        key[1] === "x" &&
        index < shapes.length - 1
      ) {
        shapes[parseInt(index) + 1].startPoint.x = value;
      }

      render();
    }
  }
});

let isDragging = false;
let draggedShapeIndex = null; // renamed for clarity
let draggedPointKey = null;

let shapes = [
  {
    type: "bezier",
    startPoint: { x: -50, y: 0 },
    controlPoint: { x: 0, y: 50 },
    endPoint: { x: 50, y: 0 },
  },
];

function addShape(type) {
  const lastShape = shapes[shapes.length - 1];
  let newEndPoint = {
    x: Math.min(Math.max(lastShape.endPoint.x + 50, -72), 72),
    y: Math.min(Math.max(lastShape.endPoint.y, -72), 72),
  };

  if (type === "bezier") {
    let newControlPoint = {
      x: Math.min(
        Math.max((lastShape.endPoint.x + newEndPoint.x) / 2, -72),
        72
      ),
      y: Math.min(Math.max(lastShape.endPoint.y - 50, -72), 72),
    };

    shapes.push({
      type: "bezier",
      startPoint: { ...lastShape.endPoint },
      controlPoint: newControlPoint,
      endPoint: newEndPoint,
    });
  } else if (type === "line") {
    shapes.push({
      type: "line",
      startPoint: { ...lastShape.endPoint },
      endPoint: newEndPoint,
    });
  }

  updateInputs();
  render();
}

function makeSmooth() {
  const deltaT = 0.001;
  const epsilon = 10; 

  for (let i = 0; i < shapes.length - 1; i++) { // ignore last curve
    let currentCurve = shapes[i];
    let nextCurve = shapes[i + 1];

    // Calculate relevant derivatives
    let endPointDerivative = calculateDerivative(currentCurve, deltaT, "end");
    let nextCurveStartPointDerivative = calculateDerivative(nextCurve, deltaT, "start");

    console.log(endPointDerivative);
    console.log(nextCurveStartPointDerivative);

    // Adjust the control point of the current curve to match derivatives
    currentCurve.controlPoint = adjustControlPoint(
      currentCurve.controlPoint,
      endPointDerivative,
      nextCurveStartPointDerivative,
      epsilon
    );
  }
  updateInputs();
  render();
}

function calculateDerivative(curve, deltaT, pointType) {
  if (pointType == "start") {
    return 3;
  } else if (pointType == "end") {
    return 4;
  }
}

function adjustControlPoint(controlPoint, endPointDerivative, nextCurveStartPointDerivative, epsilon) {
  
  // Adjust the control point to match the derivatives
  if (endPointDerivative < nextCurveStartPointDerivative) {
    controlPoint.y -= epsilon; // Decrease y
  } else if (endPointDerivative > nextCurveStartPointDerivative) {
    controlPoint.y += epsilon; // Increase y
  }
}

canvas.addEventListener("mousedown", function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  for (let i = 0; i < shapes.length; i++) {
    const keys =
      shapes[i].type === "bezier"
        ? ["startPoint", "controlPoint", "endPoint"]
        : ["startPoint", "endPoint"];
    for (let key of keys) {
      if (i > 0 && key === "startPoint") continue;
      if (distance({ x, y }, convertToCanvasCoords(shapes[i][key])) < 10) {
        isDragging = true;
        draggedShapeIndex = i;
        draggedPointKey = key;
        return;
      }
    }
  }
});

canvas.addEventListener("mousemove", function (event) {
  if (!isDragging || draggedShapeIndex === null) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  shapes[draggedShapeIndex][draggedPointKey] = convertToUserCoords({ x, y });

  if (draggedPointKey === "endPoint" && draggedShapeIndex < shapes.length - 1) {
    shapes[draggedShapeIndex + 1].startPoint =
      shapes[draggedShapeIndex].endPoint;
  }

  updateInputs();
  render();
});

canvas.addEventListener("mouseup", function () {
  isDragging = false;
  draggedShapeIndex = null;
  draggedPointKey = null;
});

function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function convertToCanvasCoords(point) {
  return {
    x: canvas.width / 2 + (point.x / 144) * canvas.width,
    y: canvas.height / 2 - (point.y / 144) * canvas.height,
  };
}

function convertToUserCoords(point) {
  return {
    x: (point.x - canvas.width / 2) / (canvas.width / 144),
    y: (canvas.height / 2 - point.y) / (canvas.height / 144),
  };
}

function updateInputs() {
  pointsData.innerHTML = ""; // clear current inputs

  shapes.forEach((shape, index) => {
    const div = document.createElement("div");

    if (shape.type === "bezier") {
      const equation = generateBezierEquation(shape);
      div.innerHTML = `
                <strong>Bezier ${index + 1}</strong><br>
                Equation: x(t) = ${equation.x}, y(t) = ${equation.y} <br>
                Start: <input type="text" value="${
                  shape.startPoint.x
                }" data-index="${index}" data-key="startPoint-x"> <input type="text" value="${
        shape.startPoint.y
      }" data-index="${index}" data-key="startPoint-y"><br>
                Control: <input type="text" value="${
                  shape.controlPoint.x
                }" data-index="${index}" data-key="controlPoint-x"> <input type="text" value="${
        shape.controlPoint.y
      }" data-index="${index}" data-key="controlPoint-y"><br>
                End: <input type="text" value="${
                  shape.endPoint.x
                }" data-index="${index}" data-key="endPoint-x"> <input type="text" value="${
        shape.endPoint.y
      }" data-index="${index}" data-key="endPoint-y">
            `;
    } else if (shape.type === "line") {
      const equation = generateLineEquation(shape);
      div.innerHTML = `
                <strong>Line ${index + 1}</strong><br>
                Equation: x(t) = ${equation.x}, y(t) = ${equation.y} <br>
                Start: <input type="text" value="${
                  shape.startPoint.x
                }" data-index="${index}" data-key="startPoint-x"> <input type="text" value="${
        shape.startPoint.y
      }" data-index="${index}" data-key="startPoint-y"><br>
                End: <input type="text" value="${
                  shape.endPoint.x
                }" data-index="${index}" data-key="endPoint-x"> <input type="text" value="${
        shape.endPoint.y
      }" data-index="${index}" data-key="endPoint-y">
            `;
    }
    pointsData.appendChild(div);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  drawAxis();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  shapes.forEach((shape, index) => {
    if (shape.type === "bezier") {
      ctx.beginPath();
      ctx.moveTo(...Object.values(convertToCanvasCoords(shape.startPoint)));
      ctx.quadraticCurveTo(
        ...Object.values(convertToCanvasCoords(shape.controlPoint)),
        ...Object.values(convertToCanvasCoords(shape.endPoint))
      );
      ctx.stroke();
      ctx.fillStyle = colors[index % colors.length];
      for (let point of [
        shape.startPoint,
        shape.controlPoint,
        shape.endPoint,
      ]) {
        const { x, y } = convertToCanvasCoords(point);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else if (shape.type === "line") {
      ctx.beginPath();
      ctx.moveTo(...Object.values(convertToCanvasCoords(shape.startPoint)));
      ctx.lineTo(...Object.values(convertToCanvasCoords(shape.endPoint)));
      ctx.stroke();

      ctx.fillStyle = colors[index % colors.length];
      const { x: startX, y: startY } = convertToCanvasCoords(shape.startPoint);
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
      ctx.fill();

      const { x: endX, y: endY } = convertToCanvasCoords(shape.endPoint);
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

function drawAxis() {
  ctx.strokeStyle = "#aaa";
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
    y: eqY,
  };
}
function generateLineEquation(line) {
  const eqX = `${line.startPoint.x} + t(${
    line.endPoint.x - line.startPoint.x
  })`;
  const eqY = `${line.startPoint.y} + t(${
    line.endPoint.y - line.startPoint.y
  })`;
  return {
    x: eqX,
    y: eqY,
  };
}

document
  .getElementById("addBezier")
  .addEventListener("click", () => addShape("bezier"));
document
  .getElementById("addLine")
  .addEventListener("click", () => addShape("line"));

document
  .getElementById("makeSmooth")
  .addEventListener("click", () => makeSmooth());

updateInputs();
render();
