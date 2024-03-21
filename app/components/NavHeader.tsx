import { View, StyleSheet } from "react-native"
import { Button, Text } from "react-native-paper"

export default ({ action, title, navigate }) => {
  return (
    <View style={styles.header}>
      <Button icon="keyboard-backspace" onPress={() => navigate()}>
        Back
      </Button>
      {!!(action && title) && (
        <Button mode="contained" buttonColor="green">
          {title}
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "1%",
  },
})
