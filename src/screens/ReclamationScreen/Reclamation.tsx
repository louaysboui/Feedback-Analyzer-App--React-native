import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ReclamationStyles from './ReclamationStyles';

const Reclamation = () => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');

  const handleSubmit = () => {
    console.log('Issue Type:', issueType);
    console.log('Description:', description);
    console.log('Severity:', severity);
    // Here you would typically send the data to Supabase
  };

  return (
    <View style={ReclamationStyles.container}>
      <Text style={ReclamationStyles.header}>Report an Issue</Text>

      <Text style={ReclamationStyles.label}>Type of Issue</Text>
      <View style={ReclamationStyles.dropdownContainer}>
        <Picker
          selectedValue={issueType}
          onValueChange={(itemValue) => setIssueType(itemValue)}
          style={ReclamationStyles.dropdown}
        >
          <Picker.Item label="Select an issue type" value="" />
          <Picker.Item label="Bug" value="bug" />
          <Picker.Item label="Performance" value="performance" />
          <Picker.Item label="UI/UX" value="uiux" />
          <Picker.Item label="Feature Request" value="feature" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <Text style={ReclamationStyles.label}>Description</Text>
      <TextInput
        style={ReclamationStyles.textArea}
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the issue in detail"
      />

      <Text style={ReclamationStyles.label}>Severity</Text>
      <View style={ReclamationStyles.radioGroup}>
        {['Minor', 'Moderate', 'Critical'].map((sev) => (
          <TouchableOpacity
            key={sev}
            style={[
              ReclamationStyles.radioButton,
              severity === sev && ReclamationStyles.selectedRadioButton,
            ]}
            onPress={() => setSeverity(sev)}
          >
            <Text style={severity === sev ? ReclamationStyles.selectedLabel : ReclamationStyles.label}>
              {sev}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={ReclamationStyles.submitButton} onPress={handleSubmit}>
        <Text style={ReclamationStyles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Reclamation;