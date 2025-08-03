import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import { useDiscogsAuth } from '../hooks/useDiscogsAuth';

// Mock the useDiscogsAuth hook
jest.mock('../hooks/useDiscogsAuth');

const mockUseDiscogsAuth = useDiscogsAuth as jest.MockedFunction<typeof useDiscogsAuth>;

describe('useAuthContext', () => {
  const mockRefreshAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when used outside AuthProvider', () => {
    const TestComponent = () => {
      try {
        useAuthContext();
        return React.createElement('text', {}, 'No error');
      } catch (error) {
        return React.createElement('text', {}, error.message);
      }
    };

    let component;
    ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(React.createElement(TestComponent));
    });
    
    expect(component.root.findByType('text').children[0]).toBe(
      'useAuthContext must be used within an AuthProvider'
    );
  });

  it('should return auth state when user is authorized', () => {
    mockUseDiscogsAuth.mockReturnValue({
      isAuthorized: true,
      username: 'testuser',
      loading: false,
      error: null,
      refreshAuth: mockRefreshAuth,
    });

    let contextValue: any;
    const TestComponent = () => {
      contextValue = useAuthContext();
      return null;
    };

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        React.createElement(AuthProvider, {}, React.createElement(TestComponent))
      );
    });

    expect(contextValue.isAuthorized).toBe(true);
    expect(contextValue.username).toBe('testuser');
    expect(contextValue.loading).toBe(false);
    expect(contextValue.error).toBe(null);
    expect(contextValue.refreshAuth).toBe(mockRefreshAuth);
  });

  it('should return auth state when user is not authorized', () => {
    mockUseDiscogsAuth.mockReturnValue({
      isAuthorized: false,
      username: null,
      loading: false,
      error: null,
      refreshAuth: mockRefreshAuth,
    });

    let contextValue: any;
    const TestComponent = () => {
      contextValue = useAuthContext();
      return null;
    };

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        React.createElement(AuthProvider, {}, React.createElement(TestComponent))
      );
    });

    expect(contextValue.isAuthorized).toBe(false);
    expect(contextValue.username).toBe(null);
    expect(contextValue.loading).toBe(false);
    expect(contextValue.error).toBe(null);
    expect(contextValue.refreshAuth).toBe(mockRefreshAuth);
  });

  it('should return loading state', () => {
    mockUseDiscogsAuth.mockReturnValue({
      isAuthorized: null,
      username: null,
      loading: true,
      error: null,
      refreshAuth: mockRefreshAuth,
    });

    let contextValue: any;
    const TestComponent = () => {
      contextValue = useAuthContext();
      return null;
    };

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        React.createElement(AuthProvider, {}, React.createElement(TestComponent))
      );
    });

    expect(contextValue.isAuthorized).toBe(null);
    expect(contextValue.username).toBe(null);
    expect(contextValue.loading).toBe(true);
    expect(contextValue.error).toBe(null);
    expect(contextValue.refreshAuth).toBe(mockRefreshAuth);
  });

  it('should return error state', () => {
    const errorMessage = 'Authentication failed';
    mockUseDiscogsAuth.mockReturnValue({
      isAuthorized: false,
      username: null,
      loading: false,
      error: errorMessage,
      refreshAuth: mockRefreshAuth,
    });

    let contextValue: any;
    const TestComponent = () => {
      contextValue = useAuthContext();
      return null;
    };

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        React.createElement(AuthProvider, {}, React.createElement(TestComponent))
      );
    });

    expect(contextValue.isAuthorized).toBe(false);
    expect(contextValue.username).toBe(null);
    expect(contextValue.loading).toBe(false);
    expect(contextValue.error).toBe(errorMessage);
    expect(contextValue.refreshAuth).toBe(mockRefreshAuth);
  });

  it('should call refreshAuth when invoked', () => {
    mockUseDiscogsAuth.mockReturnValue({
      isAuthorized: true,
      username: 'testuser',
      loading: false,
      error: null,
      refreshAuth: mockRefreshAuth,
    });

    let contextValue: any;
    const TestComponent = () => {
      contextValue = useAuthContext();
      return null;
    };

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        React.createElement(AuthProvider, {}, React.createElement(TestComponent))
      );
    });

    ReactTestRenderer.act(() => {
      contextValue.refreshAuth();
    });

    expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
  });
});
