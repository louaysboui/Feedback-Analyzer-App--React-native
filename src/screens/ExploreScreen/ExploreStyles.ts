import { StyleSheet } from 'react-native';

// Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 350,
    height: 380,
    resizeMode: 'contain',
  },
  logoSubText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0057D9',
    top: 90,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3b30ff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});