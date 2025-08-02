import { Selector } from '@/components/selector';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { AudioSelector } from './index';

// Mock the hook
jest.mock('./hook', () => ({
    useAudioSelector: jest.fn(),
}));

// Mock the styles
jest.mock('./style', () => ({
    default: {
        selectorWrapper: { testID: 'selectorWrapper' },
        selectorButton: { testID: 'selectorButton' },
        selectorIcon: { testID: 'selectorIcon' },
        selectorText: { testID: 'selectorText' },
    },
}));

// Mock dependencies
jest.mock('@/components/selector');
jest.mock('@/constants/colours');
jest.mock('@expo/vector-icons');

describe('AudioSelector', () => {
    const mockUseAudioSelector = require('./hook').useAudioSelector;
    const mockSelector = Selector as jest.MockedFunction<typeof Selector>;

    const defaultProps = {
        audioOptions: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
        ],
        selectedAudio: 'en',
        onSelectAudio: jest.fn(),
    };

    const defaultHookReturn = {
        getSelectedLabel: jest.fn(),
        showModal: false,
        setShowModal: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAudioSelector.mockReturnValue(defaultHookReturn);
        defaultHookReturn.getSelectedLabel.mockReturnValue('English');

        // Mock Selector component
        mockSelector.mockImplementation(({ visible, onClose, title, icon, options, selectedValue, onSelectValue }) => {
            if (!visible) return null;
            return (
                <View testID='selector'>
                    <Text testID='selector-title'>{title}</Text>
                    <Text testID='selector-icon'>{icon}</Text>
                    <TouchableOpacity testID='selector-close' onPress={onClose}>
                        <Text>Close</Text>
                    </TouchableOpacity>
                    {options.map((option: any) => (
                        <TouchableOpacity
                            key={option.value}
                            testID={`option-${option.value}`}
                            onPress={() => onSelectValue(option.value)}
                        >
                            <Text>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        });
    });

    describe('Rendering', () => {
        it('should render the audio selector with correct structure', () => {
            const { getByTestId } = render(<AudioSelector {...defaultProps} />);

            // Check that main wrapper exists
            expect(getByTestId('audio-selector-wrapper')).toBeTruthy();

            // Check that button exists
            expect(getByTestId('audio-selector-button')).toBeTruthy();
        });

        it('should display the selected audio label', () => {
            const selectedLabel = 'Spanish';
            defaultHookReturn.getSelectedLabel.mockReturnValue(selectedLabel);

            const { getByText } = render(<AudioSelector {...defaultProps} selectedAudio='es' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.audioOptions, 'es', 'English');

            expect(getByText(selectedLabel)).toBeTruthy();
        });

        it('should render the Selector component when showModal is true', () => {
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            const { getByTestId } = render(<AudioSelector {...defaultProps} />);

            expect(getByTestId('selector')).toBeTruthy();
            expect(getByTestId('selector-title')).toBeTruthy();
            expect(getByTestId('selector-icon')).toBeTruthy();
        });

        it('should not render the Selector component when showModal is false', () => {
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: false,
            });

            const { queryByTestId } = render(<AudioSelector {...defaultProps} />);

            expect(queryByTestId('selector')).toBeNull();
        });

        it('should pass correct props to Selector component', () => {
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<AudioSelector {...defaultProps} />);

            // Check that the mock was called
            expect(mockSelector).toHaveBeenCalled();

            // Get the first call's first argument (the props)
            const call = mockSelector.mock.calls[0];
            const props = call[0];

            expect(props).toEqual(
                expect.objectContaining({
                    visible: true,
                    title: 'Audio Track',
                    icon: 'volume-up',
                    options: defaultProps.audioOptions,
                    selectedValue: defaultProps.selectedAudio,
                    onSelectValue: defaultProps.onSelectAudio,
                    onClose: expect.any(Function),
                })
            );
        });
    });

    describe('Modal State Management', () => {
        it('should open modal when TouchableOpacity is pressed', () => {
            const mockSetShowModal = jest.fn();
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                setShowModal: mockSetShowModal,
            });

            const { getByTestId } = render(<AudioSelector {...defaultProps} />);

            const touchableOpacity = getByTestId('audio-selector-button');
            fireEvent.press(touchableOpacity);

            expect(mockSetShowModal).toHaveBeenCalledWith(true);
        });

        it('should close modal when Selector onClose is called', () => {
            const mockSetShowModal = jest.fn();
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                setShowModal: mockSetShowModal,
            });

            const { getByTestId } = render(<AudioSelector {...defaultProps} />);

            const closeButton = getByTestId('selector-close');
            fireEvent.press(closeButton);

            expect(mockSetShowModal).toHaveBeenCalledWith(false);
        });
    });

    describe('Audio Selection', () => {
        it('should call onSelectAudio when an option is selected', () => {
            const mockOnSelectAudio = jest.fn();
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            const { getByTestId } = render(<AudioSelector {...defaultProps} onSelectAudio={mockOnSelectAudio} />);

            const spanishOption = getByTestId('option-es');
            fireEvent.press(spanishOption);

            expect(mockOnSelectAudio).toHaveBeenCalledWith('es');
        });

        it('should pass through all audio options to Selector', () => {
            const customOptions = [
                { label: 'English (5.1)', value: 'en-51' },
                { label: 'English (Stereo)', value: 'en-stereo' },
                { label: 'Director Commentary', value: 'commentary' },
            ];

            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<AudioSelector {...defaultProps} audioOptions={customOptions} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.options).toEqual(customOptions);
        });

        it('should pass through selectedAudio to Selector', () => {
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<AudioSelector {...defaultProps} selectedAudio='fr' />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.selectedValue).toBe('fr');
        });
    });

    describe('Label Display', () => {
        it('should use default label when no option is selected', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('English');

            render(<AudioSelector {...defaultProps} selectedAudio='' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.audioOptions, '', 'English');
        });

        it('should display the label for the selected audio option', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('French');

            render(<AudioSelector {...defaultProps} selectedAudio='fr' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.audioOptions, 'fr', 'English');
        });

        it('should handle empty audio options array', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('English');

            render(<AudioSelector {...defaultProps} audioOptions={[]} />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith([], defaultProps.selectedAudio, 'English');
        });
    });

    describe('Hook Integration', () => {
        it('should call useAudioSelector hook', () => {
            render(<AudioSelector {...defaultProps} />);

            expect(mockUseAudioSelector).toHaveBeenCalled();
        });

        it('should use all returned values from hook', () => {
            const customHookReturn = {
                getSelectedLabel: jest.fn().mockReturnValue('Custom Label'),
                showModal: true,
                setShowModal: jest.fn(),
            };

            mockUseAudioSelector.mockReturnValue(customHookReturn);

            const { getByTestId } = render(<AudioSelector {...defaultProps} />);

            expect(customHookReturn.getSelectedLabel).toHaveBeenCalled();
            expect(getByTestId('selector')).toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined selectedAudio', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('English');

            render(<AudioSelector {...defaultProps} selectedAudio={undefined as any} />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(
                defaultProps.audioOptions,
                undefined,
                'English'
            );
        });

        it('should handle null onSelectAudio callback', () => {
            mockUseAudioSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<AudioSelector {...defaultProps} onSelectAudio={null as any} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.onSelectValue).toBe(null);
        });

        it('should handle empty string selectedAudio', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('English');

            render(<AudioSelector {...defaultProps} selectedAudio='' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.audioOptions, '', 'English');
        });
    });
});
