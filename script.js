// script.js - Updated Version with Full Touch Support
// Global variables
let currentTerminal = null;
let startTime = new Date();
let isSoundOn = true;
let isShuttingDown = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isDragging = false;

// Open terminal function
function openTerminal(id) {
    if (isShuttingDown) return;
    
    if (currentTerminal) {
        document.getElementById(currentTerminal).classList.remove('active');
    }
    
    const terminal = document.getElementById(id);
    terminal.classList.add('active');
    currentTerminal = id;
    
    // Add dragging capability
    const header = document.getElementById(id + '-header');
    if (header) {
        makeDraggable(id, header);
    }
    
    // Focus on command line if it's the main terminal
    if (id === 'terminal') {
        setTimeout(() => {
            const cmdLine = document.getElementById('command-line');
            if (cmdLine) cmdLine.focus();
        }, 100);
    }
    
    showNotification(`Terminal opened: ${id.replace('-', ' ')}`);
}

// Make terminal draggable with touch support
function makeDraggable(terminalId, header) {
    const terminal = document.getElementById(terminalId);
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isTouchDevice = 'ontouchstart' in window;
    
    // Mouse events
    header.addEventListener('mousedown', dragMouseDown);
    
    // Touch events
    header.addEventListener('touchstart', handleTouchStart, { passive: false });
    header.addEventListener('touchmove', handleTouchMove, { passive: false });
    header.addEventListener('touchend', handleTouchEnd);
    
    // Prevent context menu on long press
    header.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    function dragMouseDown(e) {
        if (isDragging || isShuttingDown) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
        terminal.style.transition = 'none';
        terminal.style.zIndex = '1000';
        isDragging = true;
    }
    
    function handleTouchStart(e) {
        if (isDragging || isShuttingDown) return;
        if (e.touches.length === 1) {
            e.preventDefault();
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            touchStartX = pos3;
            touchStartY = pos4;
            touchStartTime = Date.now();
            terminal.style.transition = 'none';
            terminal.style.zIndex = '1000';
            isDragging = true;
            
            // Add visual feedback for touch
            terminal.classList.add('dragging');
        }
    }
    
    function handleTouchMove(e) {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        updateTerminalPosition();
    }
    
    function elementDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        updateTerminalPosition();
    }
    
    function updateTerminalPosition() {
        let newTop = (terminal.offsetTop - pos2);
        let newLeft = (terminal.offsetLeft - pos1);
        
        // Keep within bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const terminalWidth = terminal.offsetWidth;
        const terminalHeight = terminal.offsetHeight;
        
        newTop = Math.max(30, Math.min(newTop, viewportHeight - 100));
        newLeft = Math.max(10, Math.min(newLeft, viewportWidth - terminalWidth - 10));
        
        terminal.style.top = newTop + "px";
        terminal.style.left = newLeft + "px";
        terminal.style.transform = 'none';
    }
    
    function handleTouchEnd(e) {
        if (!isDragging) return;
        
        // Check if this was a tap (for closing/maximizing)
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchDistance = Math.sqrt(
            Math.pow(touchEndX - touchStartX, 2) + 
            Math.pow(touchEndY - touchStartY, 2)
        );
        
        // If it's a short, stationary touch, treat it as a click
        if (touchDuration < 300 && touchDistance < 10) {
            // This was likely a tap, not a drag
            const target = document.elementFromPoint(touchStartX, touchStartY);
            if (target && (target.classList.contains('close-btn') || 
                          target.classList.contains('minimize-btn') || 
                          target.classList.contains('maximize-btn'))) {
                // Let the button's click handler handle it
                setTimeout(() => {
                    target.click();
                }, 10);
            }
        }
        
        terminal.classList.remove('dragging');
        terminal.style.transition = 'all 0.3s';
        terminal.style.zIndex = '';
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        isDragging = false;
    }
    
    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        terminal.style.transition = 'all 0.3s';
        terminal.style.zIndex = '';
        isDragging = false;
    }
}

// Close terminal function
function closeTerminal(id) {
    const terminal = document.getElementById(id);
    if (terminal) {
        terminal.classList.remove('active');
        if (currentTerminal === id) {
            currentTerminal = null;
        }
    }
}

// Minimize terminal
function minimizeTerminal(id) {
    const terminal = document.getElementById(id);
    if (!terminal) return;
    
    terminal.style.transform = 'translate(-50%, 100vh)';
    terminal.style.opacity = '0';
    setTimeout(() => {
        closeTerminal(id);
        terminal.style.transform = '';
        terminal.style.opacity = '';
    }, 300);
    showNotification(`Terminal minimized: ${id.replace('-', ' ')}`);
}

// Maximize terminal
function maximizeTerminal(id) {
    const terminal = document.getElementById(id);
    if (!terminal) return;
    
    if (terminal.style.width === '95vw') {
        terminal.style.width = '';
        terminal.style.height = '';
        terminal.style.top = '50%';
        terminal.style.left = '50%';
        terminal.style.transform = 'translate(-50%, -50%)';
        showNotification(`Terminal restored: ${id.replace('-', ' ')}`);
    } else {
        terminal.style.width = '95vw';
        terminal.style.height = '90vh';
        terminal.style.top = '5vh';
        terminal.style.left = '2.5vw';
        terminal.style.transform = 'none';
        showNotification(`Terminal maximized: ${id.replace('-', ' ')}`);
    }
}

// Toggle start menu
function toggleStartMenu(event) {
    if (isShuttingDown) return;
    const menu = document.getElementById('startMenu');
    menu.classList.toggle('active');
    
    // Prevent event bubbling for touch devices
    if (event && event.type === 'touchstart') {
        event.stopPropagation();
    }
}

// Close start menu
function closeStartMenu() {
    const menu = document.getElementById('startMenu');
    if (menu) {
        menu.classList.remove('active');
    }
}

// Update time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const timeElement = document.getElementById('time');
    if (timeElement) {
        timeElement.innerHTML = `${timeString}<br><small>${dateString}</small>`;
    }
    
    // Update uptime
    const uptime = new Date() - startTime;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    const uptimeElement = document.getElementById('uptime');
    if (uptimeElement) {
        uptimeElement.textContent = `${days}d ${hours}h ${minutes}m`;
    }
}

// Show notification
function showNotification(message) {
    if (isShuttingDown) return;
    
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    if (isSoundOn) {
        // Play a subtle notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported, continue silently
        }
    }
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Toggle sound
function toggleSound(event) {
    if (isShuttingDown) return;
    
    isSoundOn = !isSoundOn;
    const icon = document.getElementById('volume-icon');
    if (!icon) return;
    
    if (isSoundOn) {
        icon.className = 'fas fa-volume-up';
        showNotification('Sound: ON');
    } else {
        icon.className = 'fas fa-volume-mute';
        showNotification('Sound: OFF');
    }
    
    // Prevent event bubbling for touch
    if (event && event.type === 'touchstart') {
        event.stopPropagation();
    }
}

// Toggle theme (light/dark)
function toggleTheme(event) {
    if (isShuttingDown) return;
    
    const body = document.body;
    const currentBg = body.style.backgroundColor || '';
    
    if (currentBg.includes('255, 255, 255')) {
        body.style.backgroundColor = '';
        body.style.color = '';
        body.style.backgroundImage = 'url("https://www.kali.org/images/kali-logo.svg")';
        showNotification('Theme: Dark Mode');
    } else {
        body.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        body.style.color = '#000';
        body.style.backgroundImage = 'url("https://www.kali.org/images/kali-logo-white.svg")';
        showNotification('Theme: Light Mode');
    }
    
    // Prevent event bubbling for touch
    if (event && event.type === 'touchstart') {
        event.stopPropagation();
    }
}

// Show help
function showHelp(event) {
    openTerminal('terminal');
    setTimeout(() => {
        executeCommand('help');
    }, 100);
    
    // Prevent event bubbling for touch
    if (event && event.type === 'touchstart') {
        event.stopPropagation();
    }
}

// Switch project tabs
function switchProjectTab(tab, event) {
    if (!event) return;
    
    // Update tab UI
    const tabs = document.querySelectorAll('#projects .terminal-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Show selected tab content
    document.querySelectorAll('#projects .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    const targetContent = document.getElementById(tab + '-projects');
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

// Switch hacking tabs
function switchHackingTab(tab, event) {
    if (!event) return;
    
    // Update tab UI
    const tabs = document.querySelectorAll('#hacking .terminal-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Show selected tab content
    document.querySelectorAll('#hacking .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    const targetContent = document.getElementById(tab + '-hacking');
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

// Execute shutdown
function executeShutdown(event) {
    if (isShuttingDown) return;
    
    if (event && event.type === 'touchstart') {
        event.stopPropagation();
    }
    
    isShuttingDown = true;
    const shutdownBtn = document.querySelector('.shutdown-btn');
    const shutdownScreen = document.getElementById('shutdownScreen');
    
    // Start shutdown animation
    if (shutdownBtn) shutdownBtn.classList.add('animating');
    if (shutdownScreen) shutdownScreen.classList.add('active');
    
    showNotification('Shutdown sequence initiated...');
    
    // Close all terminals
    document.querySelectorAll('.terminal.active').forEach(terminal => {
        terminal.classList.remove('active');
    });
    
    // Close start menu
    closeStartMenu();
    
    // Hide desktop icons
    const desktop = document.querySelector('.desktop');
    if (desktop) desktop.style.opacity = '0';
    
    // Start progress bar
    let progress = 0;
    const progressBar = document.querySelector('.shutdown-progress-bar');
    const messages = [
        'Saving session data...',
        'Closing terminals...',
        'Stopping services...',
        'Syncing file systems...',
        'Powering off...',
        'Goodbye! 👋'
    ];
    
    const messageElement = document.querySelector('.shutdown-message');
    const interval = setInterval(() => {
        progress += 1;
        if (progressBar) progressBar.style.width = progress + '%';
        
        // Update messages at different progress points
        if (messageElement) {
            if (progress === 15) messageElement.textContent = messages[0];
            if (progress === 30) messageElement.textContent = messages[1];
            if (progress === 45) messageElement.textContent = messages[2];
            if (progress === 60) messageElement.textContent = messages[3];
            if (progress === 80) messageElement.textContent = messages[4];
            if (progress === 95) messageElement.textContent = messages[5];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            // Final fade out
            setTimeout(() => {
                if (shutdownScreen) shutdownScreen.style.opacity = '0';
                setTimeout(() => {
                    // Show restart message
                    document.body.innerHTML = `
                        <div style="
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: #000;
                            color: #1cb82c;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            font-family: 'Ubuntu Mono', monospace;
                            text-align: center;
                            padding: 20px;
                            z-index: 9999;
                        ">
                            <div style="font-size: 3em; margin-bottom: 30px;">🖥️</div>
                            <h1 style="font-size: 2em; margin-bottom: 20px;">System Powered Off</h1>
                            <p style="margin-bottom: 20px; opacity: 0.8;">Press F5 or refresh to restart the portfolio</p>
                            <button onclick="location.reload()" style="
                                background: linear-gradient(90deg, #1cb82c, #8a2be2);
                                color: white;
                                border: none;
                                padding: 12px 30px;
                                border-radius: 6px;
                                font-size: 1.1em;
                                cursor: pointer;
                                margin-top: 20px;
                                touch-action: manipulation;
                            ">
                                <i class="fas fa-power-off"></i> Restart System
                            </button>
                        </div>
                    `;
                }, 1000);
            }, 500);
        }
    }, 30);
}

// Handle touch events on desktop icons
function setupDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            if (isShuttingDown) return;
            
            const targetId = this.getAttribute('onclick')?.match(/openTerminal\('(.+?)'\)/)?.[1];
            if (targetId) {
                openTerminal(targetId);
            }
        });
        
        // Add touch support
        icon.addEventListener('touchstart', function(e) {
            if (isShuttingDown) return;
            e.preventDefault();
            
            // Add visual feedback
            this.classList.add('touch-active');
            
            const targetId = this.getAttribute('onclick')?.match(/openTerminal\('(.+?)'\)/)?.[1];
            if (targetId) {
                setTimeout(() => {
                    openTerminal(targetId);
                    this.classList.remove('touch-active');
                }, 300);
            }
        }, { passive: false });
    });
}

// Interactive terminal commands
document.addEventListener('DOMContentLoaded', function() {
    const commandLine = document.getElementById('command-line');
    const terminalOutput = document.getElementById('terminal-output');
    
    if (commandLine) {
        commandLine.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.textContent.trim().toLowerCase();
                this.textContent = '';
                
                executeCommand(command);
            }
            
            // Tab completion
            if (e.key === 'Tab') {
                e.preventDefault();
                const commands = ['help', 'about', 'skills', 'projects', 'srat', 'contact', 'education', 'clear', 'date', 'whoami', 'gui', 'pwd', 'ls', 'echo', 'neofetch', 'banner', 'shutdown'];
                const currentText = this.textContent.trim().toLowerCase();
                
                const matching = commands.filter(cmd => cmd.startsWith(currentText));
                if (matching.length === 1) {
                    this.textContent = matching[0];
                    placeCaretAtEnd(this);
                } else if (matching.length > 1) {
                    executeCommand(currentText); // Show possibilities
                }
            }
        });
        
        // Add touch support for mobile keyboard
        commandLine.addEventListener('touchstart', function(e) {
            this.focus();
            // Show keyboard on mobile
            if ('virtualKeyboard' in navigator) {
                navigator.virtualKeyboard.show();
            }
        });
    }
    
    // Focus on command line when terminal is clicked
    const terminalElement = document.getElementById('terminal');
    if (terminalElement) {
        terminalElement.addEventListener('click', function() {
            if (commandLine) commandLine.focus();
        });
        
        terminalElement.addEventListener('touchstart', function(e) {
            if (commandLine) {
                commandLine.focus();
                // Show keyboard on mobile
                if ('virtualKeyboard' in navigator) {
                    navigator.virtualKeyboard.show();
                }
            }
        });
    }
    
    // Initialize time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Setup desktop icons
    setupDesktopIcons();
    
    // Open main terminal on load
    setTimeout(() => openTerminal('terminal'), 500);
    
    // Add touch event listeners to buttons
    setupTouchEvents();
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
});

// Setup touch events for all interactive elements
function setupTouchEvents() {
    // Terminal control buttons
    document.querySelectorAll('.close-btn, .minimize-btn, .maximize-btn').forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            this.classList.add('touch-active');
        });
        
        btn.addEventListener('touchend', function(e) {
            e.stopPropagation();
            this.classList.remove('touch-active');
            // Trigger click event
            this.click();
        });
    });
    
    // Start menu items
    document.querySelectorAll('.start-menu-item').forEach(item => {
        item.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
        });
        
        item.addEventListener('touchend', function(e) {
            this.classList.remove('touch-active');
            // Trigger click event
            this.click();
        });
    });
    
    // Tab buttons
    document.querySelectorAll('.terminal-tab').forEach(tab => {
        tab.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
        });
        
        tab.addEventListener('touchend', function(e) {
            this.classList.remove('touch-active');
            // Trigger click event
            this.click();
        });
    });
}

// Helper function to place cursor at end of contenteditable
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

// Execute command in terminal
function executeCommand(command) {
    const terminalOutput = document.getElementById('terminal-output');
    const commandLine = document.getElementById('command-line');
    
    if (!terminalOutput || !commandLine) return;
    
    // Add command to output
    const prompt = document.createElement('div');
    prompt.className = 'terminal-prompt';
    prompt.innerHTML = `<span>root@kali-portfolio:~# ${command}</span>`;
    terminalOutput.insertBefore(prompt, terminalOutput.lastElementChild);
    
    // Process command
    const output = document.createElement('div');
    output.className = 'terminal-output';
    
    switch(command) {
        case 'help':
            output.innerHTML = `<p><span class="highlight">Available Commands:</span></p>
                            <p><span class="cmd">help</span> - Show this help message</p>
                            <p><span class="cmd">about</span> - Open About Me terminal</p>
                            <p><span class="cmd">skills</span> - View skills and expertise</p>
                            <p><span class="cmd">projects</span> - View projects portfolio</p>
                            <p><span class="cmd">srat</span> - SRat team information</p>
                            <p><span class="cmd">contact</span> - Contact information</p>
                            <p><span class="cmd">education</span> - Education details</p>
                            <p><span class="cmd">clear</span> - Clear terminal screen</p>
                            <p><span class="cmd">date</span> - Show current date and time</p>
                            <p><span class="cmd">whoami</span> - Show user information</p>
                            <p><span class="cmd">gui</span> - Open graphical interface</p>
                            <p><span class="cmd">pwd</span> - Print working directory</p>
                            <p><span class="cmd">ls</span> - List directory contents</p>
                            <p><span class="cmd">echo</span> - Display a line of text</p>
                            <p><span class="cmd">neofetch</span> - Display system information</p>
                            <p><span class="cmd">banner</span> - Display ASCII banner</p>
                            <p><span class="cmd">shutdown</span> - Shutdown the system</p>`;
            break;
            
        case 'clear':
            terminalOutput.innerHTML = '';
            // Add back the current prompt
            const newPrompt = document.createElement('div');
            newPrompt.className = 'terminal-prompt';
            newPrompt.id = 'current-prompt';
            newPrompt.innerHTML = `<span>root@kali-portfolio:~#</span>
                                 <div id="command-line" contenteditable="true" spellcheck="false"></div>
                                 <span class="cursor"></span>`;
            terminalOutput.appendChild(newPrompt);
            
            // Re-attach event listener
            const newCmdLine = document.getElementById('command-line');
            if (newCmdLine) {
                newCmdLine.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const cmd = this.textContent.trim().toLowerCase();
                        this.textContent = '';
                        executeCommand(cmd);
                    }
                });
                
                // Add touch support for mobile
                newCmdLine.addEventListener('touchstart', function() {
                    this.focus();
                });
                
                newCmdLine.focus();
            }
            return;
            
        case 'about':
            openTerminal('about');
            output.textContent = 'Opening About Me terminal...';
            break;
            
        case 'skills':
            openTerminal('skills');
            output.textContent = 'Opening Skills terminal...';
            break;
            
        case 'projects':
            openTerminal('projects');
            output.textContent = 'Opening Projects terminal...';
            break;
            
        case 'srat':
            openTerminal('srat');
            output.textContent = 'Opening SRat Team terminal...';
            break;
            
        case 'contact':
            openTerminal('contact');
            output.textContent = 'Opening Contact terminal...';
            break;
            
        case 'education':
            openTerminal('education');
            output.textContent = 'Opening Education terminal...';
            break;
            
        case 'shutdown':
            output.textContent = 'Initiating shutdown sequence...';
            setTimeout(() => {
                executeShutdown();
            }, 1000);
            break;
            
        case 'gui':
            output.innerHTML = `<p>Graphical Interface: Already running!</p>
                            <p>Try clicking on desktop icons or using the Kali Menu.</p>
                            <p>Current desktop applications:</p>
                            <p><span class="green">•</span> Terminal Emulator</p>
                            <p><span class="green">•</span> File Browser (Projects)</p>
                            <p><span class="green">•</span> System Monitor</p>
                            <p><span class="green">•</span> Settings Panel</p>`;
            break;
            
        case 'date':
            const now = new Date();
            output.textContent = now.toString();
            break;
            
        case 'whoami':
            output.innerHTML = `<p>User: <span class="cyan">sayan</span></p>
                            <p>Groups: <span class="cyan">srat-cofounder, developers, students</span></p>
                            <p>Home: <span class="cyan">/home/sayan</span></p>
                            <p>Shell: <span class="cyan">/bin/web-terminal</span></p>
                            <p>Description: Co-founder SRat | JEE Aspirant | Frontend Developer</p>`;
            break;
            
        case 'pwd':
            output.textContent = '/home/sayan/kali-portfolio';
            break;
            
        case 'ls':
            output.innerHTML = `<p><span class="cyan">Desktop/</span>        <span class="green">Projects/</span>        <span class="purple">Documents/</span></p>
                            <p><span class="blue">Downloads/</span>      <span class="yellow">Music/</span>           <span class="red">Videos/</span></p>
                            <p><span class="green">about.txt</span>      <span class="cyan">skills.md</span>       <span class="purple">resume.pdf</span></p>
                            <p><span class="blue">portfolio.html</span>  <span class="yellow">srat-docs/</span>     <span class="red">jee-notes/</span></p>`;
            break;
            
        case 'echo':
            output.textContent = 'Usage: echo [text] - Try typing something after echo';
            break;
            
        case 'neofetch':
            const uptime = new Date() - startTime;
            const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            output.innerHTML = `<pre style="color: var(--kali-green); font-family: monospace;">
         _-'''''-,           sayan@kali-portfolio 
      .'   .- - |          -------------------- 
     / .  /    |           OS: Kali Linux Portfolio v3.0 
    / /      -.|           Host: Web Browser 
   / /            |           Kernel: 5.15.0-kali3-amd64 
  / /             |           Uptime: ${days} days, ${hours} hours 
 / /              |           Shell: WebTerminal 1.0 
/ /               |           CPU: Virtual CPU @ 2.0GHz 
| |               |           Memory: 1024MB / 2048MB 
            </pre>`;
            break;
            
        case 'banner':
            output.innerHTML = `<pre style="color: var(--kali-green); font-family: monospace;">
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      ███████╗██████╗  █████╗ ███╗   ██╗                 ║
║      ██╔════╝██╔══██╗██╔══██╗████╗  ██║                 ║
║      ███████╗██████╔╝███████║██╔██╗ ██║                 ║
║      ╚════██║██╔══██╗██╔══██║██║╚██╗██║                 ║
║      ███████║██║  ██║██║  ██║██║ ╚████║                 ║
║      ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝                 ║
║                                                          ║
║         C O - F O U N D E R   S R A T   T E A M          ║
║               JEE ASPIRANT | DEVELOPER                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
            </pre>`;
            break;
            
        case '':
            // Empty command, do nothing
            return;
            
        default:
            output.innerHTML = `<p>Command not found: <span class="red">${command}</span></p>
                            <p>Type <span class="cmd">help</span> for available commands.</p>`;
            break;
    }
    
    // Add output to terminal
    terminalOutput.insertBefore(output, terminalOutput.lastElementChild);
    
    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    
    // Focus back on command line
    setTimeout(() => {
        if (commandLine) commandLine.focus();
    }, 10);
}

// Handle click outside to close start menu
document.addEventListener('click', function(e) {
    const startMenu = document.getElementById('startMenu');
    const startButton = document.querySelector('.start-menu');
    
    if (startMenu && startButton && !startMenu.contains(e.target) && !startButton.contains(e.target)) {
        closeStartMenu();
    }
});

// Handle touch events for mobile
document.addEventListener('touchstart', function(e) {
    const startMenu = document.getElementById('startMenu');
    const startButton = document.querySelector('.start-menu');
    
    // Close start menu if touching outside
    if (startMenu && startButton && !startMenu.contains(e.target) && !startButton.contains(e.target)) {
        closeStartMenu();
    }
}, { passive: true });

// Handle touch events on the document
document.addEventListener('touchmove', function(e) {
    if (isDragging) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize on window load
window.onload = function() {
    openTerminal('terminal');
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Kali Linux Portfolio v3.0 loaded successfully!');
    }, 1000);
    
    // Set viewport for mobile devices
    if ('ontouchstart' in window) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
};

// Add CSS for touch feedback
const touchStyles = document.createElement('style');
touchStyles.textContent = `
    .touch-active {
        opacity: 0.7 !important;
        transform: scale(0.95) !important;
    }
    
    .dragging {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    }
    
    /* Better touch targets for mobile */
    .close-btn, .minimize-btn, .maximize-btn {
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .desktop-icon {
        min-width: 60px;
        min-height: 60px;
        padding: 10px;
        touch-action: manipulation;
    }
    
    /* Prevent text selection on touch devices */
    .terminal-header, .desktop-icon, .start-menu-item {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
    }
    
    /* Better scrolling on mobile */
    .terminal-content {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
    }
    
    /* Improve button visibility on mobile */
    button, .btn, .start-menu-item {
        cursor: pointer;
    }
    
    @media (max-width: 768px) {
        .terminal {
            width: 95vw !important;
            max-width: 95vw !important;
            height: 80vh !important;
        }
        
        .desktop-icons {
            justify-content: center;
        }
        
        .taskbar-item span {
            display: none;
        }
        
        .taskbar-item i {
            font-size: 1.5em;
        }
    }
`;
document.head.appendChild(touchStyles);