import { StyleSheet, Text, View } from "react-native"
import LottieView from "lottie-react-native"
import BadmintonLoader from "../../assets/animations/badminton.json"

export default () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LottieView
        source={BadmintonLoader}
        autoPlay
        loop
        style={{ height: "70%", width: "80%" }}
      />
    </View>
  )
}

const styles = StyleSheet.create({})
