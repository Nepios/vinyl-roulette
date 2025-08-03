import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert } from 'react-native';
import LandingPage from '../screens/LandingPage';
import { useAuthContext } from '../contexts/AuthContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../services/auth/tokenStorage');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockClearDiscogsToken = clearDiscogsToken as jest.MockedFunction<typeof clearDiscogsToken>;
const mockNavigate = jest.fn();

// Mock Alert directly in jest.setup.js

// Mock useNavigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('LandingPage', () => {
  const mockRefreshAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
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

    it('should render landing page title', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const textElement = component.root.findByProps({ children: 'Landing Page' });
      expect(textElement).toBeTruthy();
    });

    it('should render navigation buttons', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const collectionButton = component.root.findByProps({ title: 'Go to My Collection' });
      const clearTokensButton = component.root.findByProps({ title: 'Clear Tokens' });
      expect(collectionButton).toBeTruthy();
      expect(clearTokensButton).toBeTruthy();
    });

    it('should navigate to Collection when "Go to My Collection" is pressed', () => {
      let component;
      ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(<LandingPage />);
      });
      const collectionButton = component.root.findByProps({ title: 'Go to My Collection' });
      
      ReactTestRenderer.act(() => {
        collectionButton.props.onPress();
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('Collection');
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
      
      expect(component.root.findByProps({ children: 'Landing Page' })).toBeTruthy();
      expect(component.root.findByProps({ title: 'Go to My Collection' })).toBeTruthy();
      expect(component.root.findByProps({ title: 'Clear Tokens' })).toBeTruthy();
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
