// Import the required polyfills
import "./polyfills";
import "react-native-get-random-values";

// Import Viem Client
import { createPublicClient, http, zeroAddress } from "viem";

// Import ZeroDev SDK
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";

// Generate signer with Viem
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Chain
import { sepolia } from "viem/chains";

// React
import { useState } from "react";

// React Native
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  // State
  const [txState, setTxState] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${process.env.EXPO_PUBLIC_ZERODEV_ID}`;
  const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${process.env.EXPO_PUBLIC_ZERODEV_ID}`;

  const chain = sepolia;
  const entryPoint = ENTRYPOINT_ADDRESS_V07;

  const main = async () => {
    // Construct a signer
    const privateKey = generatePrivateKey();
    const signer = privateKeyToAccount(privateKey);

    // Construct a public client
    const publicClient = createPublicClient({
      transport: http(BUNDLER_RPC),
    });

    // Construct a validator
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
      entryPoint,
    });

    // Construct a Kernel account
    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
      entryPoint,
    });

    // Construct a Kernel account client
    const kernelClient = createKernelAccountClient({
      account,
      chain,
      entryPoint,
      bundlerTransport: http(BUNDLER_RPC),
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          const zerodevPaymaster = createZeroDevPaymasterClient({
            chain,
            entryPoint,
            transport: http(PAYMASTER_RPC),
          });
          return zerodevPaymaster.sponsorUserOperation({
            userOperation,
            entryPoint,
          });
        },
      },
    });

    // Set wallet address
    setWalletAddress(kernelClient.account.address);
    console.log("My account:", walletAddress);

    // Send User Operation
    console.log("Sending UserOp...");
    const userOpHash = await kernelClient.sendUserOperation({
      userOperation: {
        callData: await account.encodeCallData({
          to: zeroAddress,
          value: BigInt(0),
          data: "0x",
        }),
      },
    });

    setTxState(userOpHash);
    console.log("userOp hash:", userOpHash);
    console.log("View your tx:", `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zero Dev Expo Starter</Text>

      <Text style={styles.title}>Wallet Address: {walletAddress}</Text>

      <Text style={styles.title}>Tx Hash: {txState}</Text>

      <Button title="Send User Operation" onPress={main} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
