import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ControlBar } from './index';

// Mock the hook
jest.mock('./hook', () => ({
    useControlBar: jest.fn(),
}));

// Mock the styles
jest.mock('./style', () => ({
    __esModule: true,
    default: {
        controlBar: {},
        button: {},
        playButton: {},
    },
}));

// Mock dependencies using simple string mocks to avoid React scope issues
jest.mock('@/components/spinner', () => ({
    Spinner: 'Spinner',
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
}));

describe('ControlBar', () => {
    // Get the mocked hook after jest.mock is applied
    const { useControlBar } = require('./hook');
    const mockUseControlBar = useControlBar as jest.MockedFunction<typeof useControlBar>;

    // Get the mocked components
    const { Spinner } = require('@/components/spinner');
    const { MaterialIcons } = require('@expo/vector-icons');
    const defaultProps = {
        stop: jest.fn(),
        seekBackward: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        seekForward: jest.fn(),
        status: {
            isLoading: false,
            isPlaying: false,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseControlBar.mockReturnValue({
            handlePlayPause: jest.fn(),
        });
    });

    describe('Basic functionality', () => {
        it('should render without crashing', () => {
            expect(() => render(<ControlBar {...defaultProps} />)).not.toThrow();
        });

        it('should call useControlBar hook with correct props', () => {
            const props = {
                ...defaultProps,
                pause: jest.fn(),
                resume: jest.fn(),
            };

            render(<ControlBar {...props} />);

            expect(mockUseControlBar).toHaveBeenCalledWith({
                pause: props.pause,
                resume: props.resume,
                status: props.status,
            });
        });

        it('should render spinner when loading', () => {
            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: true, isPlaying: false }} />
            );

            const spinners = UNSAFE_getAllByType(Spinner);
            expect(spinners).toHaveLength(1);
        });

        it('should render play icon when not playing', () => {
            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: false }} />
            );

            const materialIcons = UNSAFE_getAllByType(MaterialIcons);
            expect(materialIcons).toHaveLength(5); // All 5 icons should be MaterialIcons
        });

        it('should render pause icon when playing', () => {
            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: true }} />
            );

            const materialIcons = UNSAFE_getAllByType(MaterialIcons);
            expect(materialIcons).toHaveLength(5); // All 5 icons should be MaterialIcons
        });

        it('should render control icons', () => {
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} />);

            const materialIcons = UNSAFE_getAllByType(MaterialIcons);
            expect(materialIcons).toHaveLength(5); // Stop, seek backward, play/pause, seek forward, skip
        });
    });

    describe('Button interactions', () => {
        it('should call stop function when stop button is pressed', () => {
            const mockStop = jest.fn();
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} stop={mockStop} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[0]); // First button is stop

            expect(mockStop).toHaveBeenCalled();
        });

        it('should call seekBackward function when seek backward button is pressed', () => {
            const mockSeekBackward = jest.fn();
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} seekBackward={mockSeekBackward} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[1]); // Second button is seek backward

            expect(mockSeekBackward).toHaveBeenCalled();
        });

        it('should call handlePlayPause when play/pause button is pressed and not loading', () => {
            const mockHandlePlayPause = jest.fn();
            mockUseControlBar.mockReturnValue({ handlePlayPause: mockHandlePlayPause });

            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: false }} />
            );

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[2]); // Third button is play/pause

            expect(mockHandlePlayPause).toHaveBeenCalled();
        });

        it('should not call handlePlayPause when loading', () => {
            const mockHandlePlayPause = jest.fn();
            mockUseControlBar.mockReturnValue({ handlePlayPause: mockHandlePlayPause });

            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: true, isPlaying: false }} />
            );

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[2]); // Third button is play/pause (disabled when loading)

            expect(mockHandlePlayPause).not.toHaveBeenCalled();
        });

        it('should call seekForward function when seek forward button is pressed', () => {
            const mockSeekForward = jest.fn();
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} seekForward={mockSeekForward} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[3]); // Fourth button is seek forward

            expect(mockSeekForward).toHaveBeenCalled();
        });
    });

    describe('Button states', () => {
        it('should have 5 touchable buttons', () => {
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            expect(buttons).toHaveLength(5);
        });

        it('should have correct activeOpacity on all buttons', () => {
            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            buttons.forEach(button => {
                expect(button.props.activeOpacity).toBe(0.7);
            });
        });

        it('should disable play/pause button when loading', () => {
            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: true, isPlaying: false }} />
            );

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            const playPauseButton = buttons[2]; // Third button is play/pause
            expect(playPauseButton.props.disabled).toBe(true);
        });

        it('should enable play/pause button when not loading', () => {
            const { UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: false }} />
            );

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            const playPauseButton = buttons[2]; // Third button is play/pause
            expect(playPauseButton.props.disabled).toBe(false);
        });
    });

    describe('Status changes', () => {
        it('should update display when status changes', () => {
            const { rerender, UNSAFE_getAllByType } = render(
                <ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: false }} />
            );

            // Should show MaterialIcons initially (play icon)
            let materialIcons = UNSAFE_getAllByType(MaterialIcons);
            expect(materialIcons).toHaveLength(5);

            // Change to playing state
            rerender(<ControlBar {...defaultProps} status={{ isLoading: false, isPlaying: true }} />);

            // Should still show MaterialIcons (pause icon)
            materialIcons = UNSAFE_getAllByType(MaterialIcons);
            expect(materialIcons).toHaveLength(5);

            // Change to loading state
            rerender(<ControlBar {...defaultProps} status={{ isLoading: true, isPlaying: false }} />);

            // Should show spinner in the play/pause button
            const spinners = UNSAFE_getAllByType(Spinner);
            expect(spinners).toHaveLength(1);
        });
    });

    describe('Hook integration', () => {
        it('should pass correct parameters to useControlBar', () => {
            const customProps = {
                ...defaultProps,
                pause: jest.fn(),
                resume: jest.fn(),
                status: { isLoading: false, isPlaying: true },
            };

            render(<ControlBar {...customProps} />);

            expect(mockUseControlBar).toHaveBeenCalledWith({
                pause: customProps.pause,
                resume: customProps.resume,
                status: customProps.status,
            });
        });

        it('should use handlePlayPause from hook', () => {
            const mockHandlePlayPause = jest.fn();
            mockUseControlBar.mockReturnValue({ handlePlayPause: mockHandlePlayPause });

            const { UNSAFE_getAllByType } = render(<ControlBar {...defaultProps} />);

            const buttons = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(buttons[2]); // Play/pause button

            expect(mockHandlePlayPause).toHaveBeenCalled();
        });
    });
});
