// Raw data structure from Discogs API
export interface CollectionRelease {
  id: number;
  basic_information: {
    title: string;
    year: number;
    artists: { name: string }[];
    thumb?: string;
    resource_url?: string;
  };
}

// Processed data structure for database storage
export interface RecordItem {
  id: number;
  title: string;
  artist: string;
  year: string;
  thumbnail: string;
  resource_url: string;
}

// Transformation function from API data to database format
export const transformCollectionReleaseToRecordItem = (release: CollectionRelease): RecordItem => {
  return {
    id: release.id,
    title: release.basic_information.title,
    artist: release.basic_information.artists.map(a => a.name).join(', '),
    year: release.basic_information.year.toString(),
    thumbnail: release.basic_information.thumb || '',
    resource_url: release.basic_information.resource_url || '',
  };
};

// Utility function to transform multiple releases
export const transformCollectionReleasesToRecordItems = (releases: CollectionRelease[]): RecordItem[] => {
  return releases.map(transformCollectionReleaseToRecordItem);
};
