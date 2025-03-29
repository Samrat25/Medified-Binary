document.addEventListener('DOMContentLoaded', function() {
    const permissionPopup = document.getElementById('permissionPopup');
    const deniedPopup = document.getElementById('deniedPopup');
    const videoElement = document.getElementById('videoElement');
    const grantBtn = document.getElementById('grantPermission');
    const denyBtn = document.getElementById('denyPermission');
    const tryAgainBtn = document.getElementById('tryAgain');
    
    // Check if we've already asked for permission
    const permissionAsked = localStorage.getItem('cameraPermissionAsked');
    
    // Show permission popup if not already asked
    if (!permissionAsked) {
        showPermissionPopup();
    } else {
        // If we've asked before, try to access camera directly
        initCamera();
    }
    
    grantBtn.addEventListener('click', function() {
        localStorage.setItem('cameraPermissionAsked', 'true');
        hidePermissionPopup();
        initCamera();
    });
    
    denyBtn.addEventListener('click', function() {
        localStorage.setItem('cameraPermissionAsked', 'true');
        hidePermissionPopup();
        showDeniedPopup();
    });
    
    tryAgainBtn.addEventListener('click', function() {
        hideDeniedPopup();
        initCamera();
    });
    
    function showPermissionPopup() {
        permissionPopup.style.display = 'block';
    }
    
    function hidePermissionPopup() {
        permissionPopup.style.display = 'none';
    }
    
    function showDeniedPopup() {
        deniedPopup.style.display = 'block';
    }
    
    function hideDeniedPopup() {
        deniedPopup.style.display = 'none';
    }
    
    async function initCamera() {
        try {
            // Check if browser supports mediaDevices
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support camera access');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
            });
            
            // Success - show video feed
            videoElement.srcObject = stream;
            videoElement.style.display = 'block';
        } catch (error) {
            console.error('Error accessing camera:', error);
            showDeniedPopup();
        }
    }
});