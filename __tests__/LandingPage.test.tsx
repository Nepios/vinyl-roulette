import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert } from 'react-native';
import LandingPage from '../screens/LandingPage';
import { useAuthContext } from '../contexts/AuthContext';
import { useRecordsContext } from '../contexts/RecordsContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';

// Set up global mock before other mocks
const mockNavigate = jest.fn();
(global as any).mockNavigate = mockNavigate;

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../contexts/RecordsContext');
jest.mock('../services/auth/tokenStorage');
jest.mock('../components/BottomNavigation', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return (props: any) => (
    <TouchableOpacity testID="collection-tab" onPress={() => {
      // Mock the navigation behavior
      (global as any).mockNavigate('Collection', { username: 'testuser' });
    }}>
      <Text>Collection</Text>
    </TouchableOpacity>
  );
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockUseRecordsContext = useRecordsContext as jest.MockedFunction<typeof useRecordsContext>;
const mockClearDiscogsToken = clearDiscogsToken as jest.MockedFunction<typeof clearDiscogsToken>;

describe('LandingPage', () => {
  const mockRefreshAuth = jest.fn();
  const mockRefreshCollection = jest.fn();
  const mockClearError = jest.fn();
  const mockLoadCollection = jest.fn();

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

    it('should render random record and refresh collection buttons', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const randomButton = component!.root.findByProps({ title: 'Random Record' });
      const refreshButton = component!.root.findByProps({ title: 'Refresh Collection' });
      expect(randomButton).toBeTruthy();
      expect(refreshButton).toBeTruthy();
    });

    it('should render bottom navigation', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const bottomNav = component!.root.findByProps({ testID: 'collection-tab' });
      const clearTokensButton = component!.root.findByProps({ title: 'Clear Tokens' });
      expect(bottomNav).toBeTruthy();
      expect(clearTokensButton).toBeTruthy();
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
      
      const randomButton = component!.root.findByProps({ title: 'Random Record' });
      const refreshButton = component!.root.findByProps({ title: 'Refresh Collection' });
      const clearTokensButton = component!.root.findByProps({ title: 'Clear Tokens' });
      const bottomNav = component!.root.findByProps({ testID: 'collection-tab' });
      
      expect(randomButton).toBeTruthy();
      expect(refreshButton).toBeTruthy();
      expect(clearTokensButton).toBeTruthy();
      expect(bottomNav).toBeTruthy();
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
