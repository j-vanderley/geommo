// Chat Manager - Handles chat UI and messages
class ChatManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.currentType = 'global';
    this.currentView = 'global'; // Which messages container is visible
    this.onSendCallback = null;

    this.initUI();
  }

  initUI() {
    // Chat tabs
    document.querySelectorAll('.chat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.type);
      });
    });

    // Chat input
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Focus input when pressing Enter anywhere
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && document.activeElement !== input) {
        input.focus();
      }
    });
  }

  switchTab(type) {
    document.querySelectorAll('.chat-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });

    const chatMessages = document.getElementById('chat-messages');
    const logMessages = document.getElementById('chat-messages-log');
    const inputContainer = document.getElementById('chat-input-container');

    if (type === 'log') {
      // Show log, hide chat messages and input
      chatMessages.classList.add('hidden');
      logMessages.classList.remove('hidden');
      inputContainer.classList.add('hidden');
      this.currentView = 'log';
    } else {
      // Show chat messages and input, hide log
      chatMessages.classList.remove('hidden');
      logMessages.classList.add('hidden');
      inputContainer.classList.remove('hidden');
      this.currentType = type;
      this.currentView = type;
    }
  }

  onSend(callback) {
    this.onSendCallback = callback;
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    if (this.onSendCallback) {
      this.onSendCallback(message, this.currentType);
    }

    input.value = '';
  }

  // Add a message to the chat
  addMessage(data) {
    const messagesContainer = document.getElementById('chat-messages');

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${data.type}`;

    const typePrefix = data.type === 'global' ? '[G]' : '[L]';

    messageEl.innerHTML = `
      <span class="sender">${typePrefix} ${data.from}:</span>
      <span class="text">${data.message}</span>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show chat bubble above the player
    if (this.playerManager) {
      this.playerManager.showChatBubble(data.fromId, data.message);
    }
  }

  // Add a system message
  addSystemMessage(text) {
    const messagesContainer = document.getElementById('chat-messages');

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message system';
    messageEl.textContent = `*** ${text} ***`;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Add a log message (for game events like level ups, item drops, pickups)
  addLogMessage(text, type = 'info') {
    const logContainer = document.getElementById('chat-messages-log');
    if (!logContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `log-message ${type}`;

    // Add timestamp
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    messageEl.innerHTML = `<span class="log-time">[${time}]</span> ${text}`;

    logContainer.appendChild(messageEl);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Keep only last 100 log messages
    while (logContainer.children.length > 100) {
      logContainer.removeChild(logContainer.firstChild);
    }
  }
}

// Export for use in other modules
window.ChatManager = ChatManager;
