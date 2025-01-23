"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function PopulateKnowledgeBase() {
  const [status, setStatus] = useState("Idle");

  // List of gene-drug pairs
  const geneDrugPairs = [
    { gene: "CYP2B6", drug: "efavirenz" },
    { gene: "CYP2C19", drug: "amitriptyline" },
    { gene: "CYP2C19", drug: "citalopram" },
    // Add all other pairs...
  ];

  // Fetch phenotypes for a given gene
  async function fetchPhenotypes(gene: string) {
    const response = await fetch(
      `https://api.cpicpgx.org/v1/gene_result?genesymbol=eq.${gene}`
    );
    if (!response.ok) throw new Error(`Error fetching phenotypes for ${gene}`);
    return response.json();
  }

  // Fetch guidelines for a given gene-drug pair
  async function fetchGuidelines(gene: string, drug: string) {
    const response = await fetch(
      `https://api.cpicpgx.org/v1/pair_view?genesymbol=eq.${gene}&drugid=like.*${drug}*`
    );
    if (!response.ok)
      throw new Error(`Error fetching guidelines for ${gene}-${drug}`);
    return response.json();
  }

  // Main function to populate the KnowledgeBase table
  async function populateTable() {
    setStatus("Populating...");
    try {
      for (const { gene, drug } of geneDrugPairs) {
        // Fetch phenotypes and guidelines
        const phenotypes = await fetchPhenotypes(gene);
        console.log("Phenotypes:", phenotypes); // Log inside the loop
  
        const guidelines = await fetchGuidelines(gene, drug);
        console.log("Guidelines:", guidelines); // Log inside the loop
  
        // Transform the data to match your schema
        const entry = {
          medicineClass: drug,
          drug,
          genotype: gene,
          phenotype: phenotypes.map((p) => p.result).join(", "),
          summary: `Guidelines for ${gene} and ${drug}`,
          guideline: guidelines.map((g) => g.guideline_url).join(", "),
        };
  
        console.log("Inserted Entry:", entry); // Log before inserting into the database
  
        // Create the entry in KnowledgeBase
        await client.models.KnowledgeBase.create(entry);
      }
      setStatus("Completed!");
    } catch (error) {
      console.error("Error populating KnowledgeBase:", error);
      setStatus("Error");
    }
  }
  

  return (
    <main>
      <h1>Populate KnowledgeBase</h1>
      <button onClick={populateTable}>Start Population</button>
      <p>Status: {status}</p>
    </main>
  );
}
