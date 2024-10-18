import "@/styles/globals.css";
import Head from "next/head";
import Simulator from "components/Simulator";

export default function App({ Component, pageProps }) {
  return (
    <div className="bg-[radial-gradient(_var(--tw-gradient-stops))] from-green-200 via-green-300 to-green-400 h-screen overflow-auto">
      <Head>
        <title>MDP Algorithm Simulator</title>
      </Head>
      <Simulator />
    </div>
  );
}
