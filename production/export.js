// Draggable functionality for export controls
function makeDraggable() {
    const exportControls = document.querySelector('.export-controls');
    if (!exportControls) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Add draggable styles
    exportControls.style.cursor = 'move';
    exportControls.style.userSelect = 'none';

    // Add dragging class styles
    const style = document.createElement('style');
    style.textContent = `
        .export-controls.dragging {
            opacity: 0.8;
            transform: rotate(2deg);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            cursor: grabbing !important;
        }
        .export-controls h3 {
            cursor: move;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .export-controls h3::before {
            content: "⋮⋮";
            color: #ccc;
            font-size: 16px;
            line-height: 1;
        }
    `;
    document.head.appendChild(style);

    exportControls.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        // Don't drag when clicking on interactive elements
        if (e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' ||
            e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('textarea')) {
            return;
        }
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === exportControls || exportControls.contains(e.target)) {
            isDragging = true;
            exportControls.classList.add('dragging');
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            // Keep within viewport bounds
            const rect = exportControls.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            exportControls.style.transform = `translate(${currentX}px, ${currentY}px)`;
            exportControls.style.right = 'auto';
            exportControls.style.top = 'auto';
            exportControls.style.left = '0';
        }
    }

    function dragEnd(e) {
        if (isDragging) {
            isDragging = false;
            exportControls.classList.remove('dragging');
        }
    }

    // Touch support for mobile
    exportControls.addEventListener('touchstart', touchStart, { passive: false });
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);

    function touchStart(e) {
        if (e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const touch = e.touches[0];
        initialX = touch.clientX - xOffset;
        initialY = touch.clientY - yOffset;

        if (e.target === exportControls || exportControls.contains(e.target)) {
            isDragging = true;
            exportControls.classList.add('dragging');
        }
    }

    function touchMove(e) {
        if (isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            const rect = exportControls.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            exportControls.style.transform = `translate(${currentX}px, ${currentY}px)`;
            exportControls.style.right = 'auto';
            exportControls.style.top = 'auto';
            exportControls.style.left = '0';
        }
    }

    function touchEnd(e) {
        if (isDragging) {
            isDragging = false;
            exportControls.classList.remove('dragging');
        }
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeDraggable);
} else {
    makeDraggable();
}
