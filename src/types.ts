export interface AppInfo {
  id: string;
  name: string;
  iconColor: string;
  iconName: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export interface Coordinates {
  r: number; // row
  c: number; // column
}
