// SVG generation with region detection and line weight management
class SVGGenerator {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.edgePixels = null;
        this.regions = [];
    }

    async generateSVG(processedData, params) {
        this.width = processedData.width;
        this.height = processedData.height;
        this.edgePixels = processedData.edgePixels;
        this.originalImage = processedData.originalImage;

        // Find all regions (flood fill)
        const regionMap = this.detectRegions();

        // Calculate region areas and colors
        this.analyzeRegions(regionMap);

        // Merge small regions
        const mergedCount = this.mergeSmallRegions(params.minArea, regionMap);

        // Trace edges and generate paths
        const paths = this.tracePaths(params.simplification);

        // Classify paths based on regions
        this.classifyPaths(paths, regionMap);

        // Generate SVG with appropriate line weights
        const svg = this.createSVG(paths, params);

        return {
            svg,
            stats: {
                regions: this.regions.length,
                mergedRegions: mergedCount,
                paths: paths.length
            }
        };
    }

    detectRegions() {
        const regionMap = new Int32Array(this.width * this.height);
        regionMap.fill(-1);
        let regionId = 0;

        // Mark edge pixels as boundaries
        for (let i = 0; i < this.edgePixels.length; i++) {
            if (this.edgePixels[i] === 255) {
                regionMap[i] = -2; // -2 indicates edge/boundary
            }
        }

        // Flood fill to identify regions
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                if (regionMap[idx] === -1) {
                    this.floodFill(regionMap, x, y, regionId);
                    regionId++;
                }
            }
        }

        return regionMap;
    }

    floodFill(regionMap, startX, startY, regionId) {
        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();

            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

            const idx = y * this.width + x;
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (regionMap[idx] !== -1) continue; // Already assigned or is edge

            visited.add(key);
            regionMap[idx] = regionId;

            // Add 4-connected neighbors
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }

    analyzeRegions(regionMap) {
        const regionStats = new Map();

        // Count pixels and accumulate colors for each region
        for (let i = 0; i < regionMap.length; i++) {
            const regionId = regionMap[i];
            if (regionId < 0) continue; // Skip edges and unassigned

            if (!regionStats.has(regionId)) {
                regionStats.set(regionId, {
                    id: regionId,
                    area: 0,
                    pixels: [],
                    neighbors: new Set()
                });
            }

            const stats = regionStats.get(regionId);
            stats.area++;
            stats.pixels.push(i);
        }

        // Find neighbors for each region
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                const regionId = regionMap[idx];

                if (regionId < 0) continue;

                // Check 4-connected neighbors
                const neighbors = [
                    [x + 1, y], [x - 1, y],
                    [x, y + 1], [x, y - 1]
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        const nIdx = ny * this.width + nx;
                        const nRegionId = regionMap[nIdx];

                        if (nRegionId >= 0 && nRegionId !== regionId) {
                            regionStats.get(regionId).neighbors.add(nRegionId);
                        }
                    }
                }
            }
        }

        this.regions = Array.from(regionStats.values());
    }

    mergeSmallRegions(minArea, regionMap) {
        let mergedCount = 0;
        let hasChanges = true;

        while (hasChanges) {
            hasChanges = false;

            // Find smallest region
            const smallRegions = this.regions.filter(r => r.area < minArea);

            if (smallRegions.length === 0) break;

            // Sort by area (smallest first)
            smallRegions.sort((a, b) => a.area - b.area);

            for (const smallRegion of smallRegions) {
                if (smallRegion.area >= minArea) continue;

                // Find largest neighbor to merge with
                let largestNeighbor = null;
                let largestArea = 0;

                for (const neighborId of smallRegion.neighbors) {
                    const neighbor = this.regions.find(r => r.id === neighborId);
                    if (neighbor && neighbor.area > largestArea) {
                        largestNeighbor = neighbor;
                        largestArea = neighbor.area;
                    }
                }

                if (largestNeighbor) {
                    // Merge small region into largest neighbor
                    this.mergeRegions(smallRegion, largestNeighbor, regionMap);
                    mergedCount++;
                    hasChanges = true;
                }
            }

            // Rebuild regions list
            this.analyzeRegions(regionMap);
        }

        return mergedCount;
    }

    mergeRegions(sourceRegion, targetRegion, regionMap) {
        // Update regionMap: change all source region pixels to target region
        for (const pixelIdx of sourceRegion.pixels) {
            regionMap[pixelIdx] = targetRegion.id;
        }

        // Update target region
        targetRegion.area += sourceRegion.area;
        targetRegion.pixels.push(...sourceRegion.pixels);

        // Merge neighbors
        for (const neighborId of sourceRegion.neighbors) {
            if (neighborId !== targetRegion.id) {
                targetRegion.neighbors.add(neighborId);
            }
        }

        // Remove merged neighbor reference
        targetRegion.neighbors.delete(sourceRegion.id);
    }

    tracePaths(simplification) {
        const paths = [];
        const visited = new Set();

        // Find edge pixels and trace contours
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;

                if (this.edgePixels[idx] === 255 && !visited.has(idx)) {
                    const contour = this.traceContour(x, y, visited);

                    if (contour.length > 2) {
                        // Simplify path using Douglas-Peucker algorithm
                        const simplified = this.simplifyPath(contour, simplification);
                        paths.push(simplified);
                    }
                }
            }
        }

        return paths;
    }

    traceContour(startX, startY, visited) {
        const contour = [];
        const queue = [[startX, startY]];
        const localVisited = new Set();

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const idx = y * this.width + x;
            const key = `${x},${y}`;

            if (localVisited.has(key)) continue;
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
            if (this.edgePixels[idx] !== 255) continue;

            localVisited.add(key);
            visited.add(idx);
            contour.push({ x, y });

            // Check 8-connected neighbors
            const neighbors = [
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
                [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1]
            ];

            for (const [nx, ny] of neighbors) {
                const nKey = `${nx},${ny}`;
                if (!localVisited.has(nKey)) {
                    queue.push([nx, ny]);
                }
            }
        }

        return contour;
    }

    simplifyPath(points, tolerance) {
        if (points.length <= 2) return points;

        // Douglas-Peucker algorithm
        return this.douglasPeucker(points, tolerance);
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

        const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
                  (dx * dx + dy * dy);

        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;

        return Math.sqrt(
            Math.pow(point.x - projX, 2) +
            Math.pow(point.y - projY, 2)
        );
    }

    classifyPaths(paths, regionMap) {
        // Classify each path as boundary or detail
        for (const path of paths) {
            const regions = new Set();

            // Sample points along the path to determine adjacent regions
            for (const point of path) {
                // Check pixels around this edge point
                const neighbors = [
                    [point.x + 1, point.y], [point.x - 1, point.y],
                    [point.x, point.y + 1], [point.x, point.y - 1]
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        const nIdx = ny * this.width + nx;
                        const regionId = regionMap[nIdx];
                        if (regionId >= 0) {
                            regions.add(regionId);
                        }
                    }
                }
            }

            // If path borders 2 or more different regions, it's a boundary
            // Otherwise, it's a detail within a single region
            path.isBoundary = regions.size >= 2;
        }
    }

    createSVG(paths, params) {
        const { lineWeightMode, uniformWeight, boundaryWeight, detailWeight } = params;

        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n`;

        // Add white background
        svgContent += `  <rect width="${this.width}" height="${this.height}" fill="white"/>\n`;

        // Group paths by type
        const boundaryPaths = paths.filter(p => p.isBoundary);
        const detailPaths = paths.filter(p => !p.isBoundary);

        // Render detail paths first (so boundaries are on top)
        if (lineWeightMode === 'dual') {
            if (detailPaths.length > 0) {
                svgContent += `  <g stroke="black" stroke-width="${detailWeight}" fill="none" stroke-linecap="round" stroke-linejoin="round">\n`;
                for (const path of detailPaths) {
                    svgContent += this.pathToSVGPath(path);
                }
                svgContent += `  </g>\n`;
            }

            if (boundaryPaths.length > 0) {
                svgContent += `  <g stroke="black" stroke-width="${boundaryWeight}" fill="none" stroke-linecap="round" stroke-linejoin="round">\n`;
                for (const path of boundaryPaths) {
                    svgContent += this.pathToSVGPath(path);
                }
                svgContent += `  </g>\n`;
            }
        } else {
            // Uniform weight
            svgContent += `  <g stroke="black" stroke-width="${uniformWeight}" fill="none" stroke-linecap="round" stroke-linejoin="round">\n`;
            for (const path of paths) {
                svgContent += this.pathToSVGPath(path);
            }
            svgContent += `  </g>\n`;
        }

        svgContent += `</svg>`;

        return svgContent;
    }

    pathToSVGPath(points) {
        if (points.length === 0) return '';

        let pathData = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
        }

        return `    <path d="${pathData}"/>\n`;
    }
}
