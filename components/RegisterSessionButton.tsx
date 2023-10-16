import React, { useState } from "react";
import Openfort from "@openfort/openfort-js";
import { toast } from "react-toastify";
import RPC from "./evm.ethers";

const openfort = new Openfort(process.env.NEXT_PUBLIC_OPENFORT_PUBLIC_KEY!);

export const RegisterButton = ({ provider, particle, uiConsole, logout, playerId }) => {
    const [loading, setLoad] = useState(false);

    const handleReg = async () => {
        let openfortResp, toastId, auth = particle.auth.getUserInfo();
        if (!provider) return;

        openfort.createSessionKey();
        await openfort.saveSessionKey();

        toastId = toast.loading("Registering...");

        const res = await fetch("/api/register-session", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({ user_uuid: auth.uuid, sessionPubKey: openfort.sessionKey.address, player: playerId }),
        });
        const json = await res.json();

        if (json.data?.nextAction) {
            const rpc = new RPC(provider);
            openfortResp = await openfort.sendSignatureSessionRequest(json.data.id, await rpc.signMessage(json.data.nextAction.payload.userOpHash));
            if (openfortResp) toast.success("Registered successfully");
        } else {
            toast.error("Registration failed");
            logout();
        }

        uiConsole(openfortResp);
        setLoad(false);
        toast.dismiss(toastId);
    };

    return <button className="card" disabled={loading} onClick={handleReg}>{loading ? "Registering..." : "Register Session"}</button>;
};