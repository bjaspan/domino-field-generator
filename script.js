/**
 * YOUR DOMINO COLORS
 * This list will be populated by the color picker tool.
 * You can also paste a previously generated list here.
 */
let DOMINO_COLORS = [
    [224, 218, 196],
    [210, 41, 38],
    [252, 127, 3],
    [247, 193, 5],
    [70, 204, 56],
    [90, 54, 31],
    [55, 67, 79],
    [8, 124, 190],
    [24, 90, 169],
    [112, 95, 139],
    [201, 45, 106],
    [192, 174, 134],
    [140, 142, 131],
];
let pickerImage = null; // This will hold the full-resolution image for sampling

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', displayAvailableColors);

// This listener now stores the uploaded image for later use
document.getElementById('pickerUploader').addEventListener('change', (event) => {
    const canvas = document.getElementById('colorPickerCanvas');
    const ctx = canvas.getContext('2d');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Store the full-resolution image object
            pickerImage = img;
            // Draw the image to the visible canvas. This canvas can be scaled by CSS
            // without affecting our color picking logic.
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
});

/**
 * This is the corrected event listener.
 * It uses a more robust method that works correctly with large, scaled images.
 */
document.getElementById('colorPickerCanvas').addEventListener('click', (event) => {
    if (!pickerImage) {
        alert("Please upload an image to pick colors from first.");
        return;
    }

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();

    // 1. Calculate the click position as a ratio (e.g., 0.75 for 75%) of the DISPLAYED canvas
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;

    // 2. Determine the corresponding pixel coordinates in the ORIGINAL, FULL-RESOLUTION image
    const sourceX = Math.floor(xRatio * pickerImage.naturalWidth);
    const sourceY = Math.floor(yRatio * pickerImage.naturalHeight);

    // 3. Create a tiny, 1x1 off-screen canvas to perform the color sampling
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 1;
    offscreenCanvas.height = 1;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // 4. Draw just the single pixel we want from the full-res image onto our tiny canvas
    offscreenCtx.drawImage(pickerImage, sourceX, sourceY, 1, 1, 0, 0, 1, 1);

    // 5. Get the color data from our 1x1 canvas
    const pixel = offscreenCtx.getImageData(0, 0, 1, 1).data;
    const color = [pixel[0], pixel[1], pixel[2]];

    // Add the new color to our list (avoiding duplicates)
    if (!DOMINO_COLORS.some(c => JSON.stringify(c) === JSON.stringify(color))) {
        DOMINO_COLORS.push(color);
        displayAvailableColors();
    }
});


document.getElementById('clearPaletteButton').addEventListener('click', () => {
    DOMINO_COLORS = [];
    pickerImage = null;
    const canvas = document.getElementById('colorPickerCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
