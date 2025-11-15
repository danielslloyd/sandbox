# JPEG to SVG Coloring App Suite

A collection of web tools for creating and optimizing SVG files for children's coloring apps. Includes an image-to-SVG converter and a path simplification utility.

## Quick Start

1. **Convert an Image to SVG**: Open `index.html` in your browser
2. **Simplify an Existing SVG**: Open `svg-simplifier.html` in your browser
3. **Read SVG Best Practices**: See `svg-structure.md` for specifications

No installation or build process required - all tools run directly in your browser!

## Tools Included

### 1. JPEG to SVG Converter (`index.html`)
Main tool for converting raster images into SVG coloring pages.

**Features:**
- **Image to SVG Conversion**: Converts raster images (JPEG, PNG) to vector SVG format
- **Edge Detection**: Uses Sobel edge detection with configurable sensitivity
- **Region Analysis**: Automatically detects and analyzes enclosed regions
- **Small Area Merging**: Merges regions smaller than a specified threshold to prevent tiny coloring areas
- **Flexible Line Weights**: Two modes for line styling:
  - **Uniform Mode**: All lines have the same weight
  - **Dual Mode**: Boundary lines between different color sections have different weights than detail lines within sections
- **Path Simplification**: Reduces SVG complexity while maintaining visual quality
- **Interactive Preview**: View original, processed, and final SVG outputs

**When to use:** Start with a photo or raster image and want to create an SVG coloring page.

### 2. SVG Path Simplifier (`svg-simplifier.html`)
Standalone tool for optimizing existing SVG files by reducing path complexity with interactive polygon editing.

**Features:**
- **Two Algorithms**: Choose between Douglas-Peucker or Visvalingam simplification
  - **Douglas-Peucker**: Distance-based, great for geometric shapes
  - **Visvalingam**: Area-based, better preserves natural shape characteristics
- **Interactive Tolerance Slider**: Real-time control over compression level (0.1-10)
- **Intersection Detection**: Identifies when paths cross each other
- **Intersection Avoidance**: Auto-adjusts to maintain path integrity (built into Visvalingam)
- **Coordinate Rounding**: Reduces file size without visible quality loss
- **Before/After Comparison**: Side-by-side preview with statistics
- **Point Reduction Stats**: See exactly how many points were removed and percentage reduction
- **Drag-and-Drop**: Easy file upload interface

**Polygon Editing Tools (NEW):**
- **Merge Polygons**: Click on shared edges between adjacent polygons to combine them into one
- **Split Polygons**: Click two points within a polygon to divide it into two separate polygons
- **Undo/Redo**: Full history support for all editing operations
- **Visual Feedback**: Highlights edges and points during editing
- **Interactive Modes**: Switch between View, Merge, and Split modes

**When to use:** You already have an SVG file (hand-drawn or generated) and want to optimize it by reducing file size and complexity while maintaining visual quality.

**Use cases:**
- Reduce file size of hand-drawn SVG coloring pages
- Optimize SVGs exported from design tools (Inkscape, Illustrator, Figma)
- Clean up overly complex paths with too many points
- Prepare SVGs for web use or mobile apps

## How It Works

### 1. Edge Detection
The app processes your image through several steps:
- Converts to grayscale
- Applies Gaussian blur to reduce noise
- Detects edges using Sobel operator
- Cleans and thins edges for optimal vectorization

### 2. Region Detection
- Uses flood-fill algorithm to identify enclosed regions
- Analyzes each region's area and neighboring regions
- Calculates region statistics for intelligent merging

### 3. Small Area Merging
- Identifies regions smaller than the minimum area threshold
- Merges small regions with their largest neighbor
- Continues iteratively until all regions meet the minimum size requirement
- This ensures children won't encounter frustratingly small coloring areas

### 4. Line Weight Control

#### Uniform Mode
All lines are rendered with the same stroke width, creating a consistent look throughout the image.

#### Dual Mode
Lines are classified into two categories:
- **Boundary Lines**: Lines that separate different color regions (thicker)
- **Detail Lines**: Lines within a single color region (thinner)

This creates visual hierarchy and makes it easier for children to distinguish between major sections and fine details.

### 5. SVG Generation
- Traces edge pixels into vector paths
- Simplifies paths using Douglas-Peucker algorithm
- Applies appropriate line weights based on classification
- Generates clean, scalable SVG output

## Usage

### Running the App

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. No server or build process required - it's a pure client-side application

### Converting an Image

1. **Upload Image**
   - Click the upload box or drag and drop a JPEG/PNG file
   - The original image will be displayed in the preview

2. **Adjust Settings**

   - **Minimum Area Size** (50-5000 pixels²)
     - Controls the smallest allowed region size
     - Higher values merge more regions, creating larger coloring areas
     - Recommended: 500-1000 for simple images, 200-500 for detailed images

   - **Edge Detection Sensitivity** (10-100)
     - Controls how many edges are detected
     - Higher values detect more subtle edges
     - Recommended: 40-60 for most images

   - **Path Simplification** (0-10)
     - Controls how much paths are smoothed
     - Higher values create simpler, smoother curves
     - Recommended: 1-3 for balanced quality

   - **Line Weight Mode**
     - Choose between Uniform or Dual mode

   - **Line Weights**
     - In Uniform mode: Set single weight (1-10px)
     - In Dual mode: Set boundary weight (2-10px) and detail weight (0.5-5px)

3. **Convert**
   - Click "Convert to SVG" button
   - Wait for processing (may take a few seconds for large images)
   - View the result in the SVG preview tab

4. **Download**
   - Click "Download SVG" to save the file
   - File will be named `[original-name]-coloring.svg`

## Parameters Guide

### Minimum Area Size
- **50-200**: Preserves fine details, may create very small regions
- **200-500**: Good for detailed images with moderate simplification
- **500-1000**: Ideal for children's coloring (prevents tiny areas)
- **1000-5000**: Heavy simplification, best for young children

### Edge Detection Sensitivity
- **10-30**: Only strong, obvious edges
- **30-60**: Balanced detection (recommended)
- **60-100**: Detects subtle edges, may create noise

### Path Simplification
- **0-1**: Minimal smoothing, preserves details
- **1-3**: Balanced smoothing (recommended)
- **3-10**: Heavy smoothing, creates very simple shapes

### Line Weights

#### Uniform Mode
- **1-2px**: Thin lines, delicate appearance
- **3-4px**: Medium lines, good visibility (recommended)
- **5-10px**: Thick lines, bold appearance

#### Dual Mode
- **Boundary**: 3-5px recommended
- **Detail**: 1-2px recommended
- Keep boundary 2-3x thicker than detail for good contrast

## Technical Details

### Image Processing Pipeline

1. **Grayscale Conversion**: Uses luminance formula (0.299R + 0.587G + 0.114B)
2. **Gaussian Blur**: Reduces noise with configurable kernel
3. **Sobel Edge Detection**: Computes gradient magnitude
4. **Morphological Operations**: Closing operation to connect gaps
5. **Edge Thinning**: Zhang-Suen algorithm for single-pixel edges

### Region Detection Algorithm

1. **Flood Fill**: Identifies connected non-edge pixels
2. **Neighbor Analysis**: Determines which regions are adjacent
3. **Area Calculation**: Computes pixel count for each region
4. **Iterative Merging**: Repeatedly merges smallest regions with largest neighbors

### SVG Optimization

1. **Contour Tracing**: Follows edge pixels to create paths
2. **Douglas-Peucker Simplification**: Reduces path complexity
3. **Path Classification**: Identifies boundary vs. detail lines
4. **SVG Generation**: Creates optimized vector output

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses modern JavaScript features)

## Performance Considerations

- **Large images** (>2000px): Processing may take 5-10 seconds
- **High edge sensitivity**: Creates more paths, increases processing time
- **Low simplification**: Generates larger SVG files
- **Small minimum area**: More regions = longer processing time

Recommended maximum image size: 1500x1500 pixels for optimal performance

## File Structure

```
coloring/
├── index.html              # JPEG to SVG converter (main tool)
├── style.css               # Styling for main converter
├── app.js                  # UI controller and event handling
├── imageProcessor.js       # Edge detection and image processing
├── svgGenerator.js         # Region detection and SVG generation
├── svg-simplifier.html     # SVG path simplifier tool
├── svg-simplifier.js       # Path simplification logic
├── svg-structure.md        # SVG specifications for coloring apps
├── build-specification.md  # Technical build documentation
└── README.md              # This file
```

## Use Cases

- **Coloring Book Creation**: Generate printable coloring pages
- **Educational Materials**: Create simple line art from photos
- **Activity Books**: Convert illustrations to coloring activities
- **Therapeutic Art**: Prepare images for art therapy sessions
- **Commercial Products**: Generate coloring content for apps and books

## Tips for Best Results

1. **Start with clear images**: Photos with distinct subjects work best
2. **High contrast**: Images with clear boundaries produce better results
3. **Simple subjects**: Portraits, animals, and objects work better than complex scenes
4. **Adjust iteratively**: Start with default settings, then fine-tune
5. **Test different simplifications**: Balance between detail and simplicity
6. **Consider your audience**: Use larger minimum areas for younger children

## Limitations

- Cannot perfectly handle very complex or noisy images
- Transparent areas in PNGs are treated as white
- Very fine details may be lost in simplification
- Processing time increases with image size and complexity

## Future Enhancements

Potential improvements:
- Color region detection and preservation
- Multiple output formats (PDF, EPS)
- Batch processing
- Custom color palettes
- Template library
- Save/load settings presets

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please refer to the repository documentation or create an issue in the project repository.
