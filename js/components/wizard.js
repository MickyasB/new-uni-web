const wizardDataMap = new Map();

export function renderWizard(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    wizardDataMap.set(containerId, {
        config,
        currentStep: 0,
        data: {},
        autoSaveInterval: null
    });

    const html = `
        <div class="wizard-container">
            <div class="wizard-stepper" id="wizard-stepper-${containerId}"></div>
            <div class="wizard-content" id="wizard-content-${containerId}"></div>
            <div class="wizard-footer">
                <div class="wizard-autosave-status" id="wizard-autosave-${containerId}"></div>
                <div class="wizard-actions">
                    <button id="wizard-prev-${containerId}" class="btn">Previous</button>
                    <button id="wizard-next-${containerId}" class="btn btn-primary">Next</button>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;

    const state = wizardDataMap.get(containerId);

    document.getElementById(`wizard-prev-${containerId}`).addEventListener('click', () => {
        saveCurrentStepData(containerId);
        if (state.currentStep > 0) goToStep(containerId, state.currentStep - 1);
    });

    document.getElementById(`wizard-next-${containerId}`).addEventListener('click', () => {
        saveCurrentStepData(containerId);
        if (validateStep(containerId)) {
            if (state.currentStep < config.steps.length - 1) {
                goToStep(containerId, state.currentStep + 1);
            } else {
                if (config.onComplete) config.onComplete(state.data);
            }
        } else {
            alert('Please fill all required fields.');
        }
    });

    if (config.autoSave) {
        state.autoSaveInterval = setInterval(() => {
            saveCurrentStepData(containerId);
            localStorage.setItem(`wizard-${containerId}`, JSON.stringify(state.data));
            const status = document.getElementById(`wizard-autosave-${containerId}`);
            if (status) {
                status.textContent = 'Saving...';
                setTimeout(() => status.textContent = 'Saved \u2713', 1000);
            }
            import('./toast.js').then(module => {
                if(module.showToast) module.showToast('Draft auto-saved', 'success');
            }).catch(() => {});
        }, 5000);
    }

    goToStep(containerId, 0);
}

export function goToStep(containerId, stepIndex) {
    const state = wizardDataMap.get(containerId);
    if (!state) return;

    state.currentStep = stepIndex;
    const { config, data } = state;
    
    // Update Stepper
    const stepper = document.getElementById(`wizard-stepper-${containerId}`);
    stepper.innerHTML = config.steps.map((step, idx) => `
        <div class="wizard-step ${idx === stepIndex ? 'active' : ''} ${idx < stepIndex ? 'completed' : ''}">
            <div class="wizard-step-circle">${idx < stepIndex ? '&#10003;' : idx + 1}</div>
            <div class="wizard-step-title">${step.title}</div>
            ${idx < config.steps.length - 1 ? '<div class="wizard-step-line"></div>' : ''}
        </div>
    `).join('');

    // Update Content
    const content = document.getElementById(`wizard-content-${containerId}`);
    content.innerHTML = `<div class="wizard-step-pane slide-in">${config.steps[stepIndex].renderContent(data)}</div>`;

    // Update Buttons
    const prevBtn = document.getElementById(`wizard-prev-${containerId}`);
    const nextBtn = document.getElementById(`wizard-next-${containerId}`);
    
    prevBtn.disabled = stepIndex === 0;
    
    if (stepIndex === config.steps.length - 1) {
        nextBtn.textContent = 'Submit';
        nextBtn.classList.add('btn-gold');
        nextBtn.style.backgroundColor = 'var(--color-secondary, #D4AF37)';
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.classList.remove('btn-gold');
        nextBtn.style.backgroundColor = '';
    }

    if (config.onStepChange) {
        config.onStepChange(stepIndex, data);
    }
}

function saveCurrentStepData(containerId) {
    const state = wizardDataMap.get(containerId);
    if (!state) return;
    const content = document.getElementById(`wizard-content-${containerId}`);
    const inputs = content.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name) {
            if (input.type === 'checkbox') {
                state.data[input.name] = input.checked;
            } else if (input.type === 'radio') {
                if (input.checked) state.data[input.name] = input.value;
            } else {
                state.data[input.name] = input.value;
            }
        }
    });
}

function validateStep(containerId) {
    const content = document.getElementById(`wizard-content-${containerId}`);
    const requiredInputs = content.querySelectorAll('[required]');
    for (let input of requiredInputs) {
        if (!input.value || (input.type === 'checkbox' && !input.checked)) {
            return false;
        }
    }
    return true;
}

export function getWizardData(containerId) {
    const state = wizardDataMap.get(containerId);
    if (state) saveCurrentStepData(containerId);
    return state ? state.data : {};
}
