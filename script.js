// JavaScript equivalent of EPointF class (same as before)

const knots = [];

// Function to compute the cubic Bezier path and update the SVG
function updatePath() {
    const pathData = computePathThroughKnots(knots);
    const svg = document.getElementById("curve-container");
    svg.innerHTML = ""; // Clear previous paths

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "blue");
    path.setAttribute("fill", "none");
    svg.appendChild(path);
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
