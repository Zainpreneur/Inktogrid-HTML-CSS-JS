// Inktogrid - HTML/CSS/JS Only Application
// A paper-to-ERP staging middleware using only vanilla HTML/CSS/JavaScript
// Features: Batch processing, multi-document handling, export all data

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
    initCamera();
    initSchemaBuilder();
    initValidation();
    initExport();
    initBatchProcessing();
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
        handleFileSelect(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files);
    });
}

function handleFileSelect(files) {
    // Show all selected files
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    uploadText.innerHTML = `<span>Selected: ${fileNames}</span><p>to scan or upload documents</p>`;
    
    // Process each file
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create a temporary preview card
                const existingPreview = document.querySelector('.file-preview');
                if (existingPreview) existingPreview.remove();
                
                const previewCard = document.createElement('div');
                previewCard.className = 'file-preview';
                previewCard.innerHTML = `
                    <div class="preview-image">
                        <img src="${e.target.result}" alt="${file.name}" style="max-width: 100px; max-height: 100px;">
                    </div>
                    <div class="preview-info">
                        <span>${file.name}</span>
                        <button class="process-btn">Process</button>
                    </div>
                `;
                
                // Insert after upload area
                const uploadArea = document.getElementById('uploadArea');
                uploadArea.insertAdjacentElement('afterend', previewCard);
                
                // Add process button handler
                const processBtn = previewCard.querySelector('.process-btn');
                processBtn.addEventListener('click', () => {
                    // Simulate HTR processing - extract text from file name or use placeholder
                    const verifiedText = prompt(`Enter verified text for ${file.name}:`, '');
                    if (verifiedText) {
                        addDocumentToBatch(file.name, verifiedText);
                        alert(`Document "${file.name}" added to batch processing queue`);
                    }
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* Batch Processing Queue */
const batchQueue = [];

function addDocumentToBatch(filename, verifiedText) {
    batchQueue.push({
        filename,
        verifiedText,
        timestamp: new Date().toISOString()
    });
    
    updateBatchDisplay();
}

function updateBatchDisplay() {
    const batchSection = document.getElementById('batchDisplay');
    if (batchQueue.length === 0) {
        batchSection.innerHTML = '<p>No documents in batch queue</p>';
        document.getElementById('extractAllBtn').style.display = 'none';
        return;
    }
    
    document.getElementById('extractAllBtn').style.display = 'block';
    
    let html = `<h3>Batch Queue (${batchQueue.length} documents)</h3>`;
    html += '<div class="batch-items">';
    
    batchQueue.forEach((doc, index) => {
        html += `
            <div class="batch-item">
                <span>${doc.filename}</span>
                <textarea class="batch-textarea" data-index="${index}" rows="2">${doc.verifiedText}</textarea>
                <button class="remove-batch-item" data-index="${index}">Remove</button>
            </div>
        `;
    });
    
    html += '</div>';
    batchSection.innerHTML = html;
    
    // Add remove handlers
    document.querySelectorAll('.remove-batch-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            batchQueue.splice(index, 1);
            updateBatchDisplay();
        });
    });
    
    // Add text area input handlers
    document.querySelectorAll('.batch-textarea').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const index = parseInt(textarea.dataset.index);
            batchQueue[index].verifiedText = e.target.value;
        });
    });
}

/* Batch Processing */
function initBatchProcessing() {
    const extractAllBtn = document.getElementById('extractAllBtn');
    
    extractAllBtn.addEventListener('click', () => {
        if (batchQueue.length === 0) {
            alert('No documents in batch queue');
            return;
        }
        
        const format = document.querySelector('input[name="format"]:checked')?.value || 'csv';
        extractAllData(format);
    });
}

function extractAllData(format) {
    const allTexts = batchQueue.map(doc => doc.verifiedText);
    let exportData;
    
    switch (format) {
        case 'csv':
            exportData = batchCSVFromTexts(allTexts);
            break;
        case 'json':
            exportData = batchJSONFromTexts(allTexts);
            break;
        case 'sql':
            exportData = batchSQLFromTexts(allTexts);
            break;
        default:
            exportData = '';
    }
    
    displayBatchExportResult(exportData, format);
}

function batchCSVFromTexts(texts) {
    if (texts.length === 0) return '';
    
    const headers = ['filename', 'field1', 'field2', 'field3', 'field4', 'field5'];
    const lines = [headers.join(',')];
    
    texts.forEach((text, index) => {
        const itemValues = text.split(',').slice(0, 5);
        while (itemValues.length < 5) itemValues.push('');
        const row = [`doc_${index + 1}`, ...itemValues].join(',');
        lines.push(row);
    });
    
    return lines.join('\n');
}

function batchJSONFromTexts(texts) {
    if (texts.length === 0) return '[]';
    
    const headers = ['field1', 'field2', 'field3', 'field4', 'field5'];
    const objects = texts.map((text, index) => {
        const values = text.split(',').slice(0, 5);
        const obj = {
            filename: `doc_${index + 1}`,
        };
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
    
    return JSON.stringify(objects, null, 2);
}

function batchSQLFromTexts(texts) {
    if (texts.length === 0) return '-- No data to export';
    
    let sql = '-- Inktogrid Batch Export\n';
    sql += 'INSERT INTO records (filename, field1, field2, field3, field4, field5) VALUES\n';
    
    const values = texts.map((text, index) => {
        const vals = text.split(',').slice(0, 5).map(v => `'${v.replace(/'/g, "''")}'`);
        return `('doc_${index + 1}', ${vals.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += ';';
    
    return sql;
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

/* Batch Export Result Display */
function displayBatchExportResult(data, format) {
    const exportResult = document.getElementById('exportResult');
    const resultDiv = document.createElement('div');
    
    resultDiv.innerHTML = `
        <h3>Batch Export Preview (${format.toUpperCase()})</h3>
        <pre><code>${data}</code></pre>
        <button id="copyBatchBtn">Copy to Clipboard</button>
        <button id="downloadBtn">Download File</button>
    `;
    
    exportResult.innerHTML = '';
    exportResult.appendChild(resultDiv);
    exportResult.style.display = 'block';
    
    // Copy button
    const copyBatchBtn = document.getElementById('copyBatchBtn');
    copyBatchBtn.addEventListener('click', () => {
        const code = resultDiv.querySelector('code');
        const text = code ? code.textContent || code.innerHTML : '';
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    });
    
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inktogrid-batch-export-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Initialize first section visibility
document.querySelectorAll('section')[0].style.display = 'block';