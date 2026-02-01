import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders LetzPocket app', () => {
  render(<App />);
  // LetzPocket is split into two spans, so we need to check for both parts
  const letzElement = screen.getByText('Letz');
  const pocketElement = screen.getByText('Pocket');
  expect(letzElement).toBeInTheDocument();
  expect(pocketElement).toBeInTheDocument();
});
