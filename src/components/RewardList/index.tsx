"use client";

import { useContractWrite, useNetwork } from "wagmi";
import { useEffect, useState } from "react";
import getGasCost from "helpers/getGasPrice";
import getUsdPrices from "helpers/getUsdPrices";
import Quest from "../Quest";
import styles from "@/styles/RewardList.module.css";

import "helpers/getGasPrice";

function RewardList({ address }) {
   const [quests, setQuests] = useState([]);
   const [selectedQuests, setSelectedQuests] = useState([]);
   const [gasCost, setGasCost] = useState(0);
   const [ethPrice, setETHPrice] = useState(0);
   const { chain } = useNetwork();

   useEffect(() => {
      fetch("/api/rewards?address=" + address)
         .then((response) => response.json())
         .then(({ data, eth_price }) => {
            setQuests(data);
            setETHPrice(eth_price);
         })
         .catch((error) => console.log(error));
      getGasCost().then((gasCost) => setGasCost(gasCost));
   }, [address]);

   const handleSelect = (quest) => {
      setSelectedQuests((prev) =>
         prev.some((q) => q.id === quest.questId)
            ? prev.filter((q) => q.id !== quest.questId)
            : [
                 ...prev,
                 {
                    id: quest.questId,
                    contract: quest.contractAddress,
                    chain: quest.reward.network.chainId
                 }
              ]
      );
   };

   const { write, isLoading, isSuccess, data } = useContractWrite({
      abi: [
         {
            inputs: [],
            name: "claim",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
         }
      ],
      functionName: "claim"
   });

   const handleButtonClick = async () => {
      for (let quest of selectedQuests) {
         if (quest.contract && write) {
            await write({
               address: quest.contract,
               chainId: parseInt(quest.chain),
               args: []
            });
         }
      }
   };

   const chooseAll = () => {
      setSelectedQuests(() => {
         const selected = [];
         for (const quest of quests) {
            selected.push({
               id: quest.questId,
               contract: quest.contractAddress,
               chain: quest.reward.network.chainId
            });
         }
         return selected;
      });
   };

   const resetChoices = () => {
      setSelectedQuests(() => []);
   };

   const unclaimedRewards = quests
      .filter(
         (quest) => !quest.claimed && parseInt(quest.reward.network.chainId) === chain.id
      )
      .reduce((a, b) => {
         return b.reward.token.usdValue * b.reward.amount + a;
      }, 0)
      .toFixed(2);

   const gasCostTotal = (
      (gasCost / 10 ** 18) *
      ethPrice *
      quests.filter((q) => !q.claimed && parseInt(q.reward.network.chainId) === chain.id)
         .length
   ).toFixed(2);

   return (
      <div>
         <button onClick={handleButtonClick} disabled={isLoading}>
            Claim
         </button>
         <div style={{ color: "white" }}>
            Number Of Rewards To Claim:{" "}
            {
               quests.filter(
                  (q) => !q.claimed && parseInt(q.reward.network.chainId) === chain.id
               ).length
            }
         </div>
         <div style={{ color: "white" }}>
            Estimated Gas Cost Per Claim: ~${+((gasCost / 10 ** 18) * ethPrice).toFixed(3)}{" "}
            USD
         </div>
         <div style={{ color: "white" }}>
            Total Value of Selected Rewards: ${unclaimedRewards} USD
         </div>
         <div style={{ color: "white" }}>
            Gas Cost To Claim Selected Rewards: ~${gasCostTotal} USD
         </div>
         <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={chooseAll}>Choose All</button>
            <button onClick={resetChoices}>Reset</button>
         </div>
         <div className={styles["reward-list"]}>
            {quests
               .filter((q) => !q.claimed && parseInt(q.reward.network.chainId) === chain.id)
               .sort(
                  (a, b) =>
                     b.reward.token.usdValue * b.reward.amount -
                     a.reward.token.usdValue * a.reward.amount
               )
               .map((quest) => (
                  <Quest
                     key={quest.questId}
                     quest={quest}
                     onSelect={handleSelect}
                     selected={selectedQuests.some((q) => q.id === quest.questId)}
                  />
               ))}
         </div>
      </div>
   );
}

export default RewardList;
