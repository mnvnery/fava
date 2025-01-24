"use client";

import { useState } from "react";

export default function FetchRecommendations() {
  const [status, setStatus] = useState("Idle");

  // List of gene-drug pairs
  const geneDrugPairs = [
    // { gene: "CYP2B6", drug: "efavirenz" },
    // { gene: "CYP2C19", drug: "amitriptyline" },
     { gene: "CYP2C19", drug: "citalopram" },
    // { gene: "CYP2C19", drug: "clopidogrel" },
    // { gene: "CYP2C19", drug: "escitalopram" },
    // { gene: "CYP2C19", drug: "lansoprazole" },
    // { gene: "CYP2C19", drug: "omeprazole" },
    // { gene: "CYP2C19", drug: "pantoprazole" },
    // { gene: "CYP2C19", drug: "sertraline" },
    // { gene: "CYP2C19", drug: "voriconazole" },
    // { gene: "CYP2C9", drug: "celecoxib" },
    // { gene: "CYP2C9", drug: "flurbiprofen" },
    // { gene: "CYP2C9", drug: "fluvastatin" },
    // { gene: "CYP2C9", drug: "fosphenytoin" },
    // { gene: "CYP2C9", drug: "ibuprofen" },
    // { gene: "CYP2C9", drug: "lornoxicam" },
    // { gene: "CYP2C9", drug: "meloxicam" },
    // { gene: "CYP2C9", drug: "phenytoin" },
    // { gene: "CYP2C9", drug: "piroxicam" },
    // { gene: "CYP2C9", drug: "siponimod" },
    // { gene: "CYP2C9", drug: "tenoxicam" },
    // { gene: "CYP2C9", drug: "warfarin" },
    // { gene: "CYP2D6", drug: "amitriptyline" },
    // { gene: "CYP2D6", drug: "atomoxetine" },
    // { gene: "CYP2D6", drug: "codeine" },
    // { gene: "CYP2D6", drug: "nortriptyline" },
    // { gene: "CYP2D6", drug: "ondansetron" },
    // { gene: "CYP2D6", drug: "paroxetine" },
    // { gene: "CYP2D6", drug: "pitolisant" },
    // { gene: "CYP2D6", drug: "tamoxifen" },
    // { gene: "CYP2D6", drug: "tramadol" },
    // { gene: "CYP2D6", drug: "tropisetron" },
    // { gene: "CYP2D6", drug: "vortioxetine" },
    // { gene: "CYP3A5", drug: "tacrolimus" },
    // { gene: "SLCO1B1", drug: "atorvastatin" },
    // { gene: "SLCO1B1", drug: "fluvastatin" },
    // { gene: "SLCO1B1", drug: "lovastatin" },
    // { gene: "SLCO1B1", drug: "pitavastatin" },
    // { gene: "SLCO1B1", drug: "pravastatin" },
    // { gene: "SLCO1B1", drug: "rosuvastatin" },
    // { gene: "SLCO1B1", drug: "simvastatin" },
    // { gene: "VKORC1", drug: "warfarin" }
];


  // Fetch the `drugId` for a specific drug
  async function fetchDrugId(drug: string) {
    const response = await fetch(
      `https://api.cpicpgx.org/v1/drug?name=eq.${encodeURIComponent(drug)}`
    );
    if (!response.ok) throw new Error(`Error fetching drugId for ${drug}`);
    const data = await response.json();
    if (data.length === 0) throw new Error(`No drugId found for ${drug}`);
    return data[0].drugid; // Assuming `drugid` is the correct field
  }

  // Filter out duplicates by phenotype
function deduplicateLookupKeys(lookupKeys: Array<{ phenotype: string; lookupKey: Record<string, string> }>) {
  const uniquePhenotypes = new Set();
  return lookupKeys.filter(({ phenotype }) => {
    if (uniquePhenotypes.has(phenotype)) {
      return false; // Skip if the phenotype is already in the Set
    }
    uniquePhenotypes.add(phenotype);
    return true; // Include if it's unique
  });
}


  // Fetch all `lookupKey` values for a gene
  async function fetchLookupKeys(gene: string) {
    const response = await fetch(
      `https://api.cpicpgx.org/v1/diplotype?genesymbol=eq.${gene}&select=lookupkey,generesult`
    );
    if (!response.ok) throw new Error(`Error fetching lookupKeys for ${gene}`);
    const data = await response.json();
  
    if (data.length === 0) throw new Error(`No lookupKeys found for ${gene}`);
  
    // Deduplicate based on phenotype
    const deduplicatedKeys = deduplicateLookupKeys(
      data.map((item: any) => ({
        phenotype: item.generesult,
        lookupKey: item.lookupkey,
      }))
    );
  
    // console.log(`Deduplicated LookupKeys for ${gene}:`, deduplicatedKeys);
    return deduplicatedKeys;
  }
  

  // Fetch recommendations for a specific drugId and lookupKey
  async function fetchRecommendations(drugId: string, lookupKey: Record<string, string>) {
    const lookupKeyJSON = encodeURIComponent(JSON.stringify(lookupKey));
    const response = await fetch(
      `https://api.cpicpgx.org/v1/recommendation?select=drug(name),guideline(name),implications,drugrecommendation,classification,comments,phenotypes,lookupkey&drugid=eq.${drugId}&lookupkey=cs.${lookupKeyJSON}`
    );
    if (!response.ok)
      throw new Error(
        `Error fetching recommendations for drugId ${drugId} with lookupKey ${JSON.stringify(
          lookupKey
        )}`
      );
    return response.json();
  }

  // Main function to fetch and print results
  async function fetchAndPrintResults() {
    setStatus("Fetching...");
    try {
      for (const { gene, drug } of geneDrugPairs) {
        console.log(`Processing ${gene} - ${drug}`);

        // Step 1: Fetch the drugId
        const drugId = await fetchDrugId(drug);
        console.log(`DrugId for ${drug}:`, drugId);

        // Step 2: Fetch all lookupKeys for the gene
        const lookupKeys = await fetchLookupKeys(gene);
        console.log(`LookupKeys for ${gene}:`, lookupKeys);

        // Step 3: Fetch recommendations for each lookupKey
        for (const { phenotype, lookupKey } of lookupKeys) {
          // console.log(`Fetching recommendations for phenotype: ${phenotype}`);

          const recommendations = await fetchRecommendations(drugId, lookupKey);
          console.log(
            `Recommendations for ${gene} - ${drug} - ${phenotype}:`,
            recommendations
          );
        }
      }
      setStatus("Completed!");
    } catch (error) {
      console.error("Error during fetch process:", error);
      setStatus("Error");
    }
  }

  return (
    <main>
      <h1>Fetch Recommendations</h1>
      <button onClick={fetchAndPrintResults}>Start Fetching</button>
      <p>Status: {status}</p>
    </main>
  );
}
