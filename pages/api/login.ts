import Openfort from "@openfort/openfort-node";
import axios from "axios";

const openfort = new Openfort(process.env.NEXTAUTH_OPENFORT_SECRET_KEY!);

async function fetchUserInfo(user_uuid: string, idToken: string) {
  const response = await axios.post(
    "https://api.particle.network/server/rpc",
    { jsonrpc: "2.0", id: 0, method: "getUserInfo", params: [user_uuid, idToken] },
    { auth: { username: process.env.NEXT_PUBLIC_PROJECT_ID!, password: process.env.PARTICLE_SECRET_PROJECT_ID! } }
  );
  return response.data.result;
}

export default async function handler(req, res) {
  try {
    const idToken = req.headers.authorization?.split(" ")[1] || "";
    const { user_uuid } = req.body;

    const { uuid, googleEmail: email, wallets } = await fetchUserInfo(user_uuid, idToken);
    const evm_wallet = wallets.find(wallet => wallet.chain === "evm_chain");

    if (uuid === user_uuid) {
      const playerAccountAddress = await openfort.players.create({
        name: email,
        description: evm_wallet.publicAddress,
      });

      if (playerAccountAddress) {
        console.log("Player found.", playerAccountAddress);
        res.status(200).json({ name: "Validation Success. Player created.", player: playerAccountAddress.id });
      } else {
        res.status(400).json({ name: "Failed creating account" });
      }
    } else {
      res.status(400).json({ name: "Failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}