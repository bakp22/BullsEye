import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { useAuth, useUser } from "@clerk/clerk-expo";

const StocksDashboardScreen = ({ navigation }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;

  const [search, setSearch] = useState("");

  // Mock stock data - replace with real API calls
  const mockStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: "$150.25", change: "+2.5%" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: "$2,850.10", change: "+1.8%" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: "$310.45", change: "+3.2%" },
    { symbol: "TSLA", name: "Tesla Inc.", price: "$245.80", change: "-1.5%" },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: "$3,250.75", change: "+0.9%" },
  ];

  const filteredStocks = search
    ? mockStocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase()),
      )
    : mockStocks;

  const renderStockItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to stock details or prediction screen
        console.log("Navigate to stock details for:", item.symbol);
      }}
      activeOpacity={0.5}
      style={styles.stockItem}
    >
      <View style={styles.stockInfo}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockName}>{item.name}</Text>
      </View>
      <View style={styles.stockPrice}>
        <Text style={styles.priceText}>{item.price}</Text>
        <Text style={[
          styles.changeText,
          { color: item.change.startsWith('+') ? '#22C55E' : '#EF4444' }
        ]}>
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/icons/logo2small.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.yourStocksContainer}>
        <Text style={styles.title}>Stock Market</Text>
        {imageUrl ? (
          <Image style={styles.avatarSmall} source={{ uri: imageUrl }} />
        ) : (
          <Text>{firstName ? firstName : ""}</Text>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="grey"
          style={styles.searchIcon}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search stocks..."
          style={styles.searchInput}
        />
      </View>

      {filteredStocks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No stocks found matching{"\n"}your search
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStocks}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.symbol}
          style={styles.stocksList}
          contentContainerStyle={{
            marginTop: 19,
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0, 0, 0, 0.59)",
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => {
          // Navigate to stock prediction or watchlist
          console.log("Navigate to stock prediction");
        }}
        style={styles.newStockButton}
      >
        <AntDesign name="pluscircle" size={20} color="#fff" />
        <Text style={styles.newStockButtonText}>Predict Stock Prices</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#0D87E1",
    height: 67,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: RFValue(17.5),
    fontFamily: "MMedium",
    alignSelf: "center",
  },
  yourStocksContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    marginTop: 19,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 15,
    marginTop: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(15),
    fontFamily: "MRegular",
    color: "#2D2D2D",
  },
  stocksList: {
    flex: 1,
  },
  stockItem: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.59)",
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontFamily: "MSemiBold",
    color: "#2D2D2D",
  },
  stockName: {
    fontSize: 14,
    fontFamily: "MLight",
    color: "#6B7280",
    marginTop: 2,
  },
  stockPrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
    fontFamily: "MSemiBold",
    color: "#2D2D2D",
  },
  changeText: {
    fontSize: 14,
    fontFamily: "MMedium",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: RFValue(16),
    fontFamily: "MLight",
    color: "#6B7280",
    textAlign: "center",
  },
  newStockButton: {
    flexDirection: "row",
    backgroundColor: "#0D87E1",
    borderRadius: 7,
    width: Dimensions.get("window").width / 1.6,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    position: "absolute",
    bottom: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  newStockButtonText: {
    color: "#fff",
    fontSize: RFValue(14),
    fontFamily: "MSemiBold",
    marginLeft: 8,
  },
});

export default StocksDashboardScreen; 