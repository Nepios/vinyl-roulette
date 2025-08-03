import axios from 'axios';
import { fetchUserCollection, fetchUserIdentity, CollectionRelease } from '../services/discogsApi';
import { getDiscogsToken } from '../services/auth/tokenStorage';

// Mock dependencies
jest.mock('axios');
jest.mock('../services/auth/tokenStorage');
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));
jest.mock('react-native-crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('mocked-signature')
    })
  })
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetDiscogsToken = getDiscogsToken as jest.MockedFunction<typeof getDiscogsToken>;

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    DISCOGS_CONSUMER_KEY: 'test-consumer-key',
    DISCOGS_CONSUMER_SECRET: 'test-consumer-secret'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('discogsApi', () => {
  const mockToken = {
    oauth_token: 'test-token',
    oauth_token_secret: 'test-secret'
  };

  const mockCollectionData = {
    releases: [
      {
        id: 1,
        basic_information: {
          title: 'Test Album',
          year: 2023,
          artists: [{ name: 'Test Artist' }]
        }
      },
      {
        id: 2,
        basic_information: {
          title: 'Another Album',
          year: 2022,
          artists: [{ name: 'Another Artist' }]
        }
      }
    ] as CollectionRelease[]
  };

  const mockIdentityData = {
    username: 'testuser'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserCollection', () => {
    describe('successful requests', () => {
      it('should fetch user collection successfully', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockResolvedValue({ data: mockCollectionData });

        // Act
        const result = await fetchUserCollection('testuser');

        // Assert
        expect(mockedGetDiscogsToken).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.discogs.com/users/testuser/collection/folders/0/releases',
          expect.objectContaining({
            headers: expect.any(Object)
          })
        );
        expect(result).toEqual(mockCollectionData.releases);
        expect(result).toHaveLength(2);
        expect(result[0].basic_information.title).toBe('Test Album');
      });

      it('should construct correct API URL with username', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockResolvedValue({ data: mockCollectionData });

        // Act
        await fetchUserCollection('myusername');

        // Assert
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.discogs.com/users/myusername/collection/folders/0/releases',
          expect.objectContaining({
            headers: expect.any(Object)
          })
        );
      });

      it('should handle empty collection response', async () => {
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockResolvedValue({ data: { releases: [] } });

        const result = await fetchUserCollection('testuser');
        expect(result).toEqual([]);
      });

      it('should complete full OAuth flow with real-like data', async () => {
        const realishToken = {
          oauth_token: 'real-looking-token-12345',
          oauth_token_secret: 'real-looking-secret-67890'
        };
        
        mockedGetDiscogsToken.mockResolvedValue(realishToken);
        mockedAxios.get.mockResolvedValue({
          data: {
            releases: [
              {
                id: 123456,
                basic_information: {
                  title: 'Kind of Blue',
                  year: 1959,
                  artists: [{ name: 'Miles Davis' }],
                  formats: [{ name: 'Vinyl' }]
                }
              }
            ]
          }
        });

        const result = await fetchUserCollection('jazzfan');
        expect(result[0].basic_information.title).toBe('Kind of Blue');
      });
    });

    describe('authentication errors', () => {
      it('should throw error when no access token is found', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(null);

        // Act & Assert
        await expect(fetchUserCollection('testuser')).rejects.toThrow('No access token found');
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle API errors gracefully', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockRejectedValue(new Error('API Error'));

        // Act & Assert
        await expect(fetchUserCollection('testuser')).rejects.toThrow('API Error');
        expect(mockedGetDiscogsToken).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });

      it('should handle different HTTP error codes', async () => {
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        const axiosError = new Error('Request failed with status code 401');
        (axiosError as any).response = { status: 401, statusText: 'Unauthorized' };
        mockedAxios.get.mockRejectedValue(axiosError);

        await expect(fetchUserCollection('testuser')).rejects.toThrow('Request failed with status code 401');
      });

      it('should handle malformed API response', async () => {
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockResolvedValue({ data: {} }); // Missing releases

        const result = await fetchUserCollection('testuser');
        // expect(result).toBeUndefined(); // Function returns data.releases which is undefined
        expect(result).toEqual([]); // Should return empty array when releases is missing
      });
    });
  });

  describe('fetchUserIdentity', () => {
    describe('successful requests', () => {
      it('should fetch user identity successfully', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockResolvedValue({ data: mockIdentityData });

        // Act
        const result = await fetchUserIdentity();

        // Assert
        expect(mockedGetDiscogsToken).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.discogs.com/oauth/identity',
          expect.objectContaining({
            headers: expect.any(Object)
          })
        );
        expect(result).toEqual(mockIdentityData);
        expect(result.username).toBe('testuser');
      });
    });

    describe('authentication errors', () => {
      it('should throw error when no access token is found', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(null);

        // Act & Assert
        await expect(fetchUserIdentity()).rejects.toThrow('No access token found');
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle API errors gracefully', async () => {
        // Arrange
        mockedGetDiscogsToken.mockResolvedValue(mockToken);
        mockedAxios.get.mockRejectedValue(new Error('Identity API Error'));

        // Act & Assert
        await expect(fetchUserIdentity()).rejects.toThrow('Identity API Error');
        expect(mockedGetDiscogsToken).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('OAuth integration', () => {
    it('should include OAuth headers in requests', async () => {
      // Arrange
      mockedGetDiscogsToken.mockResolvedValue(mockToken);
      mockedAxios.get.mockResolvedValue({ data: { releases: [] } });

      // Act
      await fetchUserCollection('testuser');

      // Assert
      const headers = mockedAxios.get.mock.calls[0][1]?.headers;
      expect(headers).toHaveProperty('Authorization');
      expect(headers?.Authorization).toMatch(/^OAuth/);
      expect(headers?.Authorization).toContain('oauth_consumer_key');
      expect(headers?.Authorization).toContain('oauth_token');
      expect(headers?.Authorization).toContain('oauth_signature');

      expect(mockedAxios.get.mock.calls[0][1]).toHaveProperty('headers');
      expect(mockedAxios.get.mock.calls[0][1]?.headers).toEqual(expect.any(Object));
    });
  });
});
