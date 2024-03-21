import { useEffect, useState } from "react"
// React Native
import { StyleSheet, Image, KeyboardAvoidingView, View } from "react-native"
import { TextInput, Text, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
// Auth
import { useAuthStore } from "../store/store"
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth"
import { FIREBASE_AUTH } from "../../firebase"
import { theme } from "../theme/theme"
import { useFonts } from "expo-font"

export default () => {
  // Toggle Auth
  const updateAuth = useAuthStore((state) => state.updateAuth)
  // Form
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [hidePassword, setHidePassword] = useState<boolean>(true)
  // Form Settings
  const [loading, setLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<any>()
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../assets/fonts/Inter.ttf"),
  })

  useEffect(() => {
    const authCheck = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      updateAuth(!!user)
    })

    return () => {
      authCheck()
    }
  }, [])

  const signIn = async () => {
    setLoading(true)
    try {
      const response = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      )
      updateAuth(true)
    } catch (error: unknown) {
      if (error) {
        setIsError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.form}>
        <Image
          source={require("../../assets/icon/login_icon.png")}
          style={styles.logo}
        />
        <View style={styles.input_container}>
          <TextInput
            label="Email"
            mode="flat"
            disabled={loading}
            error={isError}
            theme={{ roundness: 12 }}
            underlineStyle={{ display: "none" }}
            onChangeText={setEmail}
            style={{ ...styles.input, fontFamily: "Inter" }}
          />
          <TextInput
            label="Password"
            mode="flat"
            disabled={loading}
            error={isError}
            secureTextEntry={hidePassword}
            onChangeText={setPassword}
            theme={{ roundness: 12 }}
            underlineStyle={{ display: "none" }}
            right={
              <TextInput.Icon
                style={{ paddingTop: 4 }}
                icon={hidePassword ? "eye-off" : "eye"}
                color={hidePassword ? "gray" : theme.colors.primary}
                onPress={() => setHidePassword((state) => !state)}
              />
            }
            style={styles.input}
          />
        </View>
        <Button
          loading={loading}
          style={styles.button}
          labelStyle={{ fontSize: 16, fontFamily: "Inter" }}
          mode="contained"
          onPress={signIn}
        >
          Log In
        </Button>
        <Text
          variant="bodyMedium"
          style={{
            color: "gray",
            marginTop: "-5%",
            fontFamily: "Inter",
          }}
          onPress={() => alert("Please contact the control room.")}
        >
          Need Help?
        </Text>
      </KeyboardAvoidingView>
      <Text style={styles.footer}>© 2024 | C-ONE Development Team</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "whitesmoke",
  },
  form: {
    width: "80%",
    display: "flex",
    alignItems: "center",
  },
  logo: {
    objectFit: "contain",
    width: "100%",
    height: "42%",
    marginBottom: "-5%",
  },
  input_container: {
    width: "100%",
    display: "flex",
    gap: 15,
    paddingTop: 18,
  },
  input: {
    borderRadius: 12,
    width: "100%",
    backgroundColor: "#E6E6E6",
    paddingBottom: 4,
  },
  label: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  button: {
    marginVertical: "8%",
    width: "100%",
    fontFamily: "Inter",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    marginBottom: "2%",
    color: "gray",
    fontFamily: "Inter",
  },
})
