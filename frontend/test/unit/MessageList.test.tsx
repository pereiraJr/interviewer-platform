import { render, screen } from '@testing-library/react';
import { MessageList } from '../../src/components/MessageList';
import type { Message } from '../../src/types/interview';

const agentMessage: Message = {
  id: 'm1',
  author: 'agent',
  kind: 'text',
  text: 'Could you give a brief intro about yourself?',
  sequence: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const candidateMessage: Message = {
  id: 'm4',
  author: 'candidate',
  kind: 'audio',
  audio: { contentType: 'audio/webm', durationMs: 1500, byteLength: 5 },
  sequence: 4,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('MessageList', () => {
  it('renders text turns with the author label', () => {
    render(<MessageList messages={[agentMessage]} sessionId="session-1" />);

    expect(
      screen.getByText('Could you give a brief intro about yourself?'),
    ).toBeInTheDocument();
    expect(screen.getByText('AIfter Agent')).toBeInTheDocument();
  });

  it('renders a play control for a candidate audio reply', () => {
    const { container } = render(
      <MessageList messages={[candidateMessage]} sessionId="session-1" />,
    );

    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute('src')).toContain('/api/interviews/session-1/messages/m4/audio');
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows an empty hint with no messages', () => {
    render(<MessageList messages={[]} sessionId="session-1" />);
    expect(screen.getByText(/conversation will appear/i)).toBeInTheDocument();
  });
});
