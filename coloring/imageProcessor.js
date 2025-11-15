// Image processing and edge detection
class ImageProcessor {
    constructor() {
        this.width = 0;
        this.height = 0;
    }

    async processImage(imageData, params) {
        this.width = imageData.width;
        this.height = imageData.height;

        // Convert to grayscale
        const grayData = this.toGrayscale(imageData);

        // Apply Gaussian blur to reduce noise
        const blurredData = this.gaussianBlur(grayData, 1);

        // Detect edges using Sobel operator
        const edgeData = this.sobelEdgeDetection(blurredData, params.edgeThreshold);

        // Apply morphological operations to clean up edges
        const cleanedEdges = this.morphologicalClose(edgeData);

        // Thin edges
        const thinnedEdges = this.thinEdges(cleanedEdges);

        // Create ImageData for display
        const resultData = new ImageData(this.width, this.height);
        for (let i = 0; i < thinnedEdges.length; i++) {
            const val = thinnedEdges[i];
            const idx = i * 4;
            resultData.data[idx] = val;     // R
            resultData.data[idx + 1] = val; // G
            resultData.data[idx + 2] = val; // B
            resultData.data[idx + 3] = 255; // A
        }

        // Store edge data for SVG generation
        resultData.edgePixels = thinnedEdges;
        resultData.originalImage = imageData;

        return resultData;
    }

    toGrayscale(imageData) {
        const gray = new Uint8ClampedArray(this.width * this.height);

        for (let i = 0; i < gray.length; i++) {
            const idx = i * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];

            // Use luminance formula
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        return gray;
    }

    gaussianBlur(data, radius) {
        // Simple box blur approximation
        const kernel = this.createGaussianKernel(radius);
        return this.convolve(data, kernel);
    }

    createGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = new Array(size * size);
        const sigma = radius / 2;
        let sum = 0;

        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const idx = (y + radius) * size + (x + radius);
                const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                kernel[idx] = value;
                sum += value;
            }
        }

        // Normalize
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }

        return { data: kernel, size };
    }

    convolve(data, kernel) {
        const result = new Uint8ClampedArray(this.width * this.height);
        const halfSize = Math.floor(kernel.size / 2);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let sum = 0;

                for (let ky = -halfSize; ky <= halfSize; ky++) {
                    for (let kx = -halfSize; kx <= halfSize; kx++) {
                        const px = Math.max(0, Math.min(this.width - 1, x + kx));
                        const py = Math.max(0, Math.min(this.height - 1, y + ky));
                        const pidx = py * this.width + px;
                        const kidx = (ky + halfSize) * kernel.size + (kx + halfSize);

                        sum += data[pidx] * kernel.data[kidx];
                    }
                }

                result[y * this.width + x] = Math.round(sum);
            }
        }

        return result;
    }

    sobelEdgeDetection(data, threshold) {
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        const edges = new Uint8ClampedArray(this.width * this.height);
        const normalizedThreshold = (threshold / 100) * 255;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let gx = 0;
                let gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const px = x + kx;
                        const py = y + ky;
                        const pidx = py * this.width + px;
                        const kidx = (ky + 1) * 3 + (kx + 1);

                        gx += data[pidx] * sobelX[kidx];
                        gy += data[pidx] * sobelY[kidx];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edges[y * this.width + x] = magnitude > normalizedThreshold ? 255 : 0;
            }
        }

        return edges;
    }

    morphologicalClose(data) {
        // Dilation followed by erosion to close small gaps
        const dilated = this.dilate(data);
        const closed = this.erode(dilated);
        return closed;
    }

    dilate(data) {
        const result = new Uint8ClampedArray(this.width * this.height);
        const structuringElement = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],  [0, 0],  [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let maxVal = 0;

                for (const [dy, dx] of structuringElement) {
                    const px = x + dx;
                    const py = y + dy;
                    const pidx = py * this.width + px;
                    maxVal = Math.max(maxVal, data[pidx]);
                }

                result[y * this.width + x] = maxVal;
            }
        }

        return result;
    }

    erode(data) {
        const result = new Uint8ClampedArray(this.width * this.height);
        const structuringElement = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],  [0, 0],  [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let minVal = 255;

                for (const [dy, dx] of structuringElement) {
                    const px = x + dx;
                    const py = y + dy;
                    const pidx = py * this.width + px;
                    minVal = Math.min(minVal, data[pidx]);
                }

                result[y * this.width + x] = minVal;
            }
        }

        return result;
    }

    thinEdges(data) {
        // Zhang-Suen thinning algorithm
        const result = new Uint8ClampedArray(data);
        let hasChanged = true;
        let iterations = 0;
        const maxIterations = 10;

        while (hasChanged && iterations < maxIterations) {
            hasChanged = false;
            const toDelete = [];

            // Sub-iteration 1
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    const idx = y * this.width + x;
                    if (result[idx] === 255 && this.shouldDeletePixel1(result, x, y)) {
                        toDelete.push(idx);
                    }
                }
            }

            if (toDelete.length > 0) {
                hasChanged = true;
                toDelete.forEach(idx => result[idx] = 0);
                toDelete.length = 0;
            }

            // Sub-iteration 2
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    const idx = y * this.width + x;
                    if (result[idx] === 255 && this.shouldDeletePixel2(result, x, y)) {
                        toDelete.push(idx);
                    }
                }
            }

            if (toDelete.length > 0) {
                hasChanged = true;
                toDelete.forEach(idx => result[idx] = 0);
            }

            iterations++;
        }

        return result;
    }

    shouldDeletePixel1(data, x, y) {
        const neighbors = this.get8Neighbors(data, x, y);
        const blackNeighbors = neighbors.filter(n => n === 0).length;
        const transitions = this.countTransitions(neighbors);

        return (
            blackNeighbors >= 2 && blackNeighbors <= 6 &&
            transitions === 1 &&
            neighbors[0] * neighbors[2] * neighbors[4] === 0 &&
            neighbors[2] * neighbors[4] * neighbors[6] === 0
        );
    }

    shouldDeletePixel2(data, x, y) {
        const neighbors = this.get8Neighbors(data, x, y);
        const blackNeighbors = neighbors.filter(n => n === 0).length;
        const transitions = this.countTransitions(neighbors);

        return (
            blackNeighbors >= 2 && blackNeighbors <= 6 &&
            transitions === 1 &&
            neighbors[0] * neighbors[2] * neighbors[6] === 0 &&
            neighbors[0] * neighbors[4] * neighbors[6] === 0
        );
    }

    get8Neighbors(data, x, y) {
        // Returns 8 neighbors in order: N, NE, E, SE, S, SW, W, NW
        const offsets = [
            [0, -1], [1, -1], [1, 0], [1, 1],
            [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        return offsets.map(([dx, dy]) => {
            const idx = (y + dy) * this.width + (x + dx);
            return data[idx];
        });
    }

    countTransitions(neighbors) {
        let transitions = 0;
        for (let i = 0; i < neighbors.length; i++) {
            const current = neighbors[i];
            const next = neighbors[(i + 1) % neighbors.length];
            if (current === 0 && next === 255) {
                transitions++;
            }
        }
        return transitions;
    }
}
