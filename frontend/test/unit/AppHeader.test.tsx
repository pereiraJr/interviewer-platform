import { render, screen } from '@testing-library/react';
import { AppHeader } from '../../src/components/AppHeader';

describe('AppHeader', () => {
  it('renders the product name as the single level-1 heading', () => {
    render(<AppHeader />);

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent('AfterQuery Interviewer Platform');
  });
});
