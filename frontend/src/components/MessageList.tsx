import { audioUrl } from '../services/interviewsApi';
import type { Message } from '../types/interview';
import './MessageList.css';

export interface MessageListProps {
  messages: Message[];
  sessionId: string;
}

export function MessageList({ messages, sessionId }: MessageListProps) {
  if (messages.length === 0) {
    return <p className="message-list__empty">The conversation will appear here.</p>;
  }

  return (
    <ol className="message-list" aria-label="Interview messages">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`message-list__item message-list__item--${message.author}`}
        >
          <span className="message-list__author">
            {message.author === 'agent' ? 'AIfter Agent' : 'You'}
          </span>
          {message.kind === 'text' ? (
            <p className="message-list__text">{message.text}</p>
          ) : (
            <audio
              className="message-list__audio"
              controls
              src={audioUrl(sessionId, message.id)}
              aria-label="Your recorded reply"
            />
          )}
        </li>
      ))}
    </ol>
  );
}
