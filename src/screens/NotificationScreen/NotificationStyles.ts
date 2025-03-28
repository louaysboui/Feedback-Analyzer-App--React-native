import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

// Styles for a modern and creative UI
const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 15,
      backgroundColor: '#f5f5f5', // Light gray background for modern feel
    },
    header: {
      fontFamily: 'Poppins-Bold',
      fontSize: 26,
      color: Colors.primary,
      textAlign: 'center',
      marginVertical: 15,
    },
    sliderContainer: {
      marginVertical: 20,
      paddingHorizontal: 10,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    sliderLabel: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      color: Colors.text,
      marginBottom: 10,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 25, // Rounded button
      alignSelf: 'center',
      marginVertical: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },
    refreshButtonText: {
      color: '#fff',
      fontFamily: 'Poppins-Bold',
      fontSize: 16,
      marginLeft: 8,
    },
    notificationCount: {
      alignSelf: 'center',
      backgroundColor: '#FF3B30',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
      marginVertical: 10,
    },
    notificationCountText: {
      color: '#fff',
      fontFamily: 'Poppins-Bold',
      fontSize: 14,
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 15,
      marginVertical: 5,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#FF3B30', // Red accent for alerts
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    notificationIcon: {
      marginRight: 12,
    },
    notificationText: {
      flex: 1,
    },
    notificationMessage: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: Colors.text,
    },
    notificationTimestamp: {
      fontFamily: 'Poppins-Regular',
      fontSize: 12,
      color: '#888',
      marginTop: 4,
    },
    clearAllButton: {
      alignSelf: 'flex-end',
      padding: 10,
      marginTop: 10,
    },
    clearAllButtonText: {
      color: Colors.primary,
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
    },
    emptyState: {
      alignItems: 'center',
      marginVertical: 30,
    },
    emptyStateText: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      color: '#888',
      marginTop: 10,
    },
  });
  export default styles;