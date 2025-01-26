console.log('Quick Messages: Content script loaded');

class QuickMessagesMenu {
    constructor() {
        this.menuElement = null;
        this.currentInput = null;
        this.messages = [];
        this.searchTerm = '';
        console.log('Quick Messages: Initializing menu');
        this.loadMessages();
        this.setupEventListeners();
    }

    createMenu() {
        console.log('Quick Messages: Creating menu element');
        const menu = document.createElement('div');
        menu.className = 'quick-messages-menu';
        menu.style.display = 'none';
        document.body.appendChild(menu);
        return menu;
    }

    loadMessages() {
        console.log('Quick Messages: Loading messages from storage');
        chrome.storage.local.get({ messages: [] }, (result) => {
            this.messages = result.messages;
            console.log('Quick Messages: Loaded messages:', this.messages);
        });
    }

    setupEventListeners() {
        console.log('Quick Messages: Setting up event listeners');
        
        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.messages) {
                console.log('Quick Messages: Messages updated in storage');
                this.messages = changes.messages.newValue;
            }
        });

        // Listen for keyup events instead of input
        document.addEventListener('keyup', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                console.log('Quick Messages: Key pressed in input/textarea');
                this.handleInput(e.target);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.menuElement && !this.menuElement.contains(e.target)) {
                console.log('Quick Messages: Clicking outside menu - hiding');
                this.hideMenu();
            }
        });
    }

    handleInput(inputElement) {
        this.currentInput = inputElement;
        const value = inputElement.value;
        const lastSemicolonIndex = value.lastIndexOf(';');
        
        console.log('Quick Messages: Handling input:', { value, lastSemicolonIndex });
        
        if (lastSemicolonIndex !== -1) {
            const searchAfterSemicolon = value.slice(lastSemicolonIndex + 1);
            console.log('Quick Messages: Search term:', searchAfterSemicolon);
            
            if (searchAfterSemicolon !== this.searchTerm) {
                this.searchTerm = searchAfterSemicolon;
                this.showMenu(this.searchTerm);
            }
        } else {
            this.hideMenu();
        }
    }

    showMenu(searchTerm) {
        console.log('Quick Messages: Showing menu with search term:', searchTerm);
        
        if (!this.menuElement) {
            this.menuElement = this.createMenu();
        }

        const filteredMessages = this.messages.filter(msg => 
            msg.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        console.log('Quick Messages: Filtered messages:', filteredMessages);

        const rect = this.currentInput.getBoundingClientRect();
        const inputStyle = window.getComputedStyle(this.currentInput);
        const lineHeight = parseInt(inputStyle.lineHeight) || 20; // Fallback to 20px if lineHeight is 'normal'
        const cursorPosition = this.getCursorPosition(this.currentInput);
        
        this.menuElement.style.display = 'block';
        this.menuElement.innerHTML = this.renderMenuItems(filteredMessages);
        
        // Position the menu below the cursor
        const { left, top } = this.calculateMenuPosition(rect, cursorPosition, lineHeight);
        this.menuElement.style.left = left + 'px';
        this.menuElement.style.top = top + 'px';

        console.log('Quick Messages: Menu positioned at:', { left, top });

        // Add click handlers
        this.menuElement.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                console.log('Quick Messages: Menu item clicked');
                this.insertMessage(item.dataset.message, item.dataset.index);
            });
        });
    }

    calculateMenuPosition(rect, cursorPosition, lineHeight) {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Calculate cursor position
        const cursorLeft = rect.left + scrollX;
        const cursorTop = rect.top + scrollY + (cursorPosition.line * lineHeight);

        return {
            left: cursorLeft,
            top: cursorTop + lineHeight
        };
    }

    getCursorPosition(input) {
        const value = input.value.slice(0, input.selectionStart);
        const lines = value.split('\n');
        return {
            line: lines.length - 1,
            column: lines[lines.length - 1].length
        };
    }

    renderMenuItems(messages) {
        if (messages.length === 0) {
            return '<div class="no-results">No messages found</div>';
        }

        return messages.map((msg, index) => `
            <div class="menu-item" data-message="${this.escapeHtml(msg.message)}" data-index="${index}">
                <div class="menu-item-icon">;</div>
                <div class="menu-item-content">
                    <div class="menu-item-title">${this.escapeHtml(msg.title)}</div>
                    <div class="menu-item-preview">${this.escapeHtml(msg.message)}</div>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    insertMessage(message, index) {
        console.log('Quick Messages: Inserting message');
        const input = this.currentInput;
        const value = input.value;
        const lastSemicolonIndex = value.lastIndexOf(';');
        
        // Replace the text from semicolon onwards with the selected message
        const newValue = value.slice(0, lastSemicolonIndex) + message;
        input.value = newValue;
        
        // Set cursor position to end of inserted text
        input.selectionStart = input.selectionEnd = newValue.length;
        
        // Copy to clipboard
        navigator.clipboard.writeText(message).catch(err => {
            console.error('Quick Messages: Failed to copy message to clipboard:', err);
        });

        this.hideMenu();
        input.focus();
    }

    hideMenu() {
        if (this.menuElement) {
            console.log('Quick Messages: Hiding menu');
            this.menuElement.style.display = 'none';
        }
    }
}

// Initialize the menu
const quickMessages = new QuickMessagesMenu();
console.log('Quick Messages: Extension initialized');
