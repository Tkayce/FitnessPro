// Type declarations for React to resolve module not found errors
declare module 'react' {
  const React: any;
  export = React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module '@expo/vector-icons' {
  export const MaterialIcons: any;
  export const Ionicons: any;
  export const AntDesign: any;
  export const Feather: any;
}

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export const DefaultTheme: any;
}

declare module '@react-navigation/bottom-tabs' {
  export const createBottomTabNavigator: any;
}