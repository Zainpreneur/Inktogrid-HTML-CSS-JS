// Inktogrid - HTML/CSS/JS Only Application
// A paper-to-ERP staging middleware using only vanilla HTML/CSS/JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
    initCamera();
    initSchemaBuilder();
    initValidation();
    initExport();
});

/* Document Ingestion */
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadText = uploadArea.querySelector('.upload-text');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });
}

function handleFileSelect(file) {
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            document.getElementById('originalImg').src = e.target.result;
            showSection('htr');
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/* Camera Initialization */
function initCamera() {
    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraSection = document.getElementById('cameraSection');
    const video = document.getElementById('previewVideo');
    const canvas = document.getElementById('captureCanvas');
    const captureBtn = document.getElementById('captureBtn');
    const capturePage = document.getElementById('capture');

    openCameraBtn.addEventListener('click', () => {
        cameraSection.style.display = 'block';
        openCameraBtn.style.display = 'none';
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    video.srcObject = stream;
                })
                .catch(err => {
                    console.error('Camera access denied:', err);
                    alert('Camera access denied. Please allow camera permissions.');
                });
        }
    });

    captureBtn.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg');
        document.getElementById('originalImg').src = dataURL;
        showSection('htr');
        
        // Stop camera stream
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
}

/* Schema Builder */
function initSchemaBuilder() {
    const addEntityBtn = document.getElementById('addEntity');
    const entityFields = document.getElementById('entityFields');
    let entityCount = 0;

    addEntityBtn.addEventListener('click', () => {
        entityCount++;
        const entityRow = document.createElement('div');
        entityRow.className = 'entity-row';
        entityRow.innerHTML = `
            <input type="text" placeholder="Entity name" entity-index="${entityCount}">
            <button class="add-field">+ Add Field</button>
            <button class="remove-entity">-</button>
        `;
        entityFields.appendChild(entityRow);
        
        // Add field button
        const addFieldBtn = entityRow.querySelector('.add-field');
        addFieldBtn.addEventListener('click', () => {
            const fieldInput = document.createElement('input');
            fieldInput.type = 'text';
            fieldInput.placeholder = 'Field name';
            fieldInput.className = 'field-input';
            entityRow.appendChild(fieldInput);
        });
        
        // Remove entity button
        const removeBtn = entityRow.querySelector('.remove-entity');
        removeBtn.addEventListener('click', () => {
            entityRow.remove();
        });
    });
}

/* Validation */
function initValidation() {
    // Auto-standardization logic
    const dateInput = document.querySelector('input[placeholder*="Entity"]');
    if (dateInput) {
        dateInput.addEventListener('blur', (e) => {
            let value = e.target.value;
            // Simple date format check
            if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(value)) {
                value = value.replace(/[\/\-]/g, '-').replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$1-$2');
                e.target.value = value;
            }
        });
    }
}

/* Export Functionality */
function initExport() {
    const exportFormatRadios = document.querySelectorAll('input[name="format"]');
    const exportBtn = document.getElementById('exportBtn');
    const exportResult = document.getElementById('exportResult');

    exportBtn.addEventListener('click', () => {
        const selectedFormat = document.querySelector('input[name="format"]:checked').value;
        const verifiedText = document.getElementById('verifiedText').textContent || 
                            document.getElementById('verifiedText').innerText || '';
        
        let exportData;
        
        switch (selectedFormat) {
            case 'csv':
                exportData = csvFromText(verifiedText);
                break;
            case 'json':
                exportData = jsonFromText(verifiedText);
                break;
            case 'sql':
                exportData = sqlFromText(verifiedText);
                break;
        }
        
        displayExportResult(exportData, selectedFormat);
    });
}

function textToArray(text) {
    if (!text) return [];
    return text.split(/[.\n]+/).filter(t => t.trim().length > 0);
}

function csvFromText(text) {
    const items = textToArray(text);
    if (items.length === 0) return '';
    
    const headers = ['field1', 'field2', 'field3', 'field4', 'field5'];
    const lines = [headers.join(',')];
    
    items.forEach((item, index) => {
        const values = item.split(',').slice(0, 5);
        while (values.length < 5) values.push('');
        lines.push(values.join(','));
    });
    
    return lines.join('\n');
}

function jsonFromText(text) {
    const items = textToArray(text);
    if (items.length === 0) return '[]';
    
    const headers = ['field1', 'field2', 'field3', 'field4', 'field5'];
    const objects = items.map(item => {
        const values = item.split(',').slice(0, 5);
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
    
    return JSON.stringify(objects, null, 2);
}

function sqlFromText(text) {
    const items = textToArray(text);
    if (items.length === 0) return '-- No data to export';
    
    let sql = '-- Inktogrid Export\n';
    sql += 'INSERT INTO records (field1, field2, field3, field4, field5) VALUES\n';
    
    const values = items.map(item => {
        const vals = item.split(',').slice(0, 5).map(v => `'${v.replace(/'/g, "''")}'`);
        return `(${vals.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += ';';
    
    return sql;
}

function displayExportResult(data, format) {
    const exportResult = document.getElementById('exportResult');
    const resultDiv = document.createElement('div');
    
    resultDiv.innerHTML = `
        <h3>Export Preview (${format.toUpperCase()})</h3>
        <pre><code>${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</code></pre>
        <button id="copyBtn">Copy to Clipboard</button>
    `;
    
    exportResult.innerHTML = '';
    exportResult.appendChild(resultDiv);
    exportResult.style.display = 'block';
    
    // Copy button
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
        const code = resultDiv.querySelector('code');
        const text = code ? code.textContent || code.innerHTML : '';
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    });
}

/* Section Management */
function showSection(sectionId) {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

// Initialize first section visibility
document.querySelectorAll('section')[0].style.display = 'block';