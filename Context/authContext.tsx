import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import LoadingScreen from "../components/LoadingScreen";
import apiClient from "../utils/apiClient";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const isRegistrationComplete = userDetails?.name && userDetails?.email && userDetails?.mobileNo;

  const getUserDetails = useCallback(async (authToken) => {
    try {
      if (!authToken) throw new Error("Token not found! you are not loggedin");
      const response = await apiClient('api/user/user-details', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response) {
        setUserDetails(response.userDetails);
      } else {
        console.error('Failed to fetch user details');
        Alert.alert('Error', 'Failed to fetch user details. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to fetch user details. Please try again.');
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('jwt_token');
        if (storedToken) {
          const parsedToken = JSON.parse(storedToken);
          setToken(parsedToken);
          setIsLoggedIn(true);
          await getUserDetails(parsedToken);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        Alert.alert('Error', 'Failed to check user status. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [getUserDetails]);

  const loginWithOtp = async (mobileNo) => {
    try {
      const response = await apiClient('api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNo }),
      });

      if (response) {
        router.replace({ pathname: '/Login/otp', params: { user: mobileNo } });
        console.log('Login successful:', response);
      } else {
        Alert.alert('Login failed!', 'Unable to login. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp, mobileNo) => {
    try {
      const response = await apiClient('api/user/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, mobileNo }),
      });

      if (response) {
        await AsyncStorage.setItem('jwt_token', JSON.stringify(response.token));
        setToken(response.token);
        setIsLoggedIn(true);
        await getUserDetails(response.token);
        console.log('OTP verified:', response);
        return response;
      } else {
        Alert.alert('OTP verification failed', 'Invalid OTP. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      Alert.alert('An error occurred during OTP verification. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      setToken(null);
      setIsLoggedIn(false);
      setUserDetails(null);
      router.replace('/Login/Login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'An error occurred during logout. Please try again.');
    }
  };

  const postData = async (name, dob, gender) => {
    try {
      const storedToken = await AsyncStorage.getItem("jwt_token");
      const parsedToken = JSON.parse(storedToken);

      const response = await apiClient('api/user/register', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parsedToken}`
        },
        body: JSON.stringify({
          name,
          dateOfBirth: dob,
          gender
        })
      });

      if (response) {
        console.log("User successfully registered");
        await getUserDetails(parsedToken);
      } else {
        console.error("Registration failed");
        Alert.alert("Registration Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Network Error", "Failed to register. Check your internet or server.");
    }
  };

  const ExtractParseToken = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt_token");
      if (!token) throw new Error("No token found");
      return JSON.parse(token);
    } catch (error) {
      console.error("Error extracting token:", error);
      return null;
    }
  };

  // login with whatsapp otp
  async function loginWithWhatsappOtp(mobileNo) {
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mobileNo })
      }
      const response = await apiClient("api/user/whatsapp-otp", options)
      if (response) {
        router.replace({ pathname: '/Login/otp', params: { user: mobileNo } });
      } else {
        Alert.alert("Invalid Otp")
      }
    } catch (error) {
      console.log(error)
    }
  }

  //verify with whatsapp otp
  async function verifyWhatsappOtp(otp, mobileNo) {
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mobileNo, otp })
      }
      const response = await apiClient("api/user/whatapp-otp-verification", options)
      if (response) {
        await AsyncStorage.setItem('jwt_token', JSON.stringify(response.token));
        setToken(response.token);
        setIsLoggedIn(true);
        await getUserDetails(response.token);
        console.log('OTP verified:', response);
        return response;
      } else {
        Alert.alert('OTP verification failed', 'Invalid OTP. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      Alert.alert('An error occurred during OTP verification. Please try again.');
      return false;
    }
  }


  return (
    <AuthContext.Provider value={{
      loginWithOtp,
      verifyOtp,
      logout,
      isLoggedIn,
      loading,
      userDetails,
      isRegistrationComplete,
      getUserDetails,
      postData,
      ExtractParseToken,
      loginWithWhatsappOtp,
      verifyWhatsappOtp
    }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const userAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("Error in login context");
  return context;
};