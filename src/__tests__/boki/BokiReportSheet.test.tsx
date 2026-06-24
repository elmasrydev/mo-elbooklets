import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import BokiReportSheet from '../../components/boki/BokiReportSheet';
import { reportAnswer } from '../../services/bokiApi';
import { analytics } from '../../lib/analytics';

jest.mock('../../services/bokiApi', () => {
  const actual = jest.requireActual('../../services/bokiApi');
  return { __esModule: true, ...actual, reportAnswer: jest.fn() };
});

const mockedReport = reportAnswer as jest.Mock;

describe('BokiReportSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits a report with the selected reason and closes', async () => {
    mockedReport.mockResolvedValueOnce({ success: true, message: 'Reported' });
    const onClose = jest.fn();
    const submittedSpy = jest.spyOn(analytics, 'trackBokiReportSubmitted');

    renderWithProviders(<BokiReportSheet visible chatLogId="123" onClose={onClose} />);

    fireEvent.press(screen.getByTestId('boki-report-reason-incorrect'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-report-submit'));
    });

    await waitFor(() => expect(mockedReport).toHaveBeenCalledWith('123', 'incorrect', ''));
    expect(submittedSpy).toHaveBeenCalledWith({ reason: 'incorrect' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not submit until a reason is selected', () => {
    const onClose = jest.fn();
    renderWithProviders(<BokiReportSheet visible chatLogId="123" onClose={onClose} />);

    fireEvent.press(screen.getByTestId('boki-report-submit'));

    expect(mockedReport).not.toHaveBeenCalled();
  });
});
