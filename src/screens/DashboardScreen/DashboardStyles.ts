import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    scrollContentContainer: {
      padding: 10,
      paddingBottom: 80, // Extra bottom padding so charts or content won't be hidden by the tab
    },
    containerCentered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    noDataText: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      color: Colors.text,
      textAlign: 'center',
      marginHorizontal: 20,
    },
    sectionCard: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      elevation: 2, // for Android shadow
      shadowColor: '#000', // for iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      fontFamily: 'Poppins-Bold',
      color: Colors.primary,
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      marginHorizontal: 10,
    },
    statText: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: Colors.text,
      marginTop: 5,
    },
    chart: {
      height: 220,
      marginTop: 10,
    },
  });
  export default styles;