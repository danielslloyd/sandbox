# Coloring App Build Specification for Claude Code

## Tech Stack Decision

**Recommended: Web-based PWA (Progressive Web App)**
- Deploys to Amazon Appstore as WebView-wrapped app
- Single codebase
- JavaScript/HTML5 Canvas for rendering
- Can package with Apache Cordova or Capacitor

**Alternative: Native Android**
- Kotlin/Java with Android VectorDrawable
- More complex, platform-specific

**Proceed with: Web-based PWA approach**

## Project Structure

```
coloring-app/
├── index.html
├── css/
│   ├── main.css
│   └── tablet-optimized.css
├── js/
│   ├── app.js (main application logic)
│   ├── svg-handler.js (SVG loading and manipulation)
│   ├── color-palette.js (color selection)
│   ├── storage.js (save/load functionality)
│   └── touch-handler.js (touch events and gestures)
├── assets/
│   ├── coloring-pages/ (SVG files)
│   │   ├── animals/
│   │   ├── vehicles/
│   │   └── nature/
│   └── sounds/ (optional tap/fill sounds)
├── icons/ (app icons for packaging)
└── config.xml (Cordova/Capacitor configuration)
```

## Core Features to Implement

### 1. SVG Loading and Rendering
- Load SVG files from assets directory
- Parse SVG DOM to identify fillable paths
- Render in viewport with proper scaling
- Maintain aspect ratio across Fire tablet sizes (7", 8", 10")

### 2. Color Application System
- Click/tap detection on SVG path elements
- Apply color by setting `fill` attribute
- Preserve outline strokes (don't color them)
- Instant visual feedback (<100ms)

### 3. Tool Palette
**Required tools:**
- Color palette (20+ colors in grid layout)
- Eraser (reset path to white/transparent)
- Clear page (reset all paths)
- Undo/redo stack (minimum 10 actions)

**UI placement:**
- Bottom of screen for thumb access
- Large touch targets (60px minimum)
- Icon-based (minimal text)

### 4. Page Selection
- Gallery view of available coloring pages
- Thumbnail previews
- Category filtering
- Scroll-friendly grid layout

### 5. Save/Load System
- Save colored SVG state to LocalStorage or IndexedDB
- Export to PNG for sharing
- Multiple save slots per coloring page
- Auto-save on page change

### 6. Touch Optimization
- Pinch-to-zoom support
- Pan/drag when zoomed
- Double-tap to reset zoom
- Prevent accidental zooms while coloring
- Disable browser default touch behaviors

## Technical Requirements

### Performance Targets
- Initial load: <3 seconds
- Color fill response: <100ms
- Smooth panning at 30+ FPS
- Memory efficient (keep <200MB RAM usage)

### SVG Handling
- Use native SVG DOM manipulation (no heavy libraries)
- Event delegation for path click handling
- Efficient path selection algorithm
- See `svg-structure.md` for SVG file specifications

### State Management
```javascript
// Example state structure
{
  currentPage: "animals/cat.svg",
  coloredPaths: {
    "path-1": "#FF0000",
    "path-2": "#00FF00"
  },
  undoStack: [...],
  redoStack: [...],
  currentColor: "#FF0000"
}
```

### Storage Strategy
- Use IndexedDB for colored page states
- LocalStorage for app preferences
- Store as JSON with page ID and colored paths mapping
- PNG export using Canvas rendering of SVG

## Amazon Fire Tablet Packaging

### Cordova Configuration
```xml
<widget id="com.yourname.coloringapp" version="1.0.0">
  <preference name="orientation" value="sensor" />
  <preference name="fullscreen" value="false" />
  <preference name="DisallowOverscroll" value="true" />
  <platform name="android">
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="30" />
  </platform>
</widget>
```

### Build Process
1. Develop as web app (test in browser)
2. Add Cordova: `cordova create coloringapp`
3. Add Android platform: `cordova platform add android`
4. Build APK: `cordova build android`
5. Test on Fire tablet via sideload
6. Submit to Amazon Appstore

## File Size Optimization
- Target: <100MB total app size
- SVG files are small (2-10KB each)
- Budget: 50 coloring pages × 5KB = 250KB for SVGs
- Main concern: icons, sounds (if added)
- Use SVG compression/optimization tools

## Testing Checklist
- [ ] Test on 7", 8", 10" screen sizes
- [ ] Portrait and landscape orientation
- [ ] Touch accuracy on small paths
- [ ] Zoom and pan performance
- [ ] Save/load persistence
- [ ] Memory usage during long sessions
- [ ] Undo/redo edge cases
- [ ] Clear page confirmation works
- [ ] Export to PNG quality

## Privacy/Safety
- No analytics or tracking
- No network requests (fully offline)
- No data collection
- Privacy policy: "This app collects no data"

## Sample Code Structure

### svg-handler.js responsibilities:
- Load SVG file
- Inject into DOM
- Attach click handlers to fillable paths
- Apply colors to paths
- Export to PNG

### app.js responsibilities:
- Initialize application
- Coordinate between modules
- Handle page selection
- Manage application state
- Undo/redo logic

### touch-handler.js responsibilities:
- Zoom/pan gestures
- Prevent default browser behaviors
- Touch target expansion for small paths

## Development Workflow
1. Build basic HTML/CSS/JS structure
2. Implement SVG loading and display
3. Add color selection and application
4. Implement undo/redo
5. Add save/load functionality
6. Create page gallery
7. Add touch optimizations
8. Package with Cordova
9. Test on Fire device
10. Polish and optimize

## Known Challenges
- **Small path accuracy**: Use touch tolerance (expand hit detection)
- **Zoom while coloring**: Lock zoom during active coloring
- **Performance with complex SVGs**: Limit path count per page (<200)
- **PNG export quality**: Render at 2x resolution then scale
