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
  "#7FFF00", // Chartreuse
  "#DB7093", // PaleVioletRed
  "#ADFF2F", // GreenYellow
  "#FF4500", // OrangeRed
  "#2E8B57", // SeaGreen
  "#FF6347", // Tomato
  "#4169E1", // RoyalBlue
  "#8A2BE2", // BlueViolet
  "#7B68EE", // MediumSlateBlue
  "#4682B4", // SteelBlue
  "#D2B48C", // Tan
  "#DDA0DD", // Plum
  "#BC8F8F", // RosyBrown
  "#5F9EA0", // CadetBlue
  "#A52A2A", // Brown
  "#B22222", // FireBrick
  "#228B22", // ForestGreen
  "#8B008B", // DarkMagenta
  "#FF1493", // DeepPink
  "#CD5C5C", // IndianRed
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
];

function addShape(type) {
  let lastShape = shapes[shapes.length - 1];
  if (shapes.length === 0){
    lastShape =   {
        type: "bezier",
        startPoint: { x: -50, y: 0 },
        controlPoint: { x: 0, y: 50 },
        endPoint: { x: 50, y: 0 },
      }
  }

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
  } else if (type === "cubicBezier") {
    let newControlPoint1 = {
      x: Math.min(Math.max(lastShape.endPoint.x + 25, -72), 72),
      y: Math.min(Math.max(lastShape.endPoint.y - 25, -72), 72),
    };
    let newControlPoint2 = {
      x: Math.min(Math.max(newEndPoint.x - 25, -72), 72),
      y: Math.min(Math.max(newEndPoint.y + 25, -72), 72),
    };

    shapes.push({
      type: "cubicBezier",
      startPoint: { ...lastShape.endPoint },
      controlPoint1: newControlPoint1,
      controlPoint2: newControlPoint2,
      endPoint: newEndPoint,
    });
  }

  updateInputs();
  render();
}

function makeSmooth() {
  let deltaT = 0.001;
  let epsilon = 0.01;

  for (let i = 0; i < shapes.length - 1; i++) {
    // ignore last curve
    let currentShape = shapes[i];
    let nextShape = shapes[i + 1];

    // Calculate relevant derivatives
    let endPointDerivative = calculateDerivative(currentShape, deltaT, "end");
    let nextShapeStartPointDerivative = calculateDerivative(
      nextShape,
      deltaT,
      "start"
    );

    console.log(endPointDerivative);
    console.log(nextShapeStartPointDerivative);

    // Adjust the control point of the current curve to match derivatives
    currentShape.controlPoint = adjustControlPoint(
      currentShape.controlPoint,
      endPointDerivative,
      nextShapeStartPointDerivative,
      epsilon
    );
    shapes.splice(i, 1, currentShape);
  }
  updateInputs();
  render();
}

function calculateDerivative(curve, deltaT, pointType) {
  let init;
  let change;
  let equation;

  if (pointType === "start") {
    init = 0;
    change = deltaT;
  }
  if (pointType === "end") {
    init = 1;
    change = -1 * deltaT;
  }

  if (curve.type === "bezier") {
    equation = generateBezierEquation(curve);
  } else if (curve.type === "line") {
    equation = generateLineEquation(curve);
  }
  console.log(equation);

  const x1 = eval(equation.x.replace(/t/g, init.toString()));
  const y1 = eval(equation.y.replace(/t/g, init.toString()));

  const x2 = eval(equation.x.replace(/t/g, (init + change).toString()));
  const y2 = eval(equation.y.replace(/t/g, (init + change).toString()));

  /*var t = init;
  const x1 = eval(equation.x);
  const y1 = eval(equation.y);

  var t = init + change;
  const x2 = eval(equation.x);
  const y2 = eval(equation.y);
  */

  const deltaX = (x2 - x1) / change;
  const deltaY = (y2 - y1) / change;

  const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return {
    x: deltaX,
    y: deltaY,
    total: delta,
  };
}

function adjustControlPoint(
  controlPoint,
  endPointDerivative,
  nextShapeStartPointDerivative,
  epsilon
) {
  // Adjust the control point to match the derivatives
  if (endPointDerivative.total < nextShapeStartPointDerivative.total) {
    controlPoint.y -=
      Math.abs(endPointDerivative.y - nextShapeStartPointDerivative.y) *
      epsilon;
    controlPoint.x +=
      Math.abs(endPointDerivative.x - nextShapeStartPointDerivative.x) *
      epsilon;
  } else if (endPointDerivative > nextShapeStartPointDerivative) {
    controlPoint.y +=
      Math.abs(endPointDerivative.y - nextShapeStartPointDerivative.y) *
      epsilon;
    controlPoint.x -=
      Math.abs(endPointDerivative.x - nextShapeStartPointDerivative.x) *
      epsilon;
  }
  return controlPoint;
}

canvas.addEventListener("mousedown", function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  for (let i = 0; i < shapes.length; i++) {
    const keys =
      shapes[i].type === "bezier"
        ? ["startPoint", "controlPoint", "endPoint"]
        : shapes[i].type === "cubicBezier"
        ? ["startPoint", "controlPoint1", "controlPoint2", "endPoint"]
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

    if (shape.type === "bezier" && index === 0) {
      div.innerHTML = `
                <strong>Bezier ${index + 1}</strong><br><br>
                Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new QuadCurve(new Point(${shape.controlPoint.x}, ${
        shape.controlPoint.y
      }), new Point(${shape.endPoint.x}, ${shape.endPoint.y}), HEADING)</code> <br>
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
    } else if (shape.type === "line" && index === 0) {
      div.innerHTML = `
                <strong>Line ${index + 1}</strong><br><br>
                Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new Line(new Point(${shape.endPoint.x}, ${
        shape.endPoint.y
      }), HEADING)</code><br>
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
    } else if (shape.type === "bezier" && index != 0) {
      div.innerHTML = `
                <strong>Bezier ${index + 1}</strong><br><br>
                Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new QuadCurve(new Point(${shape.controlPoint.x}, ${
        shape.controlPoint.y
      }), new Point(${shape.endPoint.x}, ${shape.endPoint.y}), HEADING)</code> <br>
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
    } else if (shape.type === "line" && index != 0) {
      div.innerHTML = `
                <strong>Line ${index + 1}</strong><br><br>
                Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new Line(new Point(${shape.endPoint.x}, ${
        shape.endPoint.y
      }), HEADING)</code> <br>

                End: <input type="text" value="${
                  shape.endPoint.x
                }" data-index="${index}" data-key="endPoint-x"> <input type="text" value="${
        shape.endPoint.y
      }" data-index="${index}" data-key="endPoint-y">
            `;
    } else if (shape.type === "cubicBezier" && index !=0) {
      div.innerHTML = `
      <strong>Cubic Bezier ${index + 1}</strong><br><br>
      Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new CubicCurve(new Point(${shape.controlPoint1.x}, ${
        shape.controlPoint1.y
      }), new Point(${shape.controlPoint2.x}, ${
        shape.controlPoint2.y
      }), new Point(${shape.endPoint.x}, ${shape.endPoint.y}), HEADING)</code> <br>
      Control1: <input type="text" value="${
        shape.controlPoint1.x
      }" data-index="${index}" data-key="controlPoint1-x"> <input type="text" value="${
        shape.controlPoint1.y
      }" data-index="${index}" data-key="controlPoint1-y"><br>
      Control2: <input type="text" value="${
        shape.controlPoint2.x
      }" data-index="${index}" data-key="controlPoint2-x"> <input type="text" value="${
        shape.controlPoint2.y
      }" data-index="${index}" data-key="controlPoint2-y"><br>
      End: <input type="text" value="${
        shape.endPoint.x
      }" data-index="${index}" data-key="endPoint-x"> <input type="text" value="${
        shape.endPoint.y
      }" data-index="${index}" data-key="endPoint-y">
      `;
    }
    else if (shape.type === "cubicBezier" && index === 0) {
      div.innerHTML = `
      <strong>Cubic Bezier ${index + 1}</strong><br><br>
      Code: <code>Point start = new Point(${shape.startPoint.x}, ${
        shape.startPoint.y
      }), new CubicCurve(new Point(${shape.controlPoint1.x}, ${
        shape.controlPoint1.y
      }), new Point(${shape.controlPoint2.x}, ${
        shape.controlPoint2.y
      }), new Point(${shape.endPoint.x}, ${shape.endPoint.y}), HEADING)</code> <br>
      Start: <input type="text" value="${
        shape.startPoint.x
      }" data-index="${index}" data-key="startPoint-x"> <input type="text" value="${
shape.startPoint.y
}" data-index="${index}" data-key="startPoint-y"><br>
      Control1: <input type="text" value="${
        shape.controlPoint1.x
      }" data-index="${index}" data-key="controlPoint1-x"> <input type="text" value="${
        shape.controlPoint1.y
      }" data-index="${index}" data-key="controlPoint1-y"><br>
      Control2: <input type="text" value="${
        shape.controlPoint2.x
      }" data-index="${index}" data-key="controlPoint2-x"> <input type="text" value="${
        shape.controlPoint2.y
      }" data-index="${index}" data-key="controlPoint2-y"><br>
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
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
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
      ctx.arc(startX, startY, 8, 0, 2 * Math.PI);
      ctx.fill();

      const { x: endX, y: endY } = convertToCanvasCoords(shape.endPoint);
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, 2 * Math.PI);
      ctx.fill();
    } else if (shape.type === "cubicBezier") {
      ctx.beginPath();
      ctx.moveTo(...Object.values(convertToCanvasCoords(shape.startPoint)));
      ctx.bezierCurveTo(
        ...Object.values(convertToCanvasCoords(shape.controlPoint1)),
        ...Object.values(convertToCanvasCoords(shape.controlPoint2)),
        ...Object.values(convertToCanvasCoords(shape.endPoint))
      );
      ctx.stroke();

      ctx.fillStyle = colors[index % colors.length];
      for (let point of [
        shape.startPoint,
        shape.controlPoint1,
        shape.controlPoint2,
        shape.endPoint,
      ]) {
        const { x, y } = convertToCanvasCoords(point);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
}

function drawAxis() {
  // Draw the axes lines
  ctx.strokeStyle = "#aaa";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  // Add labels for the axes
  ctx.font = '13px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Labels for x-axis
  ctx.fillText('+X', canvas.width - 10, canvas.height / 2 - 20);
  ctx.fillText('-X', 10, canvas.height / 2 - 20);

  // Labels for y-axis
  ctx.fillText('+Y', canvas.width / 2 + 20, 10);
  ctx.fillText('-Y', canvas.width / 2 + 20, canvas.height - 10);

  // Degree labels
  ctx.fillText('0°', canvas.width - 10, canvas.height / 2 + 20);
  ctx.fillText('180°', 17, canvas.height / 2 + 20);
  ctx.fillText('90°', canvas.width / 2 + 20, 30);
  ctx.fillText('270°', canvas.width / 2 + 20, canvas.height - 30);
}


function generateBezierEquation(bezier) {
  const eqX = `(1-t)**2 * (${bezier.startPoint.x}) + 2 * (1-t)*t*(${bezier.controlPoint.x}) + t**2 * (${bezier.endPoint.x})`;
  const eqY = `(1-t)**2 * (${bezier.startPoint.y}) + 2 * (1-t)*t*(${bezier.controlPoint.y}) + t**2 * (${bezier.endPoint.y})`;
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

// document
//   .getElementById("addBezier")
//   .addEventListener("click", () => addShape("bezier"));

document
  .getElementById("addLine")
  .addEventListener("click", () => addShape("line"));

// document
//   .getElementById("makeSmooth")
//   .addEventListener("click", () => makeSmooth());

document
  .getElementById("addCubicBezier")
  .addEventListener("click", function () {
    addShape("cubicBezier");
  });
  
updateInputs();
render();


function removeLast(){
  if (shapes.length != 0){
    shapes = shapes.slice(0, shapes.length-1);
  }
  updateInputs();
  render();
}

function onShapeDataChanged() {
  updateInputs();
  render();
  const permalink = generatePermalink();
  // Do something with permalink, like updating a link or displaying it
}

// Function to generate permalink
function generatePermalink() {
  const serializedShapes = encodeURIComponent(JSON.stringify(shapes));
  // const permalink = `${window.location.origin}${window.location.pathname}?data=${serializedShapes}`;
  const permalink = `https://verticespathgen.vercel.app?data=${serializedShapes}`;

  return permalink;
}

// Function to load from permalink
function loadFromPermalink() {
  const params = new URLSearchParams(window.location.search);
  const serializedShapes = params.get('data');
  if (serializedShapes) {
    try {
      shapes = JSON.parse(decodeURIComponent(serializedShapes));
      updateInputs();
      render();
    } catch (error) {
      console.error("Failed to load from permalink:", error);
    }
  }
}

// Function to export permalink
function exportPermalink() {
  const permalink = generatePermalink();
  navigator.clipboard.writeText(permalink).then(() => {
    alert('Permalink copied to clipboard');
  });
}

loadFromPermalink();

document.getElementById("loadFromInput").addEventListener("click", function() {
  const input = document.getElementById("permalinkInput").value;

  if (input) {
    try {
      const url = new URL(input);
      const params = new URLSearchParams(url.search);
      const serializedShapes = params.get('data');
      
      if (serializedShapes) {
        // shapes = JSON.parse(atob(serializedShapes)); // If  Base64 encoding

        shapes = JSON.parse(decodeURIComponent(serializedShapes)); // If URL encoding

        updateInputs();
        render();
      } else {
        alert("Invalid URL: No data parameter found.");
      }
    } catch (error) {
      alert("An error occurred: " + error.toString());
    }
  } else {
    alert("Please paste a URL in the text box.");
  }
});