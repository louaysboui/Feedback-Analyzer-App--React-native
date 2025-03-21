import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from "../../../lib/supabase"; // Adjust the path as necessary
import ReclamationStyles from './ReclamationStyles';

const Reclamation = () => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');

  const handleSubmit = async () => {
    // Validate that all fields are filled
    if (!issueType || !description || !severity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit a reclamation');
        return;
      }

      // Insert the reclamation data into the Supabase table
      const { data, error } = await supabase
        .from('reclamations') // Ensure this matches your Supabase table name
        .insert([
          {
            user_id: user.id, // Associate the reclamation with the authenticated user
            issue_type: issueType,
            description: description,
            severity: severity,
          },
        ]);

      if (error) throw error;

      // Show success message and clear the form
      Alert.alert('Success', 'Reclamation submitted successfully');
      setIssueType('');
      setDescription('');
      setSeverity('');
    } catch (error) {
      // Handle errors and provide feedback
      if (error instanceof Error) {
        console.error('Error submitting reclamation:', error.message);
      } else {
        console.error('Error submitting reclamation:', error);
      }
      Alert.alert('Error', 'Failed to submit reclamation. Please try again.');
    }
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