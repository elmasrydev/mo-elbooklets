import React, { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import CurriculumPicker from '../../components/curriculum/CurriculumPicker';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { CurriculumSelection, EMPTY_SELECTION, GradeCurriculum } from '../../utils/curriculum';

const subject = (id: string, name: string) => ({ id, name, educational_system_ids: ['1', '2'] });
const language = {
  group: 'first_foreign_language',
  label: 'First Foreign Language',
  subjects: [subject('47', 'English'), subject('48', 'French')],
};
const bacc: GradeCurriculum = {
  id: '9',
  name: 'Baccalaureate 2',
  has_specialities: true,
  core_electives: [language],
  specialities: [
    {
      id: '3',
      name: 'Business',
      description: null,
      electives: [
        {
          group: 'speciality_choice',
          label: 'Speciality Subject',
          subjects: [subject('53', 'Accounting'), subject('54', 'Business Administration')],
        },
      ],
    },
    {
      id: '4',
      name: 'Arts',
      description: null,
      electives: [
        {
          group: 'speciality_choice',
          label: 'Speciality Subject',
          subjects: [subject('55', 'Psychology'), subject('56', 'Second Languages')],
        },
      ],
    },
  ],
};
const languageOnly: GradeCurriculum = {
  ...bacc,
  id: '7',
  has_specialities: false,
  specialities: [],
};

// The picker is controlled; this holds the selection the way a screen would.
const Harness = ({
  grade,
  showErrors = false,
}: {
  grade: GradeCurriculum;
  showErrors?: boolean;
}) => {
  const [value, setValue] = useState<CurriculumSelection>(EMPTY_SELECTION);
  return (
    <CurriculumPicker
      grade={grade}
      systemId="2"
      value={value}
      onChange={setValue}
      showErrors={showErrors}
    />
  );
};

const selected = (testID: string): boolean =>
  screen.getByTestId(testID).props.accessibilityState.selected;

describe('CurriculumPicker', () => {
  it('shows no track section for a grade without tracks, only its groups', () => {
    renderWithProviders(<Harness grade={languageOnly} />);
    expect(screen.queryByText('curriculum.track_title')).toBeNull();
    expect(screen.getByText('First Foreign Language')).toBeDefined();
    expect(screen.getByTestId('curriculum-first_foreign_language-47')).toBeDefined();
  });

  it('reveals the chosen track’s group, and a track change keeps the language pick', () => {
    renderWithProviders(<Harness grade={bacc} />);
    expect(screen.queryByText('Speciality Subject')).toBeNull();

    fireEvent.press(screen.getByTestId('curriculum-first_foreign_language-47'));
    fireEvent.press(screen.getByTestId('curriculum-track-3'));
    expect(screen.getByTestId('curriculum-speciality_choice-53')).toBeDefined();
    fireEvent.press(screen.getByTestId('curriculum-speciality_choice-53'));
    expect(selected('curriculum-speciality_choice-53')).toBe(true);

    fireEvent.press(screen.getByTestId('curriculum-track-4'));
    expect(selected('curriculum-speciality_choice-55')).toBe(false);
    expect(selected('curriculum-first_foreign_language-47')).toBe(true);
  });

  it('names what is still missing only when asked to', () => {
    const { rerender } = renderWithProviders(<Harness grade={bacc} />);
    expect(screen.queryByTestId('curriculum-track-error')).toBeNull();

    rerender(<Harness grade={bacc} showErrors />);
    expect(screen.getByText('curriculum.choose_track')).toBeDefined();
    expect(screen.getByTestId('curriculum-first_foreign_language-error')).toBeDefined();

    fireEvent.press(screen.getByTestId('curriculum-track-3'));
    expect(screen.queryByTestId('curriculum-track-error')).toBeNull();
    expect(screen.getByTestId('curriculum-speciality_choice-error')).toBeDefined();
  });
});
