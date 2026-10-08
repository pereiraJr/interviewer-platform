import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentBanner } from '../../src/components/ConsentBanner';

const notice = 'Your audio will be recorded and used for internal purposes only.';

describe('ConsentBanner', () => {
  it('shows the recording notice and both actions', () => {
    render(<ConsentBanner notice={notice} onAccept={jest.fn()} onDecline={jest.fn()} />);

    expect(screen.getByText(notice)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
  });

  it('invokes onAccept when accepted with the keyboard', async () => {
    const onAccept = jest.fn();
    render(<ConsentBanner notice={notice} onAccept={onAccept} onDecline={jest.fn()} />);

    screen.getByRole('button', { name: 'Accept' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('invokes onDecline when declined', async () => {
    const onDecline = jest.fn();
    render(<ConsentBanner notice={notice} onAccept={jest.fn()} onDecline={onDecline} />);

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
