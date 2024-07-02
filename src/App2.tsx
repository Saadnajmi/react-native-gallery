import React, {useCallback, useEffect, useMemo, useState} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {
  NativeModules,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
// @ts-expect-error no type definitions available
import {version as coreVersion} from 'react-native/Libraries/Core/ReactNativeVersion';
import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
// @ts-expect-error no type definitions available
import {isAsyncDebugging} from 'react-native/Libraries/Utilities/DebugEnvironment';

// import React from 'react';
import {
  // View,
  // StyleSheet,
  Pressable,
  // Text,
  // useColorScheme,
  // ScrollView,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createDrawerNavigator,
  getDrawerStatusFromState,
} from '@react-navigation/drawer';
import RNGalleryList, {RNGalleryCategories} from './RNGalleryList';
import LightTheme from './themes/LightTheme';
import DarkTheme from './themes/DarkTheme';
import {
  ThemeMode,
  RawThemeContext,
  ThemeContext,
  ThemeSetterContext,
} from './themes/Theme';
import {PlatformColor} from 'react-native';
// import {AppTheme} from 'react-native-windows';
import HighContrastTheme from './themes/HighContrastTheme';

declare global {
  export const RN$Bridgeless: boolean;
}

type AppProps = {
  concurrentRoot?: boolean;
};

type FeatureProps =
  | {children: string; value: string}
  | {
      children: string;
      value: boolean;
      disabled?: boolean;
      onValueChange?: (value: boolean) => void;
    };

function getHermesVersion(): string | undefined {
  return (
    'HermesInternal' in global &&
    HermesInternal &&
    'getRuntimeProperties' in HermesInternal &&
    typeof HermesInternal.getRuntimeProperties === 'function' &&
    HermesInternal.getRuntimeProperties()['OSS Release Version']
  );
}

function getReactNativeVersion(): string {
  const {major, minor, patch, prerelease} = coreVersion;
  const version = `${major}.${minor}.${patch}`;
  return prerelease ? `${version}-${prerelease.replace('-', '\n')}` : version;
}

function isBridgeless() {
  return 'RN$Bridgeless' in global && RN$Bridgeless === true;
}

function isConcurrentReactEnabled(props: AppProps, isFabric: boolean): boolean {
  const {major, minor} = coreVersion;
  const version = major * 10000 + minor;
  // As of 0.74, it won't be possible to opt-out:
  // https://github.com/facebook/react-native/commit/30d186c3683228d4fb7a42f804eb2fdfa7c8ac03
  return isFabric && (version >= 74 || props.concurrentRoot !== false);
}

function isFabricInstance<T>(
  ref: NativeSyntheticEvent<T>['currentTarget'],
): boolean {
  return Boolean(
    // @ts-expect-error — https://github.com/facebook/react-native/blob/0.72-stable/packages/react-native/Libraries/Renderer/public/ReactFabricPublicInstanceUtils.js
    ref.__nativeTag ||
      // @ts-expect-error — https://github.com/facebook/react-native/blob/0.72-stable/packages/react-native/Libraries/Renderer/public/ReactFabricPublicInstanceUtils.js
      ref._internalInstanceHandle?.stateNode?.canonical,
  );
}

function isOnOrOff(value: unknown): 'Off' | 'On' {
  return value ? 'On' : 'Off';
}

function isRemoteDebuggingAvailable(): boolean {
  return (
    !getHermesVersion() &&
    !isBridgeless() &&
    typeof NativeModules.DevSettings?.setIsDebuggingRemotely === 'function'
  );
}

function setRemoteDebugging(value: boolean) {
  if (isRemoteDebuggingAvailable()) {
    NativeModules.DevSettings.setIsDebuggingRemotely(value);
  }
}

function testID(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-') + '-value';
}

function useIsFabricComponent() {
  const [isFabric, setIsFabric] = useState(isBridgeless());
  const setter = useCallback(
    ({currentTarget}: NativeSyntheticEvent<unknown>) => {
      setIsFabric(isFabricInstance(currentTarget));
    },
    [setIsFabric],
  );
  return [isFabric, setter] as const;
}

function useLocalStorageStatus() {
  const [localValue, setLocalValue] = useState('Checking');
  useEffect(() => {
    const key = 'sample/local-storage';
    window?.localStorage?.setItem(key, 'Available');
    setLocalValue(window?.localStorage?.getItem(key) ?? 'Error');
    return () => window?.localStorage?.removeItem(key);
  }, []);
  return localValue;
}

function useStyles() {
  const colorScheme = useColorScheme();
  return useMemo(() => {
    const isDarkMode = colorScheme === 'dark';

    const fontSize = 18;
    const groupBorderRadius = 8;
    const margin = 16;

    return StyleSheet.create({
      body: {
        backgroundColor: isDarkMode ? Colors.black : Colors.lighter,
        flex: 1,
      },
      group: {
        backgroundColor: isDarkMode ? Colors.darker : Colors.white,
        borderRadius: groupBorderRadius,
        margin,
      },
      groupItemContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: margin,
      },
      groupItemLabel: {
        color: isDarkMode ? Colors.white : Colors.black,
        flex: 1,
        fontSize,
        marginVertical: 12,
      },
      groupItemValue: {
        color: isDarkMode ? Colors.light : Colors.dark,
        fontSize: fontSize,
        textAlign: 'right',
      },
      separator: {
        backgroundColor: isDarkMode ? Colors.dark : Colors.light,
        height: StyleSheet.hairlineWidth,
        marginStart: margin,
      },
    });
  }, [colorScheme]);
}

function Feature({
  children: label,
  value,
  ...props
}: FeatureProps): React.ReactElement<FeatureProps> {
  const styles = useStyles();
  return (
    <View style={styles.groupItemContainer}>
      <Text style={styles.groupItemLabel}>{label}</Text>
      {typeof value === 'boolean' ? (
        <Switch value={value} {...props} />
      ) : (
        <Text testID={testID(label)} style={styles.groupItemValue}>
          {value}
        </Text>
      )}
    </View>
  );
}

function Separator(): React.ReactElement {
  const styles = useStyles();
  return <View style={styles.separator} />;
}

function DevMenu(): React.ReactElement | null {
  const styles = useStyles();

  if (!isRemoteDebuggingAvailable()) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Feature value={isAsyncDebugging} onValueChange={setRemoteDebugging}>
        Remote Debugging
      </Feature>
    </View>
  );
}

export default function App(props: AppProps): React.ReactElement<AppProps> {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = useStyles();
  const [isFabric, setIsFabric] = useIsFabricComponent();
  const localStorageStatus = useLocalStorageStatus();

  return (
    <SafeAreaView style={styles.body}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        onLayout={setIsFabric}
        style={styles.body}>
        <Header />
        <DevMenu />
        <View style={styles.group}>
          <Feature value={localStorageStatus}>window.localStorage</Feature>
        </View>
        <View style={styles.group}>
          <Feature value={getReactNativeVersion()}>React Native</Feature>
          <Separator />
          <Feature value={isOnOrOff(getHermesVersion())}>Hermes</Feature>
          <Separator />
          <Feature value={isOnOrOff(isFabric)}>Fabric</Feature>
          <Separator />
          <Feature value={isOnOrOff(isConcurrentReactEnabled(props, isFabric))}>
            Concurrent React
          </Feature>
          <Separator />
          <Feature value={isOnOrOff(isBridgeless())}>Bridgeless</Feature>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// SAAD

const styles = StyleSheet.create({
  menu: {
    margin: 5,
    height: 34,
    width: 38,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontFamily: 'Segoe MDL2 Assets',
    fontSize: 16,
    color: PlatformColor('TextControlForeground'),
  },
  drawer: {
    backgroundColor: PlatformColor('NavigationViewDefaultPaneBackground'),
    height: '100%',
  },
  drawerText: {
    color: PlatformColor('TextControlForeground'),
  },
  drawerDivider: {
    backgroundColor: PlatformColor('CardStrokeColorDefaultBrush'),
    height: 1,
  },
  indentContainer: {
    width: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  category: {
    gap: 4,
  },
  expandedChevron: {
    flexGrow: 1,
    alignItems: 'flex-end',
  },
  navigationItemPill: {
    backgroundColor: PlatformColor('AccentFillColorDefaultBrush'),
    borderRadius: 2,
    right: 6,
    width: 3,
    height: 16,
    alignSelf: 'flex-start',
  },
});

const createDrawerListItemStyles = (isHovered: boolean, isPressed: boolean) =>
  StyleSheet.create({
    drawerListItem: {
      backgroundColor: isPressed
        ? PlatformColor('ControlAltFillColorSecondaryBrush')
        : isHovered
        ? PlatformColor('ControlAltFillColorTertiaryBrush')
        : 'transparent',
      borderColor: isHovered
        ? PlatformColor('ControlStrokeColorSecondary')
        : PlatformColor('ControlStrokeColorDefaultBrush'),
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
      paddingVertical: 8,
      gap: 4,
    },
  });

type SelectedNavigationItemPillProps = {
  currentRoute: string;
  itemRoute: string;
};
const SelectedNavigationItemPill = ({
  currentRoute,
  itemRoute,
}: SelectedNavigationItemPillProps) => {
  if (currentRoute !== itemRoute) {
    return <View />;
  }

  return <View style={styles.navigationItemPill} />;
};

type DrawerListItemProps = {
  route: string;
  label: string;
  icon?: string;
  navigation: any;
  currentRoute: string;
};
const DrawerListItem = ({
  route,
  label,
  icon,
  navigation,
  currentRoute,
}: DrawerListItemProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const localStyles = createDrawerListItemStyles(isHovered, isPressed);
  return (
    <Pressable
      onPress={() => navigation.navigate(route)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={localStyles.drawerListItem}>
      <View style={styles.indentContainer}>
        <SelectedNavigationItemPill
          currentRoute={currentRoute}
          itemRoute={route}
        />
        <Text accessible={false} style={styles.icon}>
          {icon}
        </Text>
      </View>
      <Text accessible={false} style={styles.drawerText}>
        {label}
      </Text>
    </Pressable>
  );
};

type DrawerCollapsibleCategoryProps = {
  categoryLabel: string;
  categoryIcon: string;
  items: any;
  navigation: any;
  currentRoute: string;
  containsCurrentRoute: boolean;
};
const DrawerCollapsibleCategory = ({
  categoryLabel,
  categoryIcon,
  items,
  navigation,
  currentRoute,
  containsCurrentRoute,
}: DrawerCollapsibleCategoryProps) => {
  const categoryRoute = `Category: ${categoryLabel}`;
  const isCurrentRoute = currentRoute === categoryRoute;
  const [isExpanded, setIsExpanded] = React.useState(
    containsCurrentRoute || isCurrentRoute,
  );
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const localStyles = createDrawerListItemStyles(isHovered, isPressed);

  const onPress = () => {
    if (isExpanded && containsCurrentRoute) {
      // Drawer will automatically close when navigating to a new route, by design:
      // https://github.com/react-navigation/react-navigation/pull/4394
      // As a workaround, we allow you to get a category page when the category
      // is expanded but you aren't on the category page now.
      navigation.navigate(categoryRoute, {category: categoryLabel});
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <View
      style={styles.category}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={categoryLabel}
      onAccessibilityTap={() => setIsExpanded(!isExpanded)}>
      <Pressable
        style={localStyles.drawerListItem}
        onPress={() => onPress()}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        accessible={false}>
        <View style={styles.indentContainer}>
          <SelectedNavigationItemPill
            currentRoute={currentRoute}
            itemRoute={categoryRoute}
          />
          <Text accessible={false} style={styles.icon}>
            {categoryIcon}
          </Text>
        </View>
        <Text accessible={false} style={styles.drawerText}>
          {categoryLabel}
        </Text>
        <View style={styles.expandedChevron}>
          <Text accessible={false} style={styles.icon}>
            {isExpanded ? '\uE971' : '\uE972'}
          </Text>
        </View>
      </Pressable>
      {isExpanded &&
        items.map((item) => (
          <DrawerListItem
            key={item.label}
            route={item.label}
            label={item.label}
            navigation={navigation}
            currentRoute={currentRoute}
          />
        ))}
    </View>
  );
};

// SAAD error here
const DrawerListView = (props) => {
  // // Home and Settings drawer items have already been manually loaded.
  const filterPredicate = (item) => item.type !== '';
  const filteredList = RNGalleryList.filter(filterPredicate);

  let categoryWithCurrentRoute = '';

  // Create an array for each category
  let categoryMap = new Map();
  RNGalleryCategories.forEach((category) => {
    categoryMap.set(category.label, []);
  });

  // Populate the category arrays
  filteredList.forEach((item) => {
    let category = item.type;
    let categoryList = categoryMap.get(category);
    categoryList?.push({label: item.key, icon: item.icon});
    if (item.key === props.currentRoute) {
      categoryWithCurrentRoute = category;
    }
  });

  return (
    <View>
      {RNGalleryCategories.map((category) => (
        <DrawerCollapsibleCategory
          categoryLabel={category.label}
          categoryIcon={category.icon}
          items={categoryMap.get(category.label)}
          navigation={props.navigation}
          currentRoute={props.currentRoute}
          containsCurrentRoute={categoryWithCurrentRoute === category.label}
        />
      ))}
    </View>
  );
};
