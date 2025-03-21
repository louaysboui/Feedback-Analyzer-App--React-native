import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 310,
    height: 250,
    resizeMode: 'contain',
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
