import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export function promptProfilePhoto({ hasPhoto, onPicked, onRemoved }) {
  const buttons = [
    { text: 'Choose from library', onPress: () => pickFromLibrary(onPicked) },
    { text: 'Take a photo', onPress: () => takePhoto(onPicked) },
  ];

  if (hasPhoto) {
    buttons.push({
      text: 'Remove photo',
      style: 'destructive',
      onPress: onRemoved,
    });
  }

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Profile photo', 'Upload a photo from your library or camera.', buttons, {
    cancelable: true,
  });
}

async function pickFromLibrary(onPicked) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo access to set your profile picture.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync(OPTIONS);
  if (!result.canceled && result.assets?.[0]?.uri) {
    onPicked(result.assets[0].uri);
  }
}

async function takePhoto(onPicked) {
  if (Platform.OS === 'web') {
    Alert.alert('Not available', 'Camera is not available on web. Choose a photo from your library instead.');
    return;
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
    return;
  }

  const result = await ImagePicker.launchCameraAsync(OPTIONS);
  if (!result.canceled && result.assets?.[0]?.uri) {
    onPicked(result.assets[0].uri);
  }
}
