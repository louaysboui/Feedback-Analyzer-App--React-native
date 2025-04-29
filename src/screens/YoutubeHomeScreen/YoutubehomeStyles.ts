import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    errorText: {
      color: 'red',
      fontSize: 14,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: 'gray',
      textAlign: 'center',
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: 'center',
      marginBottom: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    button: {
      backgroundColor: '#ff0000',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    exampleTitle: {
      fontSize: 14,
      color: 'gray',
      textAlign: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    popularChannelsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    popularChannelText: {
      fontSize: 16,
      color: '#333',
      marginRight: 16,
      marginBottom: 8,
    },
    searchHistoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#ccc',
      marginRight: 12,
    },
    searchHistoryName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    searchHistorySubscribers: {
      fontSize: 14,
      color: 'gray',
    },
    noHistoryText: {
      fontSize: 16,
      color: 'gray',
    },
  });   