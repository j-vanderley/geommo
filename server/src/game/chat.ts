import { ChatMessage, Position } from '../types';
import { PlayerManager } from './player';

export class ChatManager {
  private playerManager: PlayerManager;
  private localChatRadius = 100; // meters

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  createMessage(
    fromId: string,
    fromUsername: string,
    message: string,
    type: 'global' | 'local',
    position?: Position
  ): ChatMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromUsername,
      fromId,
      message: this.sanitizeMessage(message),
      type,
      position,
      timestamp: new Date()
    };
  }

  // Get socket IDs that should receive the message
  getRecipients(message: ChatMessage): string[] {
    if (message.type === 'global') {
      // Global chat: all players
      return this.playerManager.getAllPlayers().map(p => p.id);
    } else {
      // Local chat: only players within radius
      if (!message.position) {
        return [];
      }
      return this.playerManager
        .getPlayersNearby(message.position, this.localChatRadius)
        .map(p => p.id);
    }
  }

  private sanitizeMessage(message: string): string {
    // Basic sanitization - prevent XSS and limit length
    return message
      .slice(0, 200) // Max 200 characters
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
