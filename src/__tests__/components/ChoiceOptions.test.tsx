import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ChoiceOptions from '../../components/quiz/ChoiceOptions';

const OPTIONS = ['$x = 2$ or $x = 3$', '$x = \\frac{5}{2}$', 'No real roots'];

const renderOptions = (onSelect = jest.fn(), selectedAnswer: string | null = null) => {
  renderWithProviders(
    <ChoiceOptions
      questionType="mcq"
      options={OPTIONS}
      selectedAnswer={selectedAnswer}
      onSelect={onSelect}
      contentAlign="left"
      contentRowDirection="row"
      testIDPrefix="quiz"
    />,
  );
  return onSelect;
};

describe('ChoiceOptions with math answers (BKLT-399)', () => {
  it('draws the formulas instead of showing their LaTeX', () => {
    renderOptions();

    expect(screen.getAllByTestId('math-inline')).toHaveLength(3);
    expect(screen.queryByText(/\\frac/)).toBeNull();
    expect(screen.getByText('No real roots')).toBeTruthy();
  });

  it('keeps a formula that spans a line break whole instead of cutting it at the subtitle', () => {
    renderWithProviders(
      <ChoiceOptions
        questionType="mcq"
        options={['$$\\begin{cases} x = 1 \\\\\n y = 2 \\end{cases}$$']}
        selectedAnswer={null}
        onSelect={jest.fn()}
        contentAlign="left"
        contentRowDirection="row"
        testIDPrefix="quiz"
      />,
    );

    expect(screen.getByTestId('math-display')).toBeTruthy();
    expect(screen.queryByText(/\$\$/)).toBeNull();
  });

  it('selects the raw answer string, which is what the server matches on submit', () => {
    const onSelect = renderOptions();

    fireEvent.press(screen.getByTestId('quiz-option-1'));

    expect(onSelect).toHaveBeenCalledWith('$x = \\frac{5}{2}$');
  });

  it('marks the option whose raw string is the selected answer', () => {
    renderOptions(jest.fn(), '$x = \\frac{5}{2}$');

    expect(screen.getByTestId('quiz-option-1').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('quiz-option-0').props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
