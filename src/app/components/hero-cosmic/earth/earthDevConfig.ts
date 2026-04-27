export interface EarthDeveloperConfig {
  axialTiltDeg: number;
  sunPosition: number;
  autoRotationSpeed: number;
  markersEnabled: boolean;
}

// Developer-only Earth tuning values. Adjust these constants instead of showing UI controls.
export const EARTH_DEVELOPER_CONFIG: EarthDeveloperConfig = {
  axialTiltDeg: 16,
  sunPosition: -1,
  autoRotationSpeed: 0.2,
  markersEnabled: true,
};
