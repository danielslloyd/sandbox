# SVG Structure Specification for Coloring Pages

## Overview

This specification defines the ideal SVG structure for interactive coloring applications. The two-layer system ensures crisp outlines that never get covered by fill colors, creating the classic coloring book experience.

## File Format Requirements

- **Format**: Plain SVG (not Inkscape SVG or proprietary formats)
- **Encoding**: UTF-8 with XML declaration
- **Dimensions**: 1024x1024 viewBox (scales to any screen size)
- **Stroke width**: 4-6px for outlines (thick enough for children and touch interfaces)
- **Color depth**: RGB only (no CMYK or special color spaces)
- **Background**: Transparent or white (no colored backgrounds)

## Required SVG Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 1024 1024" 
     width="1024" 
     height="1024">
  
  <!-- Fillable regions layer -->
  <g id="fillable-regions">
    <path id="region-1" 
          class="fillable-path"
          d="M 100,100 L 200,100 L 200,200 L 100,200 Z"
          fill="#FFFFFF"
          stroke="none" />
    
    <path id="region-2" 
          class="fillable-path"
          d="M 250,100 L 350,100 L 350,200 L 250,200 Z"
          fill="#FFFFFF"
          stroke="none" />
    
    <!-- More regions... -->
  </g>
  
  <!-- Outline layer (always on top, never filled) -->
  <g id="outlines">
    <path d="M 100,100 L 200,100 L 200,200 L 100,200 Z"
          fill="none"
          stroke="#000000"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round" />
    
    <path d="M 250,100 L 350,100 L 350,200 L 250,200 Z"
          fill="none"
          stroke="#000000"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round" />
    
    <!-- More outlines... -->
  </g>
</svg>
```

## Critical Rules

### 1. Two-Layer System
**Layer 1: Fillable regions** (`fillable-regions` group)
- Each region = one closed `<path>` element
- Must have unique `id` (e.g., "region-1", "region-2")
- Must have `class="fillable-path"` for easy selection
- Default `fill="#FFFFFF"` (white)
- `stroke="none"` (no stroke on fill layer)

**Layer 2: Outlines** (`outlines` group)
- Identical path shapes as fillable regions
- `fill="none"` (never filled)
- `stroke="#000000"` (black outlines)
- Stroke width 4-6px
- Placed AFTER fillable regions (renders on top)

### 2. Path Requirements

**Each fillable path MUST:**
- Be a closed path (start point = end point, or use Z command to auto-close)
- Have no gaps or holes in boundaries (prevents color "leaking")
- Not overlap with other paths (creates ambiguity in click detection)
- Be simple enough for touch targeting (not too small)
- Use consistent winding order (clockwise or counter-clockwise)

**Touch Target Guidelines:**
- **Minimum path size:** 44x44px at 1024x1024 viewBox (WCAG 2.1 Level AAA compliance)
- **Recommended minimum:** 60x60px for young children (easier tapping)
- **Small detail paths:** Group related small paths or simplify the design

**Path Coordinate Precision:**
- Round coordinates to 1-2 decimal places maximum
- Reduces file size without visual quality loss
- Example: `M 100.5 200.3` not `M 100.53782 200.34891`

### 3. Path IDs

Use descriptive, sequential IDs:
```xml
<!-- Good IDs -->
<path id="cat-body" class="fillable-path" ... />
<path id="cat-head" class="fillable-path" ... />
<path id="cat-ear-left" class="fillable-path" ... />
<path id="cat-ear-right" class="fillable-path" ... />

<!-- Avoid generic IDs -->
<path id="path4567" class="fillable-path" ... />
```

## Example: Simple Butterfly

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  
  <g id="fillable-regions">
    <!-- Left upper wing -->
    <path id="wing-left-upper" class="fillable-path"
          d="M 400,300 C 300,200 200,250 200,350 C 200,450 300,500 400,400 Z"
          fill="#FFFFFF" stroke="none" />
    
    <!-- Left lower wing -->
    <path id="wing-left-lower" class="fillable-path"
          d="M 400,450 C 300,550 200,600 200,700 C 200,800 300,750 400,650 Z"
          fill="#FFFFFF" stroke="none" />
    
    <!-- Body -->
    <path id="body" class="fillable-path"
          d="M 480,200 L 520,200 L 520,850 L 480,850 Z"
          fill="#FFFFFF" stroke="none" />
    
    <!-- Right upper wing -->
    <path id="wing-right-upper" class="fillable-path"
          d="M 600,300 C 700,200 800,250 800,350 C 800,450 700,500 600,400 Z"
          fill="#FFFFFF" stroke="none" />
    
    <!-- Right lower wing -->
    <path id="wing-right-lower" class="fillable-path"
          d="M 600,450 C 700,550 800,600 800,700 C 800,800 700,750 600,650 Z"
          fill="#FFFFFF" stroke="none" />
  </g>
  
  <g id="outlines">
    <!-- Same paths as above, but with stroke and no fill -->
    <path d="M 400,300 C 300,200 200,250 200,350 C 200,450 300,500 400,400 Z"
          fill="none" stroke="#000000" stroke-width="5" />
    <path d="M 400,450 C 300,550 200,600 200,700 C 200,800 300,750 400,650 Z"
          fill="none" stroke="#000000" stroke-width="5" />
    <path d="M 480,200 L 520,200 L 520,850 L 480,850 Z"
          fill="none" stroke="#000000" stroke-width="5" />
    <path d="M 600,300 C 700,200 800,250 800,350 C 800,450 700,500 600,400 Z"
          fill="none" stroke="#000000" stroke-width="5" />
    <path d="M 600,450 C 700,550 800,600 800,700 C 800,800 700,750 600,650 Z"
          fill="none" stroke="#000000" stroke-width="5" />
  </g>
</svg>
```

## Creating SVGs in Design Tools

### Inkscape (Free)

1. **Draw your image** with thick black strokes (4-6px)
2. **Select all paths** → Path → Break Apart
3. **Create two layers** (Layer → Layers panel):
   - Layer 1: "fillable-regions"
   - Layer 2: "outlines"
4. **Duplicate all paths** to both layers
5. **On fillable-regions layer:**
   - Remove strokes (set stroke to none)
   - Set fill to white (#FFFFFF)
   - Edit XML: Add `id="region-X"` and `class="fillable-path"`
6. **On outlines layer:**
   - Remove fills (set fill to none)
   - Keep black strokes (#000000)
   - Set stroke-linecap to "round" and stroke-linejoin to "round"
7. **Save As** → Plain SVG (not Inkscape SVG)
8. **Clean up XML**: Open in text editor and remove:
   - `inkscape:` attributes
   - `sodipodi:` attributes
   - Unnecessary `<defs>` and `<metadata>` sections

### Adobe Illustrator

1. **Create artboard** at 1024x1024px
2. **Draw outlines** using Pen Tool or shapes
3. **Set stroke** to 4-6pt black, no fill
4. **Create two layers:**
   - "fillable-regions" (bottom layer)
   - "outlines" (top layer)
5. **Duplicate paths** to both layers
6. **Modify fillable-regions layer:**
   - Select all → Remove stroke
   - Add white fill
7. **Object → Path → Simplify** to reduce points
8. **File → Export → Export As → SVG**
   - Styling: Presentation Attributes
   - Font: Convert to Outlines
   - Images: Link
   - Object IDs: Layer Names
   - Decimal: 2
   - Minify: Unchecked
9. **Clean up XML** in text editor (remove Adobe metadata)

### Figma

1. **Create frame** at 1024x1024
2. **Draw paths** using Pen tool
3. **Set stroke** to 4-6px, rounded caps and joins
4. **Flatten complex shapes** (Ctrl/Cmd + E)
5. **Name layers** descriptively (becomes SVG IDs)
6. **Export as SVG** (uncheck "Simplify stroke")
7. **Post-process** in text editor:
   - Add two-layer structure manually
   - Add `class="fillable-path"` to regions
   - Ensure proper grouping

### SVG Code Editors

For precise control, edit directly in code editors:
- **VS Code** with "SVG Preview" extension
- **Sublime Text** with SVG syntax highlighting
- **Atom** with SVG preview packages

## Common Mistakes to Avoid

❌ **Don't use groups within fillable-regions**
```xml
<!-- BAD -->
<g id="fillable-regions">
  <g id="cat">
    <path id="body" ... />
    <path id="head" ... />
  </g>
</g>
```

✅ **Flat structure only**
```xml
<!-- GOOD -->
<g id="fillable-regions">
  <path id="cat-body" ... />
  <path id="cat-head" ... />
</g>
```

❌ **Don't use anti-aliased or gradient fills**
```xml
<!-- BAD -->
<path fill="url(#gradient1)" ... />
```

✅ **Solid colors only**
```xml
<!-- GOOD -->
<path fill="#FFFFFF" ... />
```

❌ **Don't leave gaps in outlines**
- Paths must be perfectly closed
- No gaps where colors could leak

## Accessibility Features

For better accessibility, consider adding:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024"
     role="img"
     aria-label="Butterfly coloring page">
  <title>Butterfly Coloring Page</title>
  <desc>A simple butterfly with four wings and a body, perfect for coloring</desc>

  <g id="fillable-regions" role="group" aria-label="Colorable regions">
    <path id="wing-left-upper"
          class="fillable-path"
          aria-label="Left upper wing"
          role="button"
          tabindex="0"
          ... />
  </g>
</svg>
```

**Accessibility best practices:**
- Add `role="img"` to the SVG element
- Include `<title>` and `<desc>` for screen readers
- Use `aria-label` on individual paths for region identification
- Add `role="button"` and `tabindex="0"` for keyboard navigation
- Ensure sufficient color contrast (4.5:1 minimum)

## Validation Checklist

Before using an SVG file:
- [ ] Contains `<g id="fillable-regions">` layer
- [ ] Contains `<g id="outlines">` layer
- [ ] Each fillable path has unique ID
- [ ] Each fillable path has `class="fillable-path"`
- [ ] All fillable paths have white fill, no stroke
- [ ] All outline paths have black stroke, no fill
- [ ] Outline layer comes after fillable layer in XML
- [ ] ViewBox is 1024x1024
- [ ] All paths are closed (check for Z command or matching start/end)
- [ ] Minimum path size is 44x44px (60x60px recommended for children)
- [ ] File is plain SVG (no Inkscape metadata)
- [ ] File size is under 50KB (20KB ideal)
- [ ] No embedded raster images
- [ ] No JavaScript or external dependencies
- [ ] Valid XML structure (test with XML validator)

## Performance Considerations

- **Optimal path count:** 20-50 paths per image (best balance)
- **Maximum path count:** 200 paths (browser performance limit)
- **Complex details:** Simplify tiny details that are hard to color on mobile
- **File size targets:**
  - Ideal: 10-20KB per SVG
  - Maximum: 50KB (larger files may cause slowdowns)
- **Path complexity:** Use curves (C, Q commands) instead of many small line segments
- **Optimization tips:**
  - Remove unnecessary precision (round coordinates)
  - Use relative path commands (l, c, q) instead of absolute where appropriate
  - Combine adjacent collinear points
  - Remove invisible paths or duplicate elements

## Testing Your SVG

### Visual Testing
1. **Open in browser**: Drag SVG file into Chrome/Firefox/Safari
2. **Check rendering**: All outlines should be visible and crisp
3. **Zoom test**: Zoom to 200-300% - lines should remain smooth (vector advantage)
4. **Mobile test**: View on phone - ensure tap targets are large enough

### Functional Testing
1. **JavaScript click detection**:
```javascript
// Test that all fillable paths are selectable
const fillablePaths = document.querySelectorAll('.fillable-path');
console.log(`Found ${fillablePaths.length} fillable regions`);

fillablePaths.forEach(path => {
  path.addEventListener('click', (e) => {
    console.log(`Clicked region: ${e.target.id}`);
    e.target.setAttribute('fill', '#FF0000'); // Test fill
  });
});
```

2. **Validate structure**:
```javascript
// Check for required elements
const fillableLayer = document.getElementById('fillable-regions');
const outlinesLayer = document.getElementById('outlines');
const pathsWithClass = document.querySelectorAll('.fillable-path');

console.assert(fillableLayer !== null, 'Missing fillable-regions layer');
console.assert(outlinesLayer !== null, 'Missing outlines layer');
console.assert(pathsWithClass.length > 0, 'No paths with fillable-path class');
```

3. **XML validation**: Use online validator (e.g., https://www.xmlvalidation.com/)

### Automated Testing Tools
- **SVGO**: Optimize and clean SVG files automatically
- **SVG Validator**: Check SVG syntax and structure
- **Lighthouse**: Test accessibility and performance (if embedded in web page)

## Troubleshooting Common Issues

### Issue: Paths not clickable in app
**Solution:**
- Ensure `class="fillable-path"` is present on all fillable paths
- Check that paths have unique IDs
- Verify paths are actually closed (use Z command)
- Check for overlapping paths (only top path will receive clicks)

### Issue: Outlines disappear when coloring
**Solution:**
- Ensure outlines layer comes AFTER fillable-regions in XML
- Confirm outline paths have `fill="none"`
- Check z-index rendering order

### Issue: Colors "leak" outside boundaries
**Solution:**
- Ensure all paths are fully closed (no gaps)
- Check for subpixel gaps (zoom to 1000% in editor)
- Verify stroke-linejoin is set to "round" or "miter"

### Issue: Small regions can't be tapped on mobile
**Solution:**
- Increase minimum region size to 60x60px
- Merge small adjacent regions
- Simplify design to remove tiny details

### Issue: SVG displays incorrectly in app
**Solution:**
- Validate XML syntax (check for unclosed tags)
- Remove namespace prefixes (inkscape:, sodipodi:)
- Ensure viewBox is set correctly
- Check file encoding is UTF-8

### Issue: Poor performance/slow rendering
**Solution:**
- Reduce path count (aim for <100 paths)
- Simplify complex paths (use fewer control points)
- Round coordinates to 1 decimal place
- Run through SVGO optimizer

## Tools for SVG Creation and Optimization

### JPEG to SVG Converter (`index.html`)
This specification is designed to work with the JPEG-to-SVG coloring app converter. The app will:

1. **Generate outline-based SVGs** from uploaded JPEG images
2. **Detect regions** using edge detection and flood fill algorithms
3. **Create fillable paths** for each detected region
4. **Apply line weights** based on boundary vs. detail classification
5. **Enable click-to-color** interaction in the browser

**Current implementation:**
- Generates single-layer SVG with outlines only
- Uses region detection for automatic path generation
- Supports dual line weights (boundary vs. detail)

**To use hand-crafted SVGs with the app:**
- Follow this two-layer specification
- App's JavaScript can detect `.fillable-path` class
- Clicking a path changes its `fill` attribute

### SVG Path Simplifier (`svg-simplifier.html`)
A standalone tool for optimizing SVG files by reducing path complexity with interactive polygon editing:

**Use this tool when:**
- Your SVG has too many points (slow rendering)
- File size is too large (>50KB)
- Paths are overly detailed from design tools
- You want to optimize for web/mobile performance
- You need to merge or split coloring regions after generation

**Features:**
- **Two simplification algorithms**:
  - **Douglas-Peucker**: Distance-based simplification, ideal for geometric shapes
  - **Visvalingam**: Area-based simplification with built-in intersection avoidance, better for organic shapes
- **Intersection detection**: Prevents simplified paths from crossing
- **Auto-adjustment**: Automatically finds optimal tolerance to avoid intersections
- **Coordinate rounding**: Reduces file size without visible quality loss
- **Live preview**: See before/after comparison with statistics

**Polygon Editing Tools:**
- **Merge mode**: Click on shared edges to combine adjacent polygons
- **Split mode**: Click two points to divide a polygon into two regions
- **Undo/Redo**: Full history tracking for all edits
- **Visual feedback**: Highlights edges and snap points during editing

**How to use:**
1. Open `svg-simplifier.html` in your browser
2. Drag and drop your SVG file
3. Choose algorithm:
   - Douglas-Peucker for geometric/technical drawings
   - Visvalingam for hand-drawn or organic shapes
4. Adjust the tolerance slider (higher = more simplification)
5. Enable "Prevent path intersections" to auto-adjust if paths cross
6. Enable "Round coordinates" to reduce file size
7. Click "Simplify Paths" to process

**After simplification, you can edit polygons:**
8. Switch to "Merge Polygons" mode to combine adjacent regions by clicking shared edges
9. Switch to "Split Polygon" mode to divide regions by clicking two points
10. Use Undo/Redo to navigate through edit history
11. Download the final optimized SVG

**Recommended settings:**
- **For coloring apps**: Use Visvalingam algorithm (built-in intersection avoidance)
- Start with tolerance 2.0 and adjust based on results
- Always keep "Prevent path intersections" enabled
- Enable coordinate rounding for file size reduction
- Aim for 30-50% point reduction for best quality/size balance

**Algorithm comparison:**
- **Douglas-Peucker**: Measures perpendicular distance from line segments. Fast and predictable, works well for straight lines and geometric shapes.
- **Visvalingam**: Calculates triangular areas between points. Better preserves the visual characteristics of curves and organic shapes. Includes modified intersection avoidance that promotes points to prevent crossings.

### Example App Integration Code

```javascript
// Detect and color fillable regions
document.querySelectorAll('.fillable-path').forEach(path => {
  path.style.cursor = 'pointer';

  path.addEventListener('click', function(e) {
    const currentColor = document.getElementById('colorPicker').value;
    this.setAttribute('fill', currentColor);
  });

  // Keyboard accessibility
  path.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const currentColor = document.getElementById('colorPicker').value;
      this.setAttribute('fill', currentColor);
    }
  });
});
```

## Naming Convention

Files should follow this pattern:
```
animals/cat-sitting.svg
animals/dog-running.svg
vehicles/car-race.svg
vehicles/truck-monster.svg
nature/tree-oak.svg
nature/flower-sunflower.svg
characters/princess-castle.svg
characters/superhero-flying.svg
```

**Naming rules:**
- Use lowercase only
- Hyphens for spaces (not underscores)
- Category/subcategory structure
- Descriptive, specific names
- No special characters or numbers (unless part of name)

## Summary

The ideal SVG for coloring apps uses a **two-layer architecture**:
1. **Fillable regions layer** - where colors are applied
2. **Outlines layer** - permanent black lines that stay on top

This structure ensures:
- Clean, professional coloring experience
- Reliable click/tap detection
- Clear visual boundaries
- Accessibility support
- Cross-browser compatibility
- Optimal performance

For best results, follow these key principles:
- Keep paths simple and closed
- Make tap targets large enough (44-60px minimum)
- Use semantic IDs and classes
- Optimize file size
- Test on multiple devices
