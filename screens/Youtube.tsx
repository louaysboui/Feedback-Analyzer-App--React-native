import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

const channel = {
  url: "https://www.youtube.com/@jaidenanimations/about",
  handle: "@jaidenanimations",
  banner_img: "https://yt3.googleusercontent.com/9b5DW0WsoUtzke1Q54ARDE26FqU4FXAgjnWKEihmDCgYAu2ZLN8qLhvD1WjQT-lFjDbg43HsHQ=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj",
  profile_image: "https://yt3.googleusercontent.com/6uDu4HmbcorfDWch6L4FAzv-DFMOstOwhTks-5VUm-kY5puZ_oU4EeA1YOqEM_EDvCTj3UPUW68=s160-c-k-c0x00ffffff-no-rj",
  name: "JaidenAnimations",
  subscribers: 14300000,
  Description: "hi it's jaiden and bird\n\nchannel profile picture made by: me\nchannel banner art made by: https://twitter.com/motiCHIKUBI\n",
  videos_count: 167,
  views: 2797022968,
  Details: {
    location: "United States"
  },
  Links: [
    "https://jaidenanimations.com",
    "https://twitch.tv/jaidenanimations",
    "https://twitter.com/JaidenAnimation",
    "https://instagram.com/jaiden_animations"
  ],
};

type YoutubeScreenRouteProp = RouteProp<RootStackParamList, 'Youtube'>;

type Props = {
  route: YoutubeScreenRouteProp;
};

const Youtube: React.FC<Props> = ({ route }) => {
  const { channelUrl } = route.params;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Banner Image */}
      <Image source={{ uri: channel.banner_img }} style={{ width: '100%', height: 150 }} resizeMode="cover" />

      {/* Profile Section */}
      <View style={{ alignItems: 'center', marginTop: -50 }}>
        <Image source={{ uri: channel.profile_image }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white' }} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>{channel.name}</Text>
        <Text style={{ color: 'gray' }}>{channel.handle}</Text>
        <Text style={{ color: 'gray', marginTop: 5 }}>{channel.subscribers.toLocaleString()} subscribers • {channel.videos_count} videos</Text>
        <Text style={{ color: 'gray', fontSize: 12 }}>Location: {channel.Details.location}</Text>
      </View>

      {/* Description */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>About</Text>
        <Text style={{ color: 'gray', marginTop: 5 }}>{channel.Description}</Text>
      </View>

      {/* Social Links */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Links</Text>
        {channel.Links.map((link, index) => (
          <TouchableOpacity key={index} onPress={() => Linking.openURL(link)}>
            <Text style={{ color: 'blue', marginTop: 5 }}>{link}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default Youtube;