import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecorder } from '../../src/hooks/useRecorder';

class FakeMediaRecorder {
  static isTypeSupported = (): boolean => true;
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public readonly stream: MediaStream) {}
  start(): void {
    this.state = 'recording';
  }
  stop(): void {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['hello'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}

describe('useRecorder', () => {
  const stopTrack = jest.fn();
  const getUserMedia = jest.fn();

  beforeEach(() => {
    (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeMediaRecorder;
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('records audio and saves the blob', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRecorder(onSave));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('recording');

    act(() => {
      result.current.stopAndSave();
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedBlob = onSave.mock.calls[0][0] as Blob;
    expect(savedBlob).toBeInstanceOf(Blob);
    expect(result.current.state).toBe('idle');
    expect(stopTrack).toHaveBeenCalled();
  });

  it('reports an error when microphone access is denied', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useRecorder(jest.fn()));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toMatch(/microphone/i);
  });
});
