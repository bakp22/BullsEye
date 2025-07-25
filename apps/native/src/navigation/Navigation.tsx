import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import StocksDashboardScreen from "../screens/StocksDashboardScreen";
import InsideNoteScreen from "../screens/InsideNoteScreen";
import CreateNoteScreen from "../screens/CreateNoteScreen";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName="LoginScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen
          name="StocksDashboardScreen"
          component={StocksDashboardScreen}
        />
        <Stack.Screen name="InsideNoteScreen" component={InsideNoteScreen} />
        <Stack.Screen name="CreateNoteScreen" component={CreateNoteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
