import React from 'react';
import { render, screen } from '@testing-library/react-native';

import MathText from '../../components/math/MathText';

describe('MathText', () => {
  it('renders text without math as a plain Text', () => {
    render(<MathText testID="plain">Axioms of inequality</MathText>);

    expect(screen.getByText('Axioms of inequality')).toBeTruthy();
    expect(screen.queryByTestId('math-inline')).toBeNull();
  });

  it('draws an inline formula instead of showing its TeX', () => {
    render(<MathText>{'If $\\frac{1}{2} < x$ then'}</MathText>);

    expect(screen.getByTestId('math-inline').props.accessibilityLabel).toBe('\\frac{1}{2} < x');
    expect(screen.queryByText(/\\frac/)).toBeNull();
    expect(screen.getByText(/If/)).toBeTruthy();
  });

  it('puts display math on its own row', () => {
    render(
      <MathText>
        {'The roots are $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$ in general.'}
      </MathText>,
    );

    expect(screen.getByTestId('math-display')).toBeTruthy();
    // Compared untrimmed: a space left next to the display row would indent
    // the text beside it.
    const exact = { normalizer: (text: string) => text };
    expect(screen.getByText('The roots are', exact)).toBeTruthy();
    expect(screen.getByText('in general.', exact)).toBeTruthy();
  });

  it('lets a production explanation sentence wrap as text, with its number drawn as math', () => {
    render(
      <MathText>
        {
          'The answer is True because:\n\\( \\text{ gas prices like } 6.75 \\text{ LE, which are decimal numbers.} \\)'
        }
      </MathText>,
    );

    expect(screen.getByTestId('math-inline').props.accessibilityLabel).toBe('6.75');
    expect(screen.getByText(/gas prices like/)).toBeTruthy();
    expect(screen.queryByText(/\\text/)).toBeNull();
  });

  it('draws a formula whole when splitting out its \\text would break it', () => {
    render(<MathText>{'Here $\\left( \\text{cost} \\right)$ holds'}</MathText>);

    expect(screen.getByTestId('math-inline').props.accessibilityLabel).toBe(
      '\\left( \\text{cost} \\right)',
    );
    expect(screen.queryByText(/\\left/)).toBeNull();
  });

  it('draws display math inline when the text is truncated', () => {
    render(<MathText numberOfLines={1}>{'Solve $$x^2 = 4$$'}</MathText>);

    expect(screen.queryByTestId('math-display')).toBeNull();
    expect(screen.getByTestId('math-inline')).toBeTruthy();
  });

  it('shows the TeX source of a formula that does not parse', () => {
    render(<MathText>{'Broken $\\frac{1}{$ formula'}</MathText>);

    expect(screen.getByText(/\\frac\{1\}\{/)).toBeTruthy();
    expect(screen.queryByTestId('math-inline')).toBeNull();
  });

  it('shows a failed formula the same way with or without another formula beside it', () => {
    render(
      <>
        <MathText testID="alone">{'Try $\\notamacro{x}$ here'}</MathText>
        <MathText testID="beside">{'Try $\\notamacro{y}$ and $z$'}</MathText>
      </>,
    );

    // Its TeX without the delimiters, like the admin preview's error text.
    expect(screen.getByText('Try \\notamacro{x} here')).toBeTruthy();
    expect(screen.getByText(/Try \\notamacro\{y\} and/)).toBeTruthy();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('renders a missing explanation (null) as an empty Text instead of crashing', () => {
    render(<MathText testID="empty">{null}</MathText>);

    expect(screen.getByTestId('empty')).toBeTruthy();
  });
});
