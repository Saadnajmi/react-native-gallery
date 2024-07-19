import React from 'react';
import {useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import RNGalleryList from './RNGalleryList';
import LightTheme from './themes/LightTheme';
import DarkTheme from './themes/DarkTheme';
import {
  ThemeMode,
  RawThemeContext,
  ThemeContext,
  ThemeSetterContext,
} from './themes/Theme';
import HighContrastTheme from './themes/HighContrastTheme';
import useHighContrastState from './hooks/useHighContrastState';
import {ComponentList} from './ComponentList';

const Drawer = createDrawerNavigator();

function MyDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <ComponentList {...props} />}
      screenOptions={{headerShown: false}}>
      {RNGalleryList.map((item) => (
        <Drawer.Screen
          name={item.key}
          key={item.key}
          component={item.component}
        />
      ))}
    </Drawer.Navigator>
  );
}

export default function App() {
  const [rawtheme, setRawTheme] = React.useState<ThemeMode>('system');
  const colorScheme = useColorScheme();
  const theme = rawtheme === 'system' ? colorScheme! : rawtheme;

  const isHighContrast = useHighContrastState();

  return (
    <ThemeSetterContext.Provider value={setRawTheme}>
      <RawThemeContext.Provider value={rawtheme}>
        <ThemeContext.Provider value={theme}>
          <NavigationContainer
            theme={
              isHighContrast
                ? HighContrastTheme
                : theme === 'dark'
                ? DarkTheme
                : LightTheme
            }>
            <MyDrawer />
          </NavigationContainer>
        </ThemeContext.Provider>
      </RawThemeContext.Provider>
    </ThemeSetterContext.Provider>
  );
}
