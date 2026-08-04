import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { digitsOnly } from '../utils/digits';

export const OTP_LENGTH = 6;

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  /** Paints every box in the error colour. */
  hasError?: boolean;
  /** Kebab-case `{screen}-{element}` id for the (invisible) real input. */
  testID: string;
  inputRef?: React.RefObject<TextInput | null>;
  length?: number;
}

/**
 * The shared 6-digit code field: one transparent `TextInput` stretched over a
 * row of boxes that merely render what it holds. Maestro cannot tap the input
 * itself (opacity 0) — flows tap the wrapping row and type into the focused
 * field, which is why the `testID` lands on the input rather than the boxes.
 */
const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  hasError = false,
  testID,
  inputRef,
  length = OTP_LENGTH,
}) => {
  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();

  return (
    <View style={styles.container}>
      <TextInput
        testID={testID}
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        // Normalize before stripping: `[^0-9]` alone would silently delete a
        // code typed with Arabic-Indic numerals (mobile-otp-guide.md section 1).
        onChangeText={(text) => onChange(digitsOnly(text).slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={false}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
      />
      <View style={styles.boxes} pointerEvents="none">
        {[...Array(length)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor: hasError
                  ? theme.colors.error
                  : value.length === index
                    ? theme.colors.primary
                    : value.length > index
                      ? theme.colors.border
                      : theme.colors.border + '50',
                backgroundColor: theme.colors.card,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Text style={[typography('h2'), fontWeight('bold'), { color: theme.colors.text }]}>
              {value[index] || ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  boxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  box: {
    width: 45,
    height: 55,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OtpCodeInput;
