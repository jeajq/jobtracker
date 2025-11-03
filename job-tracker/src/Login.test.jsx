import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './pages/Login';                 // <-- ./pages/...
jest.mock('./lib/firebase.js', () => ({ db: {} })); // <-- ./lib/...

describe('Login page', () => {
  test('renders email and password inputs', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('phone input accepts digits only when phone mode exists', () => {
    render(<Login />);
    const phoneToggle = screen.queryByRole('button', { name: /phone/i });
    if (!phoneToggle) return; // skip if no phone mode in this build
    fireEvent.click(phoneToggle);
    const phoneInput = screen.getByPlaceholderText(/Phone/i);
    fireEvent.change(phoneInput, { target: { value: '04a1-23b4' } });
    expect(phoneInput).toHaveValue('041234');
  });
});
