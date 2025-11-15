# SVG Structure Specification for Coloring Pages

## File Format Requirements

- **Format**: Plain SVG (not Inkscape SVG or proprietary formats)
- **Dimensions**: 1024x1024 viewBox (scales to any screen size)
- **Stroke width**: 4-6px for outlines (thick enough for children)
- **Color depth**: RGB only (no CMYK or special color spaces)

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
- Be a closed path (start point = end point)
- Have no gaps or holes in boundaries
- Not overlap with other paths (creates ambiguity)
- Be simple enough for touch targeting (not too small)

**Minimum path size:** 30x30px at 1024x1024 viewBox (too small = hard to tap)

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

## Creating SVGs in Inkscape

1. **Draw your image** with thick black strokes
2. **Select all paths** → Path → Break Apart
3. **Create two layers:**
   - Layer 1: "fillable-regions"
   - Layer 2: "outlines"
4. **Duplicate all paths** to both layers
5. **On fillable-regions layer:**
   - Remove strokes (set stroke to none)
   - Set fill to white
   - Add IDs and class="fillable-path"
6. **On outlines layer:**
   - Remove fills (set fill to none)
   - Keep black strokes
7. **Save As** → Plain SVG (not Inkscape SVG)
8. **Clean up XML**: Remove Inkscape-specific attributes

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
- [ ] All paths are closed (no open shapes)
- [ ] Minimum path size is 30x30px
- [ ] File is plain SVG (no Inkscape metadata)

## Performance Considerations

- **Optimal path count:** 20-50 paths per image
- **Maximum path count:** 200 paths (performance limit)
- **Complex details:** Simplify tiny details that are hard to color
- **File size:** Keep under 20KB per SVG

## Naming Convention

Files should follow this pattern:
```
animals/cat-sitting.svg
animals/dog-running.svg
vehicles/car-race.svg
vehicles/truck-monster.svg
nature/tree-oak.svg
nature/flower-sunflower.svg
```

Use lowercase, hyphens for spaces, descriptive names.
