/**
 * YOUR DOMINO COLORS
 * This list will be populated by the color picker tool.
 * You can also paste a previously generated list here.
 */
let DOMINO_COLORS = [];

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', displayAvailableColors);

document.getElementById('pickerUploader').addEventListener('change', (event) => {
    const canvas = document.getElementById('colorPickerCanvas');
    const ctx = canvas.getContext('2d');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
});

document.getElementById('colorPickerCanvas').addEventListener('click', (event) => {
    const canvas = event.target;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = [pixel[0], pixel[1], pixel[2]];

    if (!DOMINO_COLORS.some(c => JSON.stringify(c) === JSON.stringify(color))) {
        DOMINO_COLORS.push(color);
        displayAvailableColors();
    }
});

document.getElementById('clearPaletteButton').addEventListener('click', () => {
    DOMINO_COLORS = [];
    displayAvailableColors();
});

document.getElementById('generateButton').addEventListener('click', () => {
    if (DOMINO_COLORS.length === 0) {
        alert("Please define a color palette first by picking colors from an image.");
        return;
    }
    const uploader = document.getElementById('imageUploader');
    const width = parseInt(document.getElementById('fieldWidth').value);
    const height = parseInt(document.getElementById('fieldHeight').value);

    if (uploader.files && uploader.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                processImage(img, width, height);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(uploader.files[0]);
    } else {
        alert("Please select an image to convert.");
    }
});


// --- CORE FUNCTIONS ---

/**
 * This function is updated to display the DOMINO_COLORS array
 * as a copy-pasteable code block with inline color swatches.
 */
function displayAvailableColors() {
    const paletteContainer = document.getElementById('colorPalette');

    let htmlContent = 'let DOMINO_COLORS = [\n';

    DOMINO_COLORS.forEach(color => {
        const colorString = `    [${color[0]}, ${color[1]}, ${color[2]}],`;
        const colorBox = `<div class="color-block-inline" style="background-color: rgb(${color[0]}, ${color[1]}, ${color[2]})"></div>`;
        htmlContent += `${colorString} ${colorBox}\n`;
    });

    htmlContent += '];';
    paletteContainer.innerHTML = htmlContent;
}

function processImage(img, width, height) {
    const palette = DOMINO_COLORS;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const colorGrid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            const pixelColor = [pixelData[0], pixelData[1], pixelData[2]];
            const closestColor = findClosestColor(pixelColor, palette);
            row.push(closestColor);
        }
        colorGrid.push(row);
    }

    createDominoField(colorGrid, width);
    createRowList(colorGrid);
    createTotalCount(colorGrid);
}

function findClosestColor(color, palette) {
    if (palette.length === 0) return [0, 0, 0];
    let closest = palette[0];
    let minDistance = Infinity;

    for (const paletteColor of palette) {
        let distance = Math.sqrt(
            Math.pow(color[0] - paletteColor[0], 2) +
            Math.pow(color[1] - paletteColor[1], 2) +
            Math.pow(color[2] - paletteColor[2], 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closest = paletteColor;
        }
    }
    return closest;
}

function createDominoField(grid, width) {
    const field = document.getElementById('dominoField');
    field.innerHTML = '';
    field.style.gridTemplateColumns = `repeat(${width}, 25px)`;
    grid.flat().forEach(color => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        field.appendChild(cell);
    });
}

function createRowList(grid) {
    const list = document.getElementById('rowList');
    list.innerHTML = '';
    grid.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row-sequence');
        if (row.length === 0) return;

        let currentColor = row[0];
        let count = 1;

        for (let i = 1; i < row.length; i++) {
            if (JSON.stringify(row[i]) === JSON.stringify(currentColor)) {
                count++;
            } else {
                appendSequence(rowDiv, currentColor, count);
                currentColor = row[i];
                count = 1;
            }
        }
        appendSequence(rowDiv, currentColor, count);
        list.appendChild(rowDiv);
    });
}

function createTotalCount(grid) {
    const countDiv = document.getElementById('totalCount');
    countDiv.innerHTML = '';
    const colorTotals = {};

    grid.flat().forEach(color => {
        const key = JSON.stringify(color);
        colorTotals[key] = (colorTotals[key] || 0) + 1;
    });

    for (const key in colorTotals) {
        const summaryDiv = document.createElement('div');
        summaryDiv.classList.add('color-summary');
        const color = JSON.parse(key);
        appendSequence(summaryDiv, color, colorTotals[key]);
        countDiv.appendChild(summaryDiv);
    }
}

function appendSequence(container, color, count) {
    const colorBlock = document.createElement('div');
    colorBlock.classList.add('color-block');
    colorBlock.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    container.appendChild(colorBlock);

    const countSpan = document.createElement('span');
    countSpan.classList.add('count');
    countSpan.textContent = count;
    container.appendChild(countSpan);
}
