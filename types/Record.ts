export interface Record {
  id: number;
  discogs_id: number;
  date_added?: string;
  title: string;
  year: number;
  artists: string;
  cover_image?: string;
  thumb?: string;
  resource_url: string;
}