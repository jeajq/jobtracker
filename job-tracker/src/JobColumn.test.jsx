import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobColumn from './components/JobColumn';  // <-- ./ not ../

describe('JobColumn', () => {
  test('shows column title and renders cards', () => {
    const cards = [{ title: 'Job A', company: 'X' }, { title: 'Job B', company: 'Y' }];
    render(
      <JobColumn
        id="todo"
        title="To Apply"
        cards={cards}
        onDragStart={() => {}}
        onDropBefore={() => {}}
        onDropEnd={() => {}}
      />
    );
    expect(screen.getByText(/To Apply/i)).toBeInTheDocument();
    expect(screen.getByText(/Job A/i)).toBeInTheDocument();
    expect(screen.getByText(/Job B/i)).toBeInTheDocument();
  });
});
