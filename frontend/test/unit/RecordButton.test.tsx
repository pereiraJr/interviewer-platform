import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordButton } from '../../src/components/RecordButton';

describe('RecordButton', () => {
  it('starts recording from the idle state', async () => {
    const onStart = jest.fn();
    render(<RecordButton state="idle" onStart={onStart} onStopSave={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /record/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('stops and saves while recording', async () => {
    const onStopSave = jest.fn();
    render(<RecordButton state="recording" onStart={jest.fn()} onStopSave={onStopSave} />);

    await userEvent.click(screen.getByRole('button', { name: /stop & save/i }));

    expect(onStopSave).toHaveBeenCalledTimes(1);
  });

  it('disables the control while saving', () => {
    render(<RecordButton state="saving" onStart={jest.fn()} onStopSave={jest.fn()} />);

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows the error message in the error state', () => {
    render(
      <RecordButton
        state="error"
        onStart={jest.fn()}
        onStopSave={jest.fn()}
        error="Microphone access is required."
      />,
    );

    expect(screen.getByText('Microphone access is required.')).toBeInTheDocument();
  });
});
