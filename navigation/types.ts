// Navigation types for React Navigation
// Defines the parameter lists for type-safe navigation

export type RootTabParamList = {
  Dashboard: undefined;
  Analytics: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}