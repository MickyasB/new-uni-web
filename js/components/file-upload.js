const filesData = new Map();

export function renderFileUpload(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    filesData.set(containerId, { files: [], options });

    const html = `
        <div class="file-upload-container">
            <div class="file-drop-zone" id="drop-zone-${containerId}">
                <div class="file-icon">&#128194;</div>
                <p>Drag files here or click to browse</p>
                <input type="file" id="file-input-${containerId}" class="hidden-input" 
                    ${options.accept ? `accept="${options.accept}"` : ''} 
                    ${options.maxFiles !== 1 ? 'multiple' : ''} style="display:none;">
            </div>
            <div class="file-list" id="file-list-${containerId}"></div>
        </div>
    `;
    container.innerHTML = html;

    const dropZone = document.getElementById(`drop-zone-${containerId}`);
    const fileInput = document.getElementById(`file-input-${containerId}`);

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files, containerId);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, containerId);
        fileInput.value = '';
    });
}

function handleFiles(newFiles, containerId) {
    const data = filesData.get(containerId);
    if (!data) return;
    const options = data.options;
    const fileList = document.getElementById(`file-list-${containerId}`);

    Array.from(newFiles).forEach(file => {
        if (options.maxFiles && data.files.length >= options.maxFiles) {
            alert(`Maximum ${options.maxFiles} files allowed.`);
            return;
        }
        if (options.maxSize && file.size > options.maxSize) {
            alert(`File ${file.name} exceeds max size.`);
            return;
        }

        const fileObj = { file, id: Date.now() + Math.random() };
        data.files.push(fileObj);
        
        const fileEl = document.createElement('div');
        fileEl.className = 'file-item';
        fileEl.innerHTML = `
            <span class="file-item-icon">&#128196;</span>
            <div class="file-item-info">
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-size">${(file.size / 1024).toFixed(1)} KB</span>
                <div class="file-progress-bar"><div class="file-progress" style="width: 0%; height: 4px; background: var(--color-success, #28A745); transition: width 0.5s;"></div></div>
            </div>
            <button class="file-item-remove" data-id="${fileObj.id}">&times;</button>
        `;
        fileList.appendChild(fileEl);

        const progress = fileEl.querySelector('.file-progress');
        setTimeout(() => progress.style.width = '100%', 100);

        fileEl.querySelector('.file-item-remove').addEventListener('click', () => {
            data.files = data.files.filter(f => f.id !== fileObj.id);
            fileEl.remove();
        });

        if (options.onUpload) {
            options.onUpload(file);
        }
    });
}

export function getUploadedFiles(containerId) {
    const data = filesData.get(containerId);
    return data ? data.files.map(f => f.file) : [];
}

export default {
    renderFileUpload,
    getUploadedFiles
};
