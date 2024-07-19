import {useDrawerStatus} from '@react-navigation/drawer';
import type {DrawerContentComponentProps} from '@react-navigation/drawer';
import {
  StyleSheet,
  PlatformColor,
  View,
  Pressable,
  Text,
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import RNGalleryList, {RNGalleryCategories} from './RNGalleryList';
import React from 'react';

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
  isSelected: boolean;
};
const SelectedNavigationItemPill = ({
  isSelected,
}: SelectedNavigationItemPillProps) => {
  if (!isSelected) {
    return <View />;
  }

  return <View style={styles.navigationItemPill} />;
};

type DrawerListItemProps = {
  label: string;
  icon?: string;
  isSelected: boolean;
  onPress: (event: GestureResponderEvent) => void;
};
const DrawerListItem = ({
  label,
  icon,
  isSelected,
  onPress,
}: DrawerListItemProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const localStyles = createDrawerListItemStyles(isHovered, isPressed);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={localStyles.drawerListItem}>
      <View style={styles.indentContainer}>
        <SelectedNavigationItemPill isSelected={isSelected} />
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

  const isCategorySelected = currentRoute === categoryRoute;

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
          <SelectedNavigationItemPill isSelected={isCategorySelected} />
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

const DrawerListView = (props: {currentRoute: string; navigation: any}) => {
  // Home and Settings drawer items have already been manually loaded.
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

export function ComponentList(props: DrawerContentComponentProps) {
  const {navigation, state} = props;
  const isDrawerOpen = useDrawerStatus() === 'open';
  const currentRoute = state.routeNames[state.index];

  if (!isDrawerOpen) {
    return <View />;
  }
  return (
    <View style={styles.drawer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Navigation bar expanded"
        {...{tooltip: 'Collapse Menu'}}
        style={styles.menu}
        onPress={() => navigation.closeDrawer()}>
        <Text style={styles.icon}>&#xE700;</Text>
      </Pressable>
      <DrawerListItem
        label="Home"
        icon="&#xE80F;"
        onPress={() => navigation.navigate('Home')}
        isSelected={currentRoute === 'Home'}
      />
      <DrawerListItem
        label="All samples"
        icon="&#xE71D;"
        onPress={() => navigation.navigate('All samples')}
        isSelected={currentRoute === 'All samples'}
      />
      <View style={styles.drawerDivider} />
      <ScrollView>
        <DrawerListView navigation={navigation} currentRoute={currentRoute} />
      </ScrollView>
      <View style={styles.drawerDivider} />
      <DrawerListItem
        label="Settings"
        icon="&#xE713;"
        onPress={() => navigation.navigate('Settings')}
        isSelected={currentRoute === 'Settings'}
      />
    </View>
  );
}
