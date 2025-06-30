import { userAuth } from '@/Context/authContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
const slides = [
  require('../../assets/images/1image.png'),
  require('../../assets/images/2image.png'),
  require('../../assets/images/3image.png'),
];


export default function LoginScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const router = useRouter();

  const { loginWithOtp  , loginWithWhatsappOtp} = userAuth();

  const taglineText = (
    <>
      Medicine on <Text style={{ color: '#007E71' }}>10 minutes</Text> at your Doorstep
    </>
  );

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(input)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (!isChecked) {
      Alert.alert('Terms Not Accepted', 'You must accept the terms and privacy policy to continue.');
      return;
    }

    setLoading(true);
    await loginWithWhatsappOtp(input);
    setLoading(false);
  };

  const handleInputChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setInput(cleaned);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 25 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
       
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.topSection}>
            <FlatList
              ref={flatListRef}
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setCurrentIndex(index);
              }}
              renderItem={({ item }) => <Image source={item} style={styles.image} />}
              keyExtractor={(_, index) => index.toString()}
            />
            <View style={styles.pagination}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentIndex === index && styles.activeDot]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.push('/Login/medintro')}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <Text style={styles.tagline}>{taglineText}</Text>
          </View>

          <View style={styles.bottomCard}>
            <Text style={styles.mobileLabel}>Enter your Mobile Number</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={handleInputChange}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                placeholder="Enter phone number"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.otpButton}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.otpText}>Get OTP via Whatsapp</Text>
              )}
            </TouchableOpacity>

            <View style={styles.checkboxRow}>
              <View style={styles.checkboxBorder}>
                <Checkbox
                  status={isChecked ? 'checked' : 'unchecked'}
                  onPress={() => setIsChecked(!isChecked)}
                  color="#007E71"
                  uncheckedColor="#007E71"
                />
              </View>
              <Text style={styles.checkboxText}>
                By clicking, I accept the{' '}
                <Text style={styles.link} onPress={() => router.push('./t_and_c')}>
                  terms of services
                </Text>{' '}
                and{' '}
                <Text style={styles.link} onPress={() => router.push('./privacy')}>
                  privacy policy
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
        
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: hp('2%'),
    
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Platform.select({
      ios: hp('6%'),
      android: hp('4%')
      
    }),
    paddingBottom: hp('2%'),
  },
  image: {
    width: wp('100%'),
    resizeMode: 'contain',
    ...Platform.select({
      ios: { 
        height: hp('30%'),
        top: 30, },
      android: {
        height: hp('30%'),
        top:30
      }
    }),
  },
  pagination: {
    flexDirection: 'row',
    marginVertical: hp('1.5%'),
  },
  dot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#ccc',
    marginHorizontal: wp('1%'),
    ...Platform.select({
      ios: {
        top: 35
      },
      android: {
        top: 30
      }
    })
  },
  activeDot: {
    backgroundColor: '#007E71',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios'?60:50,
    right: 20,
    paddingVertical:5,
    paddingHorizontal:20,
    zIndex: 1,
  },
  skipText: {
    fontSize: hp('2%'),
    color: '#007E71',
    fontWeight: '600',
  },
  tagline: {
    fontSize: hp('2.5%'),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: hp('2%'),
    paddingHorizontal: wp('5%'),
    ...Platform.select({
      android: {
        fontSize: hp('2.3%'),
        top: 15,
      },
      ios: { 
        top: 35
      }
    }),
  },
  bottomCard: {
    backgroundColor: '#E5F2F1',
    borderTopLeftRadius: wp('8%'),
    borderTopRightRadius: wp('8%'),
    marginTop: hp('4%'),
    padding: wp('5%'),
    height: '65%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        top: 55
      },
      android: {
        elevation: 4,
        borderTopLeftRadius: wp('8%'),
        borderTopRightRadius: wp('8%'),
        top: 50
      }
    }),
  },
  mobileLabel: {
    fontSize: hp('2%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('1.5%'),
    marginLeft: wp('2%'),
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    height: hp('6%'),
    marginBottom: hp('2%'),
    ...Platform.select({
      android: {
        borderWidth: 0.5,
        borderColor: '#ddd',
        height: hp('5.5%'),
        
      },
      ios: {
      }
    }),
  },
  countryCode: {
    fontSize: hp('2%'),
    color: '#333',
    marginRight: wp('2%'),
  },
  input: {
    flex: 1,
    fontSize: hp('1.8%'),
    color: '#333',
    ...Platform.select({
      android: {
        paddingVertical: 0, 
      }
    }),
  },
  otpButton: {
    backgroundColor: '#007E71',
    borderRadius: wp('5%'),
    height: hp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      }
    }),
  },
  otpText: {
    color: 'white',
    fontSize: hp('2%'),
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  checkboxBorder: {
    borderWidth: 1,
    borderColor: '#007E71',
    borderRadius: wp('2%'),
  },
  checkboxText: {
    fontSize: hp('1.6%'),
    color: '#333',
    marginLeft: wp('2%'),
    flex: 1,
  },
  link: {
    color: '#007E71',
    textDecorationLine: 'underline',
  },
  // signupContainer: {
  //   backgroundColor: '#E5F2F1',
  //   paddingVertical: hp('2%'),
  //   alignItems: 'center',
  //   height:"100%",

  //   ...Platform.select({
  //     ios: {
  //       marginTop: 50
  //     },
  //     android: {
  //       marginTop: 50
  //     }
  //   })
  // },
  // signupText: {
  //   fontSize: hp('1.8%'),
  //   color: '#333',
  //   ...Platform.select({
  //     android: {
  //        marginTop: 40
  //     }
      
  //   })
   
  // },
//   signupLink: {
//     color: '#007E71',
//     fontWeight: '600',
//     textDecorationLine: 'underline',
//   },
});