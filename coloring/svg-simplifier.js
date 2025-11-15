// SVG Path Simplifier
class SVGSimplifier {
    constructor() {
        this.svgData = null;
        this.originalPaths = [];
        this.simplifiedPaths = [];
        this.fileName = '';

        // Editing mode state
        this.editMode = 'view';
        this.editHistory = [];
        this.historyIndex = -1;
        this.selectedPath = null;
        this.splitStartPoint = null;
        this.splitEndPoint = null;

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

        // Editing mode elements
        this.editModeSelector = document.getElementById('editModeSelector');
        this.modeHelp = document.getElementById('modeHelp');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.viewModeBtn = document.getElementById('viewModeBtn');
        this.mergeModeBtn = document.getElementById('mergeModeBtn');
        this.splitModeBtn = document.getElementById('splitModeBtn');
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

        // Editing mode buttons
        this.viewModeBtn.addEventListener('click', () => this.setEditMode('view'));
        this.mergeModeBtn.addEventListener('click', () => this.setEditMode('merge'));
        this.splitModeBtn.addEventListener('click', () => this.setEditMode('split'));

        // Undo/Redo buttons
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
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
        const algorithm = document.querySelector('input[name="algorithm"]:checked').value;

        this.simplifyBtn.disabled = true;
        this.showStatus('Simplifying paths...', 'info');

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                this.simplifiedPaths = [];
                let adjustedTolerance = tolerance;
                let hasIntersections = false;

                // Choose simplification method based on algorithm
                const simplifyMethod = algorithm === 'visvalingam'
                    ? this.visvalingam.bind(this)
                    : this.douglasPeucker.bind(this);

                // Simplify all paths
                this.originalPaths.forEach(pathData => {
                    const simplified = simplifyMethod(pathData.points, adjustedTolerance);
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
                            const simplified = simplifyMethod(pathData.points, adjustedTolerance);
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

    visvalingam(points, threshold) {
        if (points.length <= 2) return points;

        // Create array of point objects with their triangular areas
        const pointsWithAreas = points.map((point, index) => ({
            point: point,
            index: index,
            area: this.calculateTriangleArea(points, index),
            removed: false
        }));

        // Keep first and last points
        pointsWithAreas[0].area = Infinity;
        pointsWithAreas[pointsWithAreas.length - 1].area = Infinity;

        // Count how many points to remove based on threshold
        // Higher threshold = remove more points
        const targetPointCount = Math.max(2, Math.floor(points.length / (1 + threshold / 2)));
        const pointsToRemove = points.length - targetPointCount;

        // Build a min-heap of points by area
        const heap = [];
        for (let i = 1; i < pointsWithAreas.length - 1; i++) {
            heap.push(pointsWithAreas[i]);
        }
        heap.sort((a, b) => a.area - b.area);

        // Remove points with smallest areas
        for (let i = 0; i < Math.min(pointsToRemove, heap.length); i++) {
            const pointToRemove = heap[i];

            // Check if removing this point would create an intersection
            if (this.wouldCreateIntersection(pointsWithAreas, pointToRemove.index)) {
                // Promote this point's area to next largest (intersection avoidance)
                const nextLargestArea = i + 1 < heap.length ? heap[i + 1].area : pointToRemove.area;
                pointToRemove.area = nextLargestArea;
                // Don't remove this point yet
            } else {
                pointToRemove.removed = true;

                // Recalculate areas for neighbors
                this.updateNeighborAreas(pointsWithAreas, pointToRemove.index);
            }
        }

        // Return remaining points in original order
        return pointsWithAreas
            .filter(p => !p.removed)
            .map(p => p.point);
    }

    calculateTriangleArea(points, index) {
        if (index === 0 || index === points.length - 1) {
            return Infinity;
        }

        const prev = points[index - 1];
        const curr = points[index];
        const next = points[index + 1];

        // Calculate area using cross product
        const area = Math.abs(
            (prev.x * (curr.y - next.y) +
             curr.x * (next.y - prev.y) +
             next.x * (prev.y - curr.y)) / 2
        );

        return area;
    }

    wouldCreateIntersection(pointsWithAreas, removeIndex) {
        // Simple check: see if removing this point would create a crossing
        // by checking if the new edge (prev to next) intersects with any existing edges

        if (removeIndex === 0 || removeIndex === pointsWithAreas.length - 1) {
            return false;
        }

        // Find previous and next non-removed points
        let prevIndex = removeIndex - 1;
        while (prevIndex >= 0 && pointsWithAreas[prevIndex].removed) {
            prevIndex--;
        }

        let nextIndex = removeIndex + 1;
        while (nextIndex < pointsWithAreas.length && pointsWithAreas[nextIndex].removed) {
            nextIndex++;
        }

        if (prevIndex < 0 || nextIndex >= pointsWithAreas.length) {
            return false;
        }

        const prev = pointsWithAreas[prevIndex].point;
        const next = pointsWithAreas[nextIndex].point;

        // Check if new edge (prev to next) would intersect with other edges
        for (let i = 0; i < pointsWithAreas.length - 1; i++) {
            if (pointsWithAreas[i].removed || pointsWithAreas[i + 1].removed) {
                continue;
            }

            // Skip adjacent edges
            if (i === prevIndex || i + 1 === prevIndex || i === nextIndex || i + 1 === nextIndex) {
                continue;
            }

            if (this.segmentsIntersect(
                prev, next,
                pointsWithAreas[i].point, pointsWithAreas[i + 1].point
            )) {
                return true;
            }
        }

        return false;
    }

    updateNeighborAreas(pointsWithAreas, removedIndex) {
        // Recalculate triangle areas for points adjacent to removed point
        const points = pointsWithAreas.map(p => p.point);

        // Update previous point's area
        if (removedIndex > 0 && !pointsWithAreas[removedIndex - 1].removed) {
            pointsWithAreas[removedIndex - 1].area = this.calculateTriangleArea(
                points.filter((p, i) => !pointsWithAreas[i].removed),
                removedIndex - 1
            );
        }

        // Update next point's area
        if (removedIndex < pointsWithAreas.length - 1 && !pointsWithAreas[removedIndex + 1].removed) {
            pointsWithAreas[removedIndex + 1].area = this.calculateTriangleArea(
                points.filter((p, i) => !pointsWithAreas[i].removed),
                removedIndex + 1
            );
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
                <span class="stats-label">Total Paths:</span>
                <span class="stats-value">${this.simplifiedPaths.length}</span>
            </div>
        `;

        // Show polygon editing mode selector
        this.editModeSelector.classList.add('show');

        // Initialize edit history with current state
        this.editHistory = [{
            paths: JSON.parse(JSON.stringify(this.simplifiedPaths))
        }];
        this.historyIndex = 0;
        this.updateUndoRedoButtons();

        // Attach editing listeners
        this.attachEditingListeners();
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

    // ============================================================
    // POLYGON EDITING METHODS
    // ============================================================

    setEditMode(mode) {
        this.editMode = mode;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (mode === 'view') {
            this.viewModeBtn.classList.add('active');
            this.modeHelp.textContent = 'Click on paths to view them';
            this.simplifiedPreview.classList.remove('interactive');
        } else if (mode === 'merge') {
            this.mergeModeBtn.classList.add('active');
            this.modeHelp.textContent = 'Click on a shared edge between two polygons to merge them';
            this.simplifiedPreview.classList.add('interactive');
        } else if (mode === 'split') {
            this.splitModeBtn.classList.add('active');
            this.modeHelp.textContent = 'Click on two points within a polygon to split it';
            this.simplifiedPreview.classList.add('interactive');
        }

        // Clear any selection state
        this.clearEditingState();
    }

    clearEditingState() {
        this.selectedPath = null;
        this.splitStartPoint = null;
        this.splitEndPoint = null;

        // Remove visual markers
        const svg = this.simplifiedPreview.querySelector('svg');
        if (svg) {
            svg.querySelectorAll('.edge-highlight, .point-marker, .split-line').forEach(el => el.remove());
        }
    }

    saveState() {
        // Save current state to history for undo/redo
        const state = {
            paths: JSON.parse(JSON.stringify(this.simplifiedPaths))
        };

        // Remove any redo history when making a new change
        this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
        this.editHistory.push(state);
        this.historyIndex++;

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.editHistory[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.editHistory.length - 1) {
            this.historyIndex++;
            this.restoreState(this.editHistory[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    restoreState(state) {
        this.simplifiedPaths = JSON.parse(JSON.stringify(state.paths));
        this.refreshSimplifiedPreview();
    }

    updateUndoRedoButtons() {
        this.undoBtn.disabled = this.historyIndex <= 0;
        this.redoBtn.disabled = this.historyIndex >= this.editHistory.length - 1;
    }

    refreshSimplifiedPreview() {
        const roundCoords = this.roundCoordinates.checked;
        const svgElement = this.createSimplifiedSVG(roundCoords);
        this.simplifiedPreview.innerHTML = '';
        this.simplifiedPreview.appendChild(svgElement);

        // Re-attach event listeners for editing
        this.attachEditingListeners();

        // Update stats
        const totalSimplifiedPoints = this.simplifiedPaths.reduce((sum, path) => sum + path.simplifiedPoints.length, 0);
        const totalOriginalPoints = this.originalPaths.reduce((sum, path) => sum + path.points.length, 0);
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
                <span class="stats-label">Total Paths:</span>
                <span class="stats-value">${this.simplifiedPaths.length}</span>
            </div>
        `;
    }

    attachEditingListeners() {
        const svg = this.simplifiedPreview.querySelector('svg');
        if (!svg) return;

        const paths = svg.querySelectorAll('path');
        paths.forEach((pathElement, index) => {
            pathElement.addEventListener('click', (e) => this.handlePathClick(e, index));
            pathElement.addEventListener('mousemove', (e) => this.handlePathHover(e, index));
        });
    }

    handlePathClick(event, pathIndex) {
        event.stopPropagation();

        if (this.editMode === 'merge') {
            this.handleMergeClick(event, pathIndex);
        } else if (this.editMode === 'split') {
            this.handleSplitClick(event, pathIndex);
        }
    }

    handlePathHover(event, pathIndex) {
        if (this.editMode === 'merge') {
            // Show potential merge edges on hover
            this.highlightNearbyEdges(event, pathIndex);
        }
    }

    handleMergeClick(event, pathIndex) {
        // Find which edge was clicked
        const clickPoint = this.getSVGCoordinates(event);
        const path = this.simplifiedPaths[pathIndex];

        // Find nearest edge in clicked path
        const edgeInfo = this.findNearestEdge(clickPoint, path.simplifiedPoints);

        // Find if any other path shares this edge
        const adjacentPathIndex = this.findAdjacentPath(path, edgeInfo, pathIndex);

        if (adjacentPathIndex !== -1) {
            this.saveState();
            this.mergePaths(pathIndex, adjacentPathIndex);
            this.showStatus(`Merged ${this.simplifiedPaths.length + 1} paths into 1`, 'success');
        } else {
            this.showStatus('No adjacent polygon found at this edge', 'error');
        }
    }

    handleSplitClick(event, pathIndex) {
        const clickPoint = this.getSVGCoordinates(event);
        const path = this.simplifiedPaths[pathIndex];

        // Find nearest point on the path
        const nearestPoint = this.findNearestPointOnPath(clickPoint, path.simplifiedPoints);

        if (!this.splitStartPoint) {
            // First click - select start point
            this.splitStartPoint = { ...nearestPoint, pathIndex };
            this.drawPointMarker(nearestPoint);
            this.showStatus('Click on second point to complete split', 'info');
        } else if (this.splitStartPoint.pathIndex === pathIndex) {
            // Second click - split the path
            this.splitEndPoint = nearestPoint;
            this.saveState();
            this.splitPath(pathIndex, this.splitStartPoint, this.splitEndPoint);
            this.clearEditingState();
            this.showStatus('Polygon split successfully', 'success');
        } else {
            // Clicked different path - reset
            this.clearEditingState();
            this.showStatus('Both points must be on the same polygon', 'error');
        }
    }

    getSVGCoordinates(event) {
        const svg = this.simplifiedPreview.querySelector('svg');
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        return { x: svgP.x, y: svgP.y };
    }

    findNearestEdge(point, pathPoints) {
        let minDist = Infinity;
        let nearestEdge = null;

        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            const dist = this.distanceToSegment(point, p1, p2);

            if (dist < minDist) {
                minDist = dist;
                nearestEdge = { start: i, end: i + 1, p1, p2 };
            }
        }

        return nearestEdge;
    }

    findNearestPointOnPath(point, pathPoints) {
        let minDist = Infinity;
        let nearestPoint = null;
        let nearestIndex = -1;

        pathPoints.forEach((p, index) => {
            const dist = Math.hypot(point.x - p.x, point.y - p.y);
            if (dist < minDist) {
                minDist = dist;
                nearestPoint = p;
                nearestIndex = index;
            }
        });

        return { ...nearestPoint, index: nearestIndex };
    }

    distanceToSegment(point, p1, p2) {
        const A = point.x - p1.x;
        const B = point.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findAdjacentPath(path, edgeInfo, currentPathIndex) {
        const tolerance = 5; // Pixel tolerance for edge matching

        for (let i = 0; i < this.simplifiedPaths.length; i++) {
            if (i === currentPathIndex) continue;

            const otherPath = this.simplifiedPaths[i];

            // Check if this path has a matching edge
            for (let j = 0; j < otherPath.simplifiedPoints.length - 1; j++) {
                const op1 = otherPath.simplifiedPoints[j];
                const op2 = otherPath.simplifiedPoints[j + 1];

                // Check if edges match (in either direction)
                if ((this.pointsEqual(edgeInfo.p1, op1, tolerance) && this.pointsEqual(edgeInfo.p2, op2, tolerance)) ||
                    (this.pointsEqual(edgeInfo.p1, op2, tolerance) && this.pointsEqual(edgeInfo.p2, op1, tolerance))) {
                    return i;
                }
            }
        }

        return -1;
    }

    pointsEqual(p1, p2, tolerance = 1) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y) < tolerance;
    }

    mergePaths(index1, index2) {
        const path1 = this.simplifiedPaths[index1];
        const path2 = this.simplifiedPaths[index2];

        // Find the shared edge
        const sharedEdge = this.findSharedEdge(path1.simplifiedPoints, path2.simplifiedPoints);

        if (!sharedEdge) {
            this.showStatus('Could not find shared edge', 'error');
            return;
        }

        // Merge the paths by removing the shared edge
        const mergedPoints = this.mergePolygons(
            path1.simplifiedPoints,
            path2.simplifiedPoints,
            sharedEdge
        );

        // Update the first path with merged points
        path1.simplifiedPoints = mergedPoints;

        // Remove the second path
        this.simplifiedPaths.splice(index2, 1);

        this.refreshSimplifiedPreview();
    }

    findSharedEdge(points1, points2) {
        const tolerance = 5;

        for (let i = 0; i < points1.length - 1; i++) {
            for (let j = 0; j < points2.length - 1; j++) {
                const p1_1 = points1[i];
                const p1_2 = points1[i + 1];
                const p2_1 = points2[j];
                const p2_2 = points2[j + 1];

                // Check if edges match (in either direction)
                if ((this.pointsEqual(p1_1, p2_1, tolerance) && this.pointsEqual(p1_2, p2_2, tolerance)) ||
                    (this.pointsEqual(p1_1, p2_2, tolerance) && this.pointsEqual(p1_2, p2_1, tolerance))) {
                    return {
                        path1: { start: i, end: i + 1 },
                        path2: { start: j, end: j + 1 },
                        reversed: this.pointsEqual(p1_1, p2_2, tolerance)
                    };
                }
            }
        }

        return null;
    }

    mergePolygons(points1, points2, sharedEdge) {
        // Create merged polygon by concatenating points, excluding shared edge
        const merged = [];

        // Add points from path1 up to shared edge start
        for (let i = 0; i <= sharedEdge.path1.start; i++) {
            merged.push({ ...points1[i] });
        }

        // Add points from path2 (skipping shared edge)
        const path2Start = sharedEdge.reversed ? sharedEdge.path2.start : sharedEdge.path2.end;
        const path2Direction = sharedEdge.reversed ? -1 : 1;

        let idx = path2Start;
        let count = 0;
        while (count < points2.length) {
            if (idx !== sharedEdge.path2.start && idx !== sharedEdge.path2.end) {
                merged.push({ ...points2[idx] });
            }
            idx = (idx + path2Direction + points2.length) % points2.length;
            count++;
            if (idx === path2Start) break;
        }

        // Add remaining points from path1
        for (let i = sharedEdge.path1.end + 1; i < points1.length; i++) {
            merged.push({ ...points1[i] });
        }

        // Ensure closed path
        if (!this.pointsEqual(merged[0], merged[merged.length - 1], 0.1)) {
            merged.push({ ...merged[0] });
        }

        return merged;
    }

    splitPath(pathIndex, startPoint, endPoint) {
        const path = this.simplifiedPaths[pathIndex];
        const points = path.simplifiedPoints;

        const startIdx = startPoint.index;
        const endIdx = endPoint.index;

        // Ensure start comes before end
        const [idx1, idx2] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

        // Create two new paths
        const path1Points = points.slice(idx1, idx2 + 1);
        const path2Points = [...points.slice(idx2), ...points.slice(0, idx1 + 1)];

        // Close both paths
        if (!this.pointsEqual(path1Points[0], path1Points[path1Points.length - 1], 0.1)) {
            path1Points.push({ ...path1Points[0] });
        }
        if (!this.pointsEqual(path2Points[0], path2Points[path2Points.length - 1], 0.1)) {
            path2Points.push({ ...path2Points[0] });
        }

        // Update existing path
        path.simplifiedPoints = path1Points;

        // Create new path
        const newPath = {
            ...path,
            simplifiedPoints: path2Points,
            index: this.simplifiedPaths.length
        };

        this.simplifiedPaths.push(newPath);

        this.refreshSimplifiedPreview();
    }

    drawPointMarker(point) {
        const svg = this.simplifiedPreview.querySelector('svg');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', '5');
        circle.classList.add('point-marker');
        svg.appendChild(circle);
    }

    highlightNearbyEdges(event, pathIndex) {
        // Remove previous highlights
        const svg = this.simplifiedPreview.querySelector('svg');
        svg.querySelectorAll('.edge-highlight').forEach(el => el.remove());

        const clickPoint = this.getSVGCoordinates(event);
        const path = this.simplifiedPaths[pathIndex];
        const edgeInfo = this.findNearestEdge(clickPoint, path.simplifiedPoints);

        if (edgeInfo && this.distanceToSegment(clickPoint, edgeInfo.p1, edgeInfo.p2) < 20) {
            // Draw highlight line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', edgeInfo.p1.x);
            line.setAttribute('y1', edgeInfo.p1.y);
            line.setAttribute('x2', edgeInfo.p2.x);
            line.setAttribute('y2', edgeInfo.p2.y);
            line.classList.add('edge-highlight');
            svg.appendChild(line);
        }
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
