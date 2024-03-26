import { useEffect, useState } from "react"
// React Native
import { StyleSheet, Image, KeyboardAvoidingView, View } from "react-native"
import { TextInput, Text, Button, Icon } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
// Auth
import { useAuthStore } from "../store/store"
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth"
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../firebase"
import * as ScreenOrientation from "expo-screen-orientation"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import Loading from "../components/Loading"
import { Dropdown } from "react-native-element-dropdown"

export default () => {
  // Toggle Auth
  const updateAuth = useAuthStore((state) => state.updateAuth)
  // Form
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  // Form Settings
  const [loading, setLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<any>()
  // Dropdown Settings
  const [courts, setCourts] = useState<any>()

  // Screen Orientation + Fetch Courts
  useEffect(() => {
    const fetchCourts = async () => {
      setLoading(true)
      try {
        const ref = collection(FIRESTORE_DB, "courts")
        onSnapshot(query(ref, orderBy("created_date", "asc")), {
          next: (snapshot) => {
            setCourts(
              snapshot.docs.map((doc: any) => ({
                label: doc.data().court_name,
                value: doc.data().court_email,
              }))
            )
            setLoading(false)
          },
          error: (error: any) => {
            console.error(error)
          },
        })
      } catch (error: unknown) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)

    fetchCourts()
    return () => {
      ScreenOrientation.unlockAsync()
    }
  }, [])

  // Check Auth
  useEffect(() => {
    const authCheck = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      updateAuth(!!user)
    })

    return () => {
      authCheck()
    }
  }, [])

  // Sign In
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

  if (!courts) {
    return <Loading />
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.form}>
        <Image
          source={require("../../assets/icon/login_icon.png")}
          style={styles.logo}
        />
        <View style={styles.input_container}>
          <Dropdown
            style={styles.dropdown}
            data={courts}
            mode="default"
            labelField="label"
            valueField="value"
            placeholder="Select Court"
            onChange={(item) => {
              setEmail(item.value)
              setPassword(item.value.split("@")[0])
            }}
          />
        </View>
        <Button
          loading={loading}
          style={styles.button}
          labelStyle={{ fontSize: 16 }}
          mode="contained"
          onPress={signIn}
        >
          Continue
        </Button>
        <Text
          variant="bodyMedium"
          style={styles.link}
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
  dropdown: {
    borderRadius: 12,
    width: "100%",
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
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
  link: {
    color: "gray",
    marginTop: "-5%",
  },
  button: {
    marginVertical: "8%",
    width: "100%",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    marginBottom: "2%",
    color: "gray",
  },
})
