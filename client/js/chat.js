// Chat Manager - Handles chat UI and messages
class ChatManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.currentType = 'global';
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
    this.currentType = type;

    document.querySelectorAll('.chat-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });
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
}

// Export for use in other modules
window.ChatManager = ChatManager;
