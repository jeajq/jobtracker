// src/JobCard.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCard from './components/JobCard';

describe('JobCard', () => {
  test('renders title and company and is draggable', () => {
    const job = { title: 'Frontend Developer', company: 'Acme Corp', location: 'Sydney', statusDot: 'green' };
    render(<JobCard job={job} onDragStart={() => {}} />);

    // text checks
    expect(screen.getByText(/Frontend Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();

    // find the card wrapper and assert draggable
    const card = screen.getByText(/Frontend Developer/i).closest('.jt-card');
    expect(card).toHaveAttribute('draggable', 'true');
  });
});
