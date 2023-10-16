import * as React from "react";
import Openfort from "@openfort/openfort-js";
import { toast } from "react-toastify";
import RPC from "./evm.ethers";

const openfort = new Openfort(process.env.NEXT_PUBLIC_OPENFORT_PUBLIC_KEY!);

export function CollectButton({ provider, particle, uiConsole, logout, playerId }) {
    const [collectLoading, setCollectLoading] = React.useState(false);

    const handleCollectButtonClick = async () => {
        let openfortTransactionResponse;
        try {
            if (!provider) return uiConsole("provider not initialized yet");

            const authInfo = particle.auth.getUserInfo();
            let toastId = toast.loading("Collecting item...");

            const res = await fetch("/api/collect-asset", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authInfo.token}` },
                body: JSON.stringify({ user_uuid: authInfo.uuid, player: playerId }),
            });

            const { data } = await res.json();
            toast.dismiss(toastId);

            if (!data?.nextAction) {
                toast.error("JWT Verification Failed");
                return await logout();
            }

            const payload = data.nextAction.payload.userOpHash;
            const sessionKeyLoaded = await openfort.loadSessionKey();
            const signedTransaction = sessionKeyLoaded ? openfort.signMessage(payload) :
                await new RPC(provider!).signMessage(payload);

            toastId = toast.loading(sessionKeyLoaded ? "Session Key Waiting for Signature" : "Owner Key Waiting for Signature");

            openfortTransactionResponse = await openfort.sendSignatureTransactionIntentRequest(data.id, signedTransaction);
            toast.dismiss(toastId);

            if (openfortTransactionResponse) toast.success("Item Collected Successfully");

            return { data };
        } catch (error) {
            console.error("Error:", error);
        } finally {
            uiConsole(openfortTransactionResponse);
            setCollectLoading(false);
        }
    };

    return (
        <div>
            <button className="card" type="button" disabled={collectLoading} onClick={handleCollectButtonClick}>
                {collectLoading ? "Minting..." : "Mint NFT"}
            </button>
        </div>
    );
}