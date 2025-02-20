import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'

//navigation
import {NativeStackNavigationProp, NativeStackScreenProps}from "@react-navigation/native-stack";
import { RootStackParamList } from '../App';
import { useNavigation } from '@react-navigation/native';

type detailsProps = NativeStackScreenProps<RootStackParamList,'details'>


export default function details({route}:detailsProps) {
  const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <View style={styles.container}>
      <Text>Details :</Text>
      <Button
      title="Go to Details"
        onPress={() => navigation.goBack()}
      />
    </View>
  )
}

const styles = StyleSheet.create({

    container :{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
        
            },
            smalltext:{
        
                color:"#000000"
        
            }
})