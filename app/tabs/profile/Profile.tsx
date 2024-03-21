import { ScrollView, StyleSheet, Text, View } from "react-native"
import { FIREBASE_AUTH } from "../../../firebase"
import { useAuthStore } from "../../store/store"
import { List } from "react-native-paper"

export default ({ navigation }: any) => {
  const updateAuth = useAuthStore((state) => state.updateAuth)

  const signOut = async () => {
    try {
      FIREBASE_AUTH.signOut()
      updateAuth(false)
    } catch (error: any) {
      console.error(error)
    }
  }
  return (
    <ScrollView>
      <View style={{ marginHorizontal: "4%", marginTop: "4%" }}>
        {FIREBASE_AUTH?.currentUser?.displayName && (
          <Text>User: {FIREBASE_AUTH.currentUser.displayName}</Text>
        )}
        <Text>Email: {FIREBASE_AUTH.currentUser.email}</Text>
      </View>
      <List.Section title="Details">
        <List.Item
          title="About Us"
          onPress={() => {
            navigation.navigate("About")
          }}
          left={(props: any) => (
            <List.Icon {...props} icon="information-outline" />
          )}
        />
      </List.Section>
      <List.Section title="Account">
        <List.Item
          title="Log Out"
          titleStyle={{ color: "red" }}
          onPress={signOut}
          left={(props: any) => (
            <List.Icon {...props} color="red" icon="logout" />
          )}
        />
      </List.Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({})
