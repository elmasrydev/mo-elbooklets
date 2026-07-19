import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  I18nManager,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  ReturnKeyTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { INPUT_TEXT_ALIGN } from '../lib/rtl';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Called when the clear (✕) button is pressed. Defaults to clearing the text. */
  onClear?: () => void;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  /** Dismiss the keyboard when the clear button is pressed. Default: false. */
  dismissKeyboardOnClear?: boolean;
  /** Style override for the outer input box (border, radius, padding, background, shadow). */
  style?: StyleProp<ViewStyle>;
  /** Style override for the TextInput (e.g. font weight). */
  inputStyle?: StyleProp<TextStyle>;
  /** Colour of the leading search icon. Defaults to theme.colors.textTertiary. */
  iconColor?: string;
  /** Hard cap on typed characters. Unbounded when omitted. */
  maxLength?: number;
  testID?: string;
}

/**
 * Shared search field: leading search icon, text input, and a clear (✕) button
 * that appears once there's text.
 *
 * RTL-correct by construction — it uses `flexDirection: 'row'` + a logical
 * `marginEnd` gap and lets the native RTL engine flip the layout, per the project
 * RTL rule. Text alignment goes through the shared `INPUT_TEXT_ALIGN` constant
 * (rationale in `src/lib/rtl.ts`): the "let native flip 'left'" rule does not
 * apply to TextInput on either platform, so alignment is resolved there once and
 * reused here (BKLT-312). Do NOT re-introduce a manual `row-reverse` or a local
 * `isRTL() ? 'right'` — that layout/text mismatch is what clipped Arabic-mode
 * search text in BKLT-277.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  autoFocus,
  returnKeyType = 'search',
  onSubmitEditing,
  dismissKeyboardOnClear = false,
  style,
  inputStyle,
  iconColor,
  maxLength,
  testID,
}) => {
  const { theme } = useTheme();
  const { typography } = useTypography();

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
    if (dismissKeyboardOnClear) Keyboard.dismiss();
  };

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={iconColor ?? theme.colors.textTertiary}
        style={styles.icon}
      />
      <TextInput
        style={[
          styles.input,
          typography('body'),
          {
            color: theme.colors.text,
            // Anchor text to the leading edge (next to the icon) via the shared
            // INPUT_TEXT_ALIGN (rationale in src/lib/rtl.ts, BKLT-312).
            textAlign: INPUT_TEXT_ALIGN,
          },
          // iOS-only vertical/focus tuning (BKLT-277). On Android these BREAK the
          // field: `lineHeight: undefined` collapses the line box so typed text
          // renders invisibly (BKLT-312), and `writingDirection` is unneeded since
          // Android keeps typography's lineHeight. So apply them on iOS only:
          //  - writingDirection pinned to the UI direction stops iOS re-aligning on
          //    focus by the first character's script.
          //  - stripping typography('body')'s lineHeight keeps the text on the
          //    icon/clear line focused (native field) vs blurred (RN text).
          Platform.OS === 'ios'
            ? { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr', lineHeight: undefined }
            : null,
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        testID={testID}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          testID={testID ? `${testID}-clear` : undefined}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    // Logical margin → flips with RTL so there's always a gap between the icon
    // and the text in both LTR and RTL.
    marginEnd: 8,
  },
  input: {
    flex: 1,
    // Vertical centering is done ENTIRELY by the row's alignItems:'center'.
    // Deliberately NO height and NO lineHeight here — an explicit lineHeight on an
    // iOS TextInput renders the text at a different vertical offset focused (native
    // field) vs blurred (RN text), knocking it off the icon/clear line. Letting the
    // font's own metrics size the line keeps all three on one row. (BKLT-277)
    padding: 0,
    textAlignVertical: 'center', // Android: center the glyph in its line box
    includeFontPadding: false, // Android: drop extra top/bottom font padding
  },
  clearBtn: {
    padding: 4,
  },
});

export default SearchBar;
