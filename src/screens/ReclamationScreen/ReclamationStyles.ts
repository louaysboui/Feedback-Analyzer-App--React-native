import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';


const ReclamationStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    color:Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  dropdown: {
    height: 50,
    width: '100%',
  },
  textArea: {
    fontSize:15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  radioButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 25,
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
    backgroundColor: Colors.lightred,
  },
  selectedLabel: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    
  },
});

export default ReclamationStyles;