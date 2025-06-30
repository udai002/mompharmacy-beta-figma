import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";
import { userAuth } from "../../Context/authContext";
import { sendSmsOtp } from "../../lib/otp";

const slides = [
  require("../../assets/images/1image.png"),
  require("../../assets/images/2image.png"),
  require("../../assets/images/3image.png"),
];

export default function OtpScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { verifyOtp , verifyWhatsappOtp } = userAuth();
  const params = useLocalSearchParams();
  const user = params.user;
  const isRegistration = params.isRegistration === "true";
  const [loader, setShowLoader] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(intervalId);
  }, [timer]);

  useEffect(() => {
    const autoScroll = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);
    return () => clearInterval(autoScroll);
  }, [currentIndex]);

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    setShowLoader(true);
    try {
      const data = await verifyWhatsappOtp(fullOtp, user);
      if (data) {
        if (data.isExist) {
          router.replace("/Login/medintro");
        } else {
          router.replace("/Login/signup");
        }
      } else {
        Alert.alert("Invalid OTP", "Please try again.");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify OTP.");
    } finally {
      setShowLoader(false);
    }
  };

  const handleResendOtp = async () => {
    if (canResend) {
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setCanResend(false);
      try {
        await sendSmsOtp(typeof user === "string" ? user : user[0]);
        Alert.alert("OTP Resent", "A new OTP has been sent to your phone");
      } catch (error) {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
        setCanResend(true);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <FlatList
              ref={flatListRef}
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x /
                    e.nativeEvent.layoutMeasurement.width
                );
                setCurrentIndex(index);
              }}
              renderItem={({ item }) => (
                <Image source={item} style={styles.logo} />
              )}
              keyExtractor={(_, index) => index.toString()}
            />
            <View style={styles.pagination}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index ? styles.activeDot : null,
                  ]}
                />
              ))}
            </View>

            <View style={styles.bottomCard}>
              <Text style={styles.heading}>Almost there!</Text>
              <Text style={styles.subtext}>Enter the secret code</Text>
              <Text style={styles.otpSent}>OTP sent via SMS to {user}</Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.otpBox}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>
                  {canResend ? "" : `Wait for ${timer}s to `}
                </Text>
                <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
                  <Text
                    style={[styles.resendText, !canResend && { opacity: 0.5 }]}
                  >
                    Resend the OTP
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                style={styles.verifyButton}
              >
                {loader ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 90,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  logo: {
    width: 370,
    height: 300,
    resizeMode: "contain",
    marginBottom: 10,
  },
  pagination: {
    flexDirection: "row",
    marginTop: 10,
    bottom: 10,
  },
  dot: {
    height: 10,
    width: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#007E71",
  },
  bottomCard: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtext: {
    fontSize: 22,
    color: "black",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
    bottom: 9,
  },
  otpSent: {
    fontSize: 13,
    color: "#777",
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 40,
    height: 50,
    borderRadius: 5,
    backgroundColor: "#d5ece9",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
    flexWrap: "wrap",
  },
  resendText: {
    fontSize: 14,
    color: "#007AFF",
  },
  verifyButton: {
    backgroundColor: "#007E71",
    paddingVertical: 15,
    width: 350,
    borderRadius: 30,
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  verifyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
