// SVG Path Simplifier
class SVGSimplifier {
    constructor() {
        this.svgData = null;
        this.originalPaths = [];
        this.simplifiedPaths = [];
        this.fileName = '';

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadBox = document.getElementById('uploadBox');
        this.fileInput = document.getElementById('fileInput');
        this.controls = document.getElementById('controls');
        this.actionButtons = document.getElementById('actionButtons');
        this.previewSection = document.getElementById('previewSection');

        this.toleranceSlider = document.getElementById('toleranceSlider');
        this.toleranceValue = document.getElementById('toleranceValue');
        this.preventIntersections = document.getElementById('preventIntersections');
        this.roundCoordinates = document.getElementById('roundCoordinates');

        this.simplifyBtn = document.getElementById('simplifyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        this.originalPreview = document.getElementById('originalPreview');
        this.simplifiedPreview = document.getElementById('simplifiedPreview');
        this.originalStats = document.getElementById('originalStats');
        this.simplifiedStats = document.getElementById('simplifiedStats');

        this.statusMessage = document.getElementById('statusMessage');
        this.intersectionWarning = document.getElementById('intersectionWarning');
    }

    initEventListeners() {
        // File upload
        this.uploadBox.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadBox.classList.add('dragover');
        });

        this.uploadBox.addEventListener('dragleave', () => {
            this.uploadBox.classList.remove('dragover');
        });

        this.uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadBox.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Slider
        this.toleranceSlider.addEventListener('input', () => {
            this.toleranceValue.textContent = this.toleranceSlider.value;
        });

        // Buttons
        this.simplifyBtn.addEventListener('click', () => this.simplifySVG());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.name.endsWith('.svg')) {
            this.showStatus('Please select an SVG file', 'error');
            return;
        }

        this.fileName = file.name;
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                this.loadSVG(e.target.result);
            } catch (error) {
                this.showStatus('Error loading SVG: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    loadSVG(svgText) {
        // Parse SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

        // Check for parsing errors
        const parserError = svgDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid SVG file');
        }

        this.svgData = svgDoc;

        // Extract all paths
        this.extractPaths();

        // Show controls and preview
        this.controls.classList.remove('hidden');
        this.actionButtons.classList.remove('hidden');
        this.previewSection.classList.remove('hidden');

        // Display original
        this.displayOriginal();

        this.showStatus('SVG loaded successfully! Adjust the tolerance and click "Simplify Paths".', 'success');
    }

    extractPaths() {
        this.originalPaths = [];
        const paths = this.svgData.querySelectorAll('path');

        paths.forEach((pathElement, index) => {
            const d = pathElement.getAttribute('d');
            if (d) {
                const points = this.parsePath(d);
                if (points.length > 0) {
                    this.originalPaths.push({
                        element: pathElement,
                        originalD: d,
                        points: points,
                        index: index
                    });
                }
            }
        });
    }

    parsePath(d) {
        // Simple path parser - extracts points from path data
        // Handles M, L, H, V, Z commands (most common for line-based paths)
        const points = [];
        const commands = d.match(/[MLHVZmlhvz][^MLHVZmlhvz]*/g);

        if (!commands) return points;

        let currentX = 0;
        let currentY = 0;
        let startX = 0;
        let startY = 0;

        commands.forEach(cmd => {
            const type = cmd[0];
            const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

            switch (type.toUpperCase()) {
                case 'M':
                    if (type === 'M') {
                        currentX = coords[0];
                        currentY = coords[1];
                    } else {
                        currentX += coords[0];
                        currentY += coords[1];
                    }
                    startX = currentX;
                    startY = currentY;
                    points.push({ x: currentX, y: currentY });
                    break;

                case 'L':
                    for (let i = 0; i < coords.length; i += 2) {
                        if (type === 'L') {
                            currentX = coords[i];
                            currentY = coords[i + 1];
                        } else {
                            currentX += coords[i];
                            currentY += coords[i + 1];
                        }
                        points.push({ x: currentX, y: currentY });
                    }
                    break;

                case 'H':
                    coords.forEach(coord => {
                        if (type === 'H') {
                            currentX = coord;
                        } else {
                            currentX += coord;
                        }
                        points.push({ x: currentX, y: currentY });
                    });
                    break;

                case 'V':
                    coords.forEach(coord => {
                        if (type === 'V') {
                            currentY = coord;
                        } else {
                            currentY += coord;
                        }
                        points.push({ x: currentX, y: currentY });
                    });
                    break;

                case 'Z':
                    if (currentX !== startX || currentY !== startY) {
                        points.push({ x: startX, y: startY });
                    }
                    currentX = startX;
                    currentY = startY;
                    break;
            }
        });

        return points;
    }

    displayOriginal() {
        // Clone and display original SVG
        const svgClone = this.svgData.documentElement.cloneNode(true);
        this.originalPreview.innerHTML = '';
        this.originalPreview.appendChild(svgClone);

        // Calculate stats
        const totalPoints = this.originalPaths.reduce((sum, path) => sum + path.points.length, 0);
        const pathCount = this.originalPaths.length;

        this.originalStats.innerHTML = `
            <div class="stats-row">
                <span class="stats-label">Total Paths:</span>
                <span class="stats-value">${pathCount}</span>
            </div>
            <div class="stats-row">
                <span class="stats-label">Total Points:</span>
                <span class="stats-value">${totalPoints}</span>
            </div>
            <div class="stats-row">
                <span class="stats-label">Avg Points/Path:</span>
                <span class="stats-value">${(totalPoints / pathCount).toFixed(1)}</span>
            </div>
        `;
    }

    simplifySVG() {
        const tolerance = parseFloat(this.toleranceSlider.value);
        const preventIntersections = this.preventIntersections.checked;
        const roundCoords = this.roundCoordinates.checked;

        this.simplifyBtn.disabled = true;
        this.showStatus('Simplifying paths...', 'info');

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                this.simplifiedPaths = [];
                let adjustedTolerance = tolerance;
                let hasIntersections = false;

                // Simplify all paths
                this.originalPaths.forEach(pathData => {
                    const simplified = this.douglasPeucker(pathData.points, adjustedTolerance);
                    this.simplifiedPaths.push({
                        ...pathData,
                        simplifiedPoints: simplified,
                        tolerance: adjustedTolerance
                    });
                });

                // Check for intersections if enabled
                if (preventIntersections) {
                    let maxIterations = 20;
                    let iteration = 0;

                    while (iteration < maxIterations) {
                        hasIntersections = this.detectIntersections();

                        if (!hasIntersections) {
                            break;
                        }

                        // Reduce tolerance and re-simplify
                        adjustedTolerance *= 0.8;

                        if (adjustedTolerance < 0.1) {
                            adjustedTolerance = 0.1;
                            break;
                        }

                        this.simplifiedPaths = [];
                        this.originalPaths.forEach(pathData => {
                            const simplified = this.douglasPeucker(pathData.points, adjustedTolerance);
                            this.simplifiedPaths.push({
                                ...pathData,
                                simplifiedPoints: simplified,
                                tolerance: adjustedTolerance
                            });
                        });

                        iteration++;
                    }

                    if (adjustedTolerance !== tolerance) {
                        this.showStatus(
                            `Tolerance auto-adjusted from ${tolerance} to ${adjustedTolerance.toFixed(1)} to prevent intersections.`,
                            'info'
                        );
                    }
                } else {
                    hasIntersections = this.detectIntersections();
                }

                // Show/hide intersection warning
                if (hasIntersections) {
                    this.intersectionWarning.classList.add('show');
                } else {
                    this.intersectionWarning.classList.remove('show');
                }

                // Create simplified SVG
                const simplifiedSVG = this.createSimplifiedSVG(roundCoords);

                // Display simplified version
                this.displaySimplified(simplifiedSVG);

                this.downloadBtn.disabled = false;

                if (!hasIntersections) {
                    this.showStatus('Paths simplified successfully!', 'success');
                }
            } catch (error) {
                this.showStatus('Error simplifying paths: ' + error.message, 'error');
                console.error(error);
            } finally {
                this.simplifyBtn.disabled = false;
            }
        }, 100);
    }

    douglasPeucker(points, epsilon) {
        if (points.length <= 2) return points;

        // Find the point with maximum distance
        let maxDist = 0;
        let maxIndex = 0;
        const start = points[0];
        const end = points[points.length - 1];

        for (let i = 1; i < points.length - 1; i++) {
            const dist = this.perpendicularDistance(points[i], start, end);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }

        // If max distance is greater than epsilon, recursively simplify
        if (maxDist > epsilon) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
            const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
            return left.slice(0, -1).concat(right);
        } else {
            return [start, end];
        }
    }

    perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;

        if (dx === 0 && dy === 0) {
            return Math.sqrt(
                Math.pow(point.x - lineStart.x, 2) +
                Math.pow(point.y - lineStart.y, 2)
            );
        }

        const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;

        return Math.sqrt(
            Math.pow(point.x - projX, 2) +
            Math.pow(point.y - projY, 2)
        );
    }

    detectIntersections() {
        // Check if any simplified paths intersect with each other
        for (let i = 0; i < this.simplifiedPaths.length; i++) {
            for (let j = i + 1; j < this.simplifiedPaths.length; j++) {
                if (this.pathsIntersect(
                    this.simplifiedPaths[i].simplifiedPoints,
                    this.simplifiedPaths[j].simplifiedPoints
                )) {
                    return true;
                }
            }
        }
        return false;
    }

    pathsIntersect(path1, path2) {
        // Check if any segments of path1 intersect with any segments of path2
        for (let i = 0; i < path1.length - 1; i++) {
            for (let j = 0; j < path2.length - 1; j++) {
                if (this.segmentsIntersect(
                    path1[i], path1[i + 1],
                    path2[j], path2[j + 1]
                )) {
                    return true;
                }
            }
        }
        return false;
    }

    segmentsIntersect(p1, p2, p3, p4) {
        // Check if line segment p1-p2 intersects with line segment p3-p4
        const d1 = this.direction(p3, p4, p1);
        const d2 = this.direction(p3, p4, p2);
        const d3 = this.direction(p1, p2, p3);
        const d4 = this.direction(p1, p2, p4);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
            return true;
        }

        // Check for collinear cases (endpoints touching)
        if (d1 === 0 && this.onSegment(p3, p1, p4)) return true;
        if (d2 === 0 && this.onSegment(p3, p2, p4)) return true;
        if (d3 === 0 && this.onSegment(p1, p3, p2)) return true;
        if (d4 === 0 && this.onSegment(p1, p4, p2)) return true;

        return false;
    }

    direction(p1, p2, p3) {
        // Calculate the cross product to determine direction
        return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
    }

    onSegment(p1, p2, p3) {
        // Check if point p2 is on segment p1-p3
        return p2.x >= Math.min(p1.x, p3.x) && p2.x <= Math.max(p1.x, p3.x) &&
               p2.y >= Math.min(p1.y, p3.y) && p2.y <= Math.max(p1.y, p3.y);
    }

    createSimplifiedSVG(roundCoords) {
        // Clone original SVG
        const svgClone = this.svgData.documentElement.cloneNode(true);

        // Update all paths with simplified versions
        const paths = svgClone.querySelectorAll('path');

        this.simplifiedPaths.forEach((pathData, index) => {
            if (paths[pathData.index]) {
                const newD = this.pointsToPath(pathData.simplifiedPoints, roundCoords);
                paths[pathData.index].setAttribute('d', newD);
            }
        });

        return svgClone;
    }

    pointsToPath(points, roundCoords) {
        if (points.length === 0) return '';

        const round = (n) => roundCoords ? Math.round(n * 10) / 10 : n;

        let pathData = `M ${round(points[0].x)} ${round(points[0].y)}`;

        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${round(points[i].x)} ${round(points[i].y)}`;
        }

        return pathData;
    }

    displaySimplified(svgElement) {
        this.simplifiedPreview.innerHTML = '';
        this.simplifiedPreview.appendChild(svgElement);

        // Calculate stats
        const totalOriginalPoints = this.originalPaths.reduce((sum, path) => sum + path.points.length, 0);
        const totalSimplifiedPoints = this.simplifiedPaths.reduce((sum, path) => sum + path.simplifiedPoints.length, 0);
        const reduction = ((1 - totalSimplifiedPoints / totalOriginalPoints) * 100).toFixed(1);

        this.simplifiedStats.innerHTML = `
            <div class="stats-row">
                <span class="stats-label">Total Points:</span>
                <span class="stats-value">${totalSimplifiedPoints}</span>
            </div>
            <div class="stats-row">
                <span class="stats-label">Points Removed:</span>
                <span class="stats-value">${totalOriginalPoints - totalSimplifiedPoints}</span>
            </div>
            <div class="stats-row">
                <span class="stats-label">Reduction:</span>
                <span class="stats-value reduction">${reduction}%</span>
            </div>
            <div class="stats-row">
                <span class="stats-label">Avg Points/Path:</span>
                <span class="stats-value">${(totalSimplifiedPoints / this.simplifiedPaths.length).toFixed(1)}</span>
            </div>
        `;
    }

    downloadSVG() {
        const roundCoords = this.roundCoordinates.checked;
        const svgElement = this.createSimplifiedSVG(roundCoords);

        // Convert to string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);

        // Add XML declaration if not present
        if (!svgString.startsWith('<?xml')) {
            svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
        }

        // Create download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName.replace('.svg', '-simplified.svg');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('Simplified SVG downloaded successfully!', 'success');
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message show ' + type;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SVGSimplifier();
});
