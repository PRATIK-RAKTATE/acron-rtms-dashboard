export type ThemeMode = 'olive' | 'blueprint';

export interface ZoneInfo {
  id: string;
  title: string;
  code: string;
  area: string;
  height: string;
  flooring: string;
  access: string;
  status: string;
  desc: string;
}

export interface MachineInfo {
  id: string;
  name: string;
  zone: string;
  side: 'Left' | 'Right';
  imageHref?: string;
  isGlowingGreen?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  imageProps?: {
    x: number;
    y: number;
    width: number;
    height: number;
    transform?: string;
  };
  labelY1: number;
  labelY2: number;
  labelX: number;
  subTitle: string;
  rtmsId?: string;
  mouldNumber?: string;
  cavity?: number;
  mode?: 'Production' | 'Trial';
}

export interface SelectedItem {
  type: 'zone' | 'machine';
  id: string;
  data: ZoneInfo | MachineInfo;
}

export interface CadGuideData {
  x: number;
  y: number;
  w: number;
  h: number;
  labelText: string;
  isCursorCrosshair?: boolean;
}
