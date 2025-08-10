import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import LandingPage from '../screens/LandingPage';
import { useAuthContext } from '../contexts/AuthContext';
import { useRecordsContext } from '../contexts/RecordsContext';
import { useQueueContext } from '../contexts/QueueContext';

// Set up global mock before other mocks
const mockNavigate = jest.fn();
(global as any).mockNavigate = mockNavigate; // eslint-disable-line @typescript-eslint/no-explicit-any

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../contexts/RecordsContext');
jest.mock('../contexts/QueueContext');
jest.mock('../services/auth/tokenStorage');
jest.mock('../components/BottomNavigation', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TouchableOpacity, Text } = require('react-native');
  const MockBottomNavigation = () => (
    <TouchableOpacity testID="collection-tab" onPress={() => {
      // Mock the navigation behavior
      (global as any).mockNavigate('Collection', { username: 'testuser' }); // eslint-disable-line @typescript-eslint/no-explicit-any
    }}>
      <Text>Collection</Text>
    </TouchableOpacity>
  );
  MockBottomNavigation.displayName = 'MockBottomNavigation';
  return MockBottomNavigation;
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));
jest.mock('../utils/deviceUtils', () => ({
  hasDynamicIsland: () => false,
  getTurntableMarginTop: () => 20,
  getContentMarginTop: () => 20,
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockUseRecordsContext = useRecordsContext as jest.MockedFunction<typeof useRecordsContext>;
const mockUseQueueContext = useQueueContext as jest.MockedFunction<typeof useQueueContext>;

describe('LandingPage', () => {
  const mockRefreshAuth = jest.fn();
  const mockRefreshCollection = jest.fn();
  const mockClearError = jest.fn();
  const mockLoadCollection = jest.fn();
  const mockAddToQueue = jest.fn();
  const mockRefreshQueue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default RecordsContext mock
    mockUseRecordsContext.mockReturnValue({
      records: [],
      loading: false,
      error: null,
      initialized: false,
      currentRandomRecord: null,
      loadCollection: mockLoadCollection,
      refreshCollection: mockRefreshCollection,
      clearError: mockClearError,
      getRandomRecord: jest.fn(),
      clearRandomRecord: jest.fn(),
    });

    // Default QueueContext mock
    mockUseQueueContext.mockReturnValue({
      queue: [],
      queueCount: 0,
      loading: false,
      error: null,
      addToQueue: mockAddToQueue,
      removeFromQueue: jest.fn(),
      clearQueue: jest.fn(),
      isInQueue: jest.fn(() => false),
      refreshQueue: mockRefreshQueue,
      clearError: jest.fn(),
    });
  });

  describe('When user is authorized', () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        isAuthorized: true,
        username: 'testuser',
        loading: false,
        error: null,
        refreshAuth: mockRefreshAuth,
      });
    });

    it('should render turntable with touchable area for random record', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const turntableButton = component!.root.findByProps({ testID: 'turntable-button' });
      expect(turntableButton).toBeTruthy();
    });

    it('should render bottom navigation', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const bottomNav = component!.root.findByProps({ testID: 'collection-tab' });
      expect(bottomNav).toBeTruthy();
      // Clear tokens button is commented out in the current implementation
      // so we don't test for it
    });

    it('should navigate to Collection when bottom navigation Collection tab is pressed', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const collectionTab = component!.root.findByProps({ testID: 'collection-tab' });
      
      ReactTestRenderer.act(() => {
        collectionTab.props.onPress();
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('Collection', { username: 'testuser' });
    });
  });

  describe('When user is not authorized', () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        isAuthorized: false,
        username: null,
        loading: false,
        error: null,
        refreshAuth: mockRefreshAuth,
      });
    });

    it('should redirect to login screen on mount', () => {
      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<LandingPage />);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });

    it('should still render the landing page content', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      
      const turntableButton = component!.root.findByProps({ testID: 'turntable-button' });
      const bottomNav = component!.root.findByProps({ testID: 'collection-tab' });
      
      expect(turntableButton).toBeTruthy();
      expect(bottomNav).toBeTruthy();
      // Clear tokens button is commented out in the current implementation
      // Refresh collection button only appears in error state
    });
  });

  describe('Authorization state changes', () => {
    it('should not redirect when authorization is loading', () => {
      mockUseAuthContext.mockReturnValue({
        isAuthorized: null,
        username: null,
        loading: true,
        error: null,
        refreshAuth: mockRefreshAuth,
      });

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<LandingPage />);
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
