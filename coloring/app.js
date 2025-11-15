// Main application controller
class ColoringAppConverter {
    constructor() {
        this.imageFile = null;
        this.imageProcessor = new ImageProcessor();
        this.svgGenerator = new SVGGenerator();

        this.initElements();
        this.initEventListeners();
        this.updateSliderValues();
    }

    initElements() {
        // File input
        this.fileInput = document.getElementById('fileInput');
        this.uploadBox = document.getElementById('uploadBox');

        // Controls
        this.minAreaSlider = document.getElementById('minArea');
        this.edgeThresholdSlider = document.getElementById('edgeThreshold');
        this.simplificationSlider = document.getElementById('simplification');
        this.uniformWeightSlider = document.getElementById('uniformWeight');
        this.boundaryWeightSlider = document.getElementById('boundaryWeight');
        this.detailWeightSlider = document.getElementById('detailWeight');

        this.convertBtn = document.getElementById('convertBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Canvases
        this.originalCanvas = document.getElementById('originalCanvas');
        this.processedCanvas = document.getElementById('processedCanvas');

        // Preview section
        this.previewSection = document.getElementById('previewSection');
        this.svgContainer = document.getElementById('svgContainer');
        this.statusMessage = document.getElementById('statusMessage');

        // Weight mode groups
        this.uniformWeightGroup = document.getElementById('uniformWeightGroup');
        this.dualWeightGroup = document.getElementById('dualWeightGroup');
    }

    initEventListeners() {
        // File upload
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

        // Slider value updates
        const sliders = [
            { slider: this.minAreaSlider, display: 'minAreaValue' },
            { slider: this.edgeThresholdSlider, display: 'edgeThresholdValue' },
            { slider: this.simplificationSlider, display: 'simplificationValue' },
            { slider: this.uniformWeightSlider, display: 'uniformWeightValue' },
            { slider: this.boundaryWeightSlider, display: 'boundaryWeightValue' },
            { slider: this.detailWeightSlider, display: 'detailWeightValue' }
        ];

        sliders.forEach(({ slider, display }) => {
            slider.addEventListener('input', () => {
                document.getElementById(display).textContent = slider.value;
            });
        });

        // Line weight mode
        const weightModeRadios = document.querySelectorAll('input[name="lineWeightMode"]');
        weightModeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleWeightModeChange());
        });

        // Convert button
        this.convertBtn.addEventListener('click', () => this.convertToSVG());

        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    updateSliderValues() {
        document.getElementById('minAreaValue').textContent = this.minAreaSlider.value;
        document.getElementById('edgeThresholdValue').textContent = this.edgeThresholdSlider.value;
        document.getElementById('simplificationValue').textContent = this.simplificationSlider.value;
        document.getElementById('uniformWeightValue').textContent = this.uniformWeightSlider.value;
        document.getElementById('boundaryWeightValue').textContent = this.boundaryWeightSlider.value;
        document.getElementById('detailWeightValue').textContent = this.detailWeightSlider.value;
    }

    handleWeightModeChange() {
        const mode = document.querySelector('input[name="lineWeightMode"]:checked').value;

        if (mode === 'uniform') {
            this.uniformWeightGroup.classList.remove('hidden');
            this.dualWeightGroup.classList.add('hidden');
        } else {
            this.uniformWeightGroup.classList.add('hidden');
            this.dualWeightGroup.classList.remove('hidden');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.match('image.*')) {
            this.showStatus('Please select an image file', 'error');
            return;
        }

        this.imageFile = file;
        this.loadImage(file);
    }

    loadImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.displayOriginalImage(img);
                this.convertBtn.disabled = false;
                this.showStatus('Image loaded successfully! Click "Convert to SVG" to process.', 'success');
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    displayOriginalImage(img) {
        const ctx = this.originalCanvas.getContext('2d');

        // Resize canvas to fit image while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        this.originalCanvas.width = width;
        this.originalCanvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Store the image data for processing
        this.imageData = ctx.getImageData(0, 0, width, height);
    }

    async convertToSVG() {
        if (!this.imageData) {
            this.showStatus('No image loaded', 'error');
            return;
        }

        this.showStatus('Processing image... This may take a moment.', 'info');
        this.convertBtn.disabled = true;

        try {
            // Get parameters
            const params = {
                minArea: parseFloat(this.minAreaSlider.value),
                edgeThreshold: parseFloat(this.edgeThresholdSlider.value),
                simplification: parseFloat(this.simplificationSlider.value),
                lineWeightMode: document.querySelector('input[name="lineWeightMode"]:checked').value,
                uniformWeight: parseFloat(this.uniformWeightSlider.value),
                boundaryWeight: parseFloat(this.boundaryWeightSlider.value),
                detailWeight: parseFloat(this.detailWeightSlider.value)
            };

            // Process image to detect edges
            const processedData = await this.imageProcessor.processImage(this.imageData, params);

            // Display processed image
            this.processedCanvas.width = processedData.width;
            this.processedCanvas.height = processedData.height;
            const ctx = this.processedCanvas.getContext('2d');
            ctx.putImageData(processedData, 0, 0);

            // Generate SVG
            this.svgResult = await this.svgGenerator.generateSVG(processedData, params);

            // Display SVG
            this.svgContainer.innerHTML = this.svgResult.svg;

            // Show preview section
            this.previewSection.classList.remove('hidden');
            this.switchTab('svg');

            this.showStatus(`SVG generated successfully! Found ${this.svgResult.stats.regions} regions, ${this.svgResult.stats.mergedRegions} small regions merged.`, 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            this.showStatus('Error during conversion: ' + error.message, 'error');
        } finally {
            this.convertBtn.disabled = false;
        }
    }

    downloadSVG() {
        if (!this.svgResult) {
            this.showStatus('No SVG to download', 'error');
            return;
        }

        const blob = new Blob([this.svgResult.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.imageFile.name.replace(/\.[^/.]+$/, '') + '-coloring.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('SVG downloaded successfully!', 'success');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update preview panels
        document.querySelectorAll('.preview-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        if (tabName === 'original') {
            document.getElementById('originalPreview').classList.add('active');
        } else if (tabName === 'processed') {
            document.getElementById('processedPreview').classList.add('active');
        } else if (tabName === 'svg') {
            document.getElementById('svgPreview').classList.add('active');
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message ' + type;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ColoringAppConverter();
});
