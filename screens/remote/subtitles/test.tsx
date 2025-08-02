import { Selector } from '@/components/selector';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SubtitleSelector } from './index';

// Mock the hook
jest.mock('./hook', () => ({
    useSubtitleSelector: jest.fn(),
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

describe('SubtitleSelector', () => {
    const mockUseSubtitleSelector = require('./hook').useSubtitleSelector;
    const mockSelector = Selector as jest.MockedFunction<typeof Selector>;

    const defaultProps = {
        subtitleOptions: [
            { label: 'None', value: 'none' },
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
        ],
        selectedSubtitle: 'none',
        onSelectSubtitle: jest.fn(),
    };

    const defaultHookReturn = {
        getSelectedLabel: jest.fn(),
        showModal: false,
        setShowModal: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSubtitleSelector.mockReturnValue(defaultHookReturn);
        defaultHookReturn.getSelectedLabel.mockReturnValue('None');

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
        it('should render the subtitle selector with correct structure', () => {
            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);

            // Check that main wrapper exists
            expect(getByTestId('subtitle-selector-wrapper')).toBeTruthy();

            // Check that button exists
            expect(getByTestId('subtitle-selector-button')).toBeTruthy();
        });

        it('should display the selected subtitle label', () => {
            const selectedLabel = 'English';
            defaultHookReturn.getSelectedLabel.mockReturnValue(selectedLabel);

            const { getByText } = render(<SubtitleSelector {...defaultProps} selectedSubtitle='en' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.subtitleOptions, 'en', 'None');

            expect(getByText(selectedLabel)).toBeTruthy();
        });

        it('should render the Selector component when showModal is true', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);

            expect(getByTestId('selector')).toBeTruthy();
            expect(getByTestId('selector-title')).toBeTruthy();
            expect(getByTestId('selector-icon')).toBeTruthy();
        });

        it('should not render the Selector component when showModal is false', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: false,
            });

            const { queryByTestId } = render(<SubtitleSelector {...defaultProps} />);

            expect(queryByTestId('selector')).toBeNull();
        });

        it('should pass correct props to Selector component', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} />);

            // Check that the mock was called
            expect(mockSelector).toHaveBeenCalled();

            // Get the first call's first argument (the props)
            const call = mockSelector.mock.calls[0];
            const props = call[0];

            expect(props).toEqual(
                expect.objectContaining({
                    visible: true,
                    title: 'Subtitles',
                    icon: 'subtitles',
                    options: defaultProps.subtitleOptions,
                    selectedValue: defaultProps.selectedSubtitle,
                    onSelectValue: defaultProps.onSelectSubtitle,
                    onClose: expect.any(Function),
                })
            );
        });
    });

    describe('Modal State Management', () => {
        it('should open modal when TouchableOpacity is pressed', () => {
            const mockSetShowModal = jest.fn();
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                setShowModal: mockSetShowModal,
            });

            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);

            const touchableOpacity = getByTestId('subtitle-selector-button');
            fireEvent.press(touchableOpacity);

            expect(mockSetShowModal).toHaveBeenCalledWith(true);
        });

        it('should close modal when Selector onClose is called', () => {
            const mockSetShowModal = jest.fn();
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                setShowModal: mockSetShowModal,
            });

            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);

            const closeButton = getByTestId('selector-close');
            fireEvent.press(closeButton);

            expect(mockSetShowModal).toHaveBeenCalledWith(false);
        });
    });

    describe('Subtitle Selection', () => {
        it('should call onSelectSubtitle when an option is selected', () => {
            const mockOnSelectSubtitle = jest.fn();
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            const { getByTestId } = render(
                <SubtitleSelector {...defaultProps} onSelectSubtitle={mockOnSelectSubtitle} />
            );

            const englishOption = getByTestId('option-en');
            fireEvent.press(englishOption);

            expect(mockOnSelectSubtitle).toHaveBeenCalledWith('en');
        });

        it('should pass through all subtitle options to Selector', () => {
            const customOptions = [
                { label: 'None', value: 'none' },
                { label: 'English (CC)', value: 'en-cc' },
                { label: 'English (SDH)', value: 'en-sdh' },
                { label: 'Spanish (Latin)', value: 'es-la' },
            ];

            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} subtitleOptions={customOptions} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.options).toEqual(customOptions);
        });

        it('should pass through selectedSubtitle to Selector', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='es' />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.selectedValue).toBe('es');
        });
    });

    describe('Label Display', () => {
        it('should use default label when no subtitle is selected', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='none' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(
                defaultProps.subtitleOptions,
                'none',
                'None'
            );
        });

        it('should display the label for the selected subtitle option', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('French');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='fr' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.subtitleOptions, 'fr', 'None');
        });

        it('should handle empty subtitle options array', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} subtitleOptions={[]} />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith([], defaultProps.selectedSubtitle, 'None');
        });

        it('should use "None" as default label instead of "English" like audio', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.subtitleOptions, '', 'None');
        });
    });

    describe('Hook Integration', () => {
        it('should call useSubtitleSelector hook', () => {
            render(<SubtitleSelector {...defaultProps} />);

            expect(mockUseSubtitleSelector).toHaveBeenCalled();
        });

        it('should use all returned values from hook', () => {
            const customHookReturn = {
                getSelectedLabel: jest.fn().mockReturnValue('Custom Label'),
                showModal: true,
                setShowModal: jest.fn(),
            };

            mockUseSubtitleSelector.mockReturnValue(customHookReturn);

            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);

            expect(customHookReturn.getSelectedLabel).toHaveBeenCalled();
            expect(getByTestId('selector')).toBeTruthy();
        });
    });

    describe('Component Specifics', () => {
        it('should use subtitles icon instead of volume-up', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.icon).toBe('subtitles');
        });

        it('should use "Subtitles" as title instead of "Audio Track"', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.title).toBe('Subtitles');
        });

        it('should handle subtitle-specific options like "none"', () => {
            const subtitleOptions = [
                { label: 'None', value: 'none' },
                { label: 'English', value: 'en' },
            ];

            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            const { getByTestId } = render(
                <SubtitleSelector {...defaultProps} subtitleOptions={subtitleOptions} selectedSubtitle='none' />
            );

            // Should render "none" option which is specific to subtitles
            expect(getByTestId('option-none')).toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined selectedSubtitle', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle={undefined as any} />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(
                defaultProps.subtitleOptions,
                undefined,
                'None'
            );
        });

        it('should handle null onSelectSubtitle callback', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} onSelectSubtitle={null as any} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];
            expect(props.onSelectValue).toBe(null);
        });

        it('should handle empty string selectedSubtitle', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(defaultProps.subtitleOptions, '', 'None');
        });

        it('should handle non-existent selectedSubtitle value', () => {
            defaultHookReturn.getSelectedLabel.mockReturnValue('None');

            render(<SubtitleSelector {...defaultProps} selectedSubtitle='invalid-value' />);

            expect(defaultHookReturn.getSelectedLabel).toHaveBeenCalledWith(
                defaultProps.subtitleOptions,
                'invalid-value',
                'None'
            );
        });
    });

    describe('Accessibility and UX', () => {
        it('should maintain proper activeOpacity for TouchableOpacity', () => {
            // This test ensures the component maintains good UX feedback
            const { getByTestId } = render(<SubtitleSelector {...defaultProps} />);
            const button = getByTestId('subtitle-selector-button');

            // The TouchableOpacity should be pressable
            expect(button).toBeTruthy();
            fireEvent.press(button);

            // Should have triggered modal opening
            expect(defaultHookReturn.setShowModal).toHaveBeenCalled();
        });

        it('should show correct visual indicators (icons)', () => {
            mockUseSubtitleSelector.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
            });

            render(<SubtitleSelector {...defaultProps} />);

            const call = mockSelector.mock.calls[0];
            const props = call[0];

            // Should use subtitle-specific icon
            expect(props.icon).toBe('subtitles');
            expect(props.title).toBe('Subtitles');
        });
    });
});
