"use client";
import Header from "@/components/Header";
import RewardList from "@/components/RewardList";
import { useAccount } from "wagmi";

function Page() {

   const { address, isConnected } = useAccount();

   return (
      <>
         <Header/>
         { isConnected && <RewardList address={address} /> }
         
         
      </>
   );
}

export default Page;
