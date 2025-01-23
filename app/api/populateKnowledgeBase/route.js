// /app/api/populateKnowledgeBase/route.js

import { NextResponse } from 'next/server';

// Fetch phenotypes for a given gene
async function fetchPhenotypes(gene) {
  const response = await fetch(`https://api.cpicpgx.org/v1/gene_result?genesymbol=eq.${gene}`, {
    headers: {
      Authorization: `Bearer ${process.env.CPIC_API_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch phenotypes for ${gene}`);
  return await response.json();
}

// Fetch guidelines for a given gene-drug pair
async function fetchGuidelines(gene, drug) {
  const response = await fetch(`https://api.cpicpgx.org/v1/pair_view?genesymbol=eq.${gene}&drugid=like.*${drug}*`, {
    headers: {
      Authorization: `Bearer ${process.env.CPIC_API_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch guidelines for ${gene}-${drug}`);
  return await response.json();
}

// Fetch recommendations for a given gene-drug pair
async function fetchRecommendations(gene, drug) {
  const response = await fetch(`https://api.cpicpgx.org/v1/recommendation?lookupKey=cs.{%22${gene}%22:%20%22Metabolizer%22}&drugid=like.*${drug}*`, {
    headers: {
      Authorization: `Bearer ${process.env.CPIC_API_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch recommendations for ${gene}-${drug}`);
  return await response.json();
}

// Main handler to populate KnowledgeBase
export async function POST(request) {
  try {
    const geneDrugPairs = [
      { gene: "CYP2B6", drug: "efavirenz" },
      { gene: "CYP2C19", drug: "amitriptyline" },
      // Add all other pairs here...
    ];

    const knowledgeBaseEntries = [];

    for (const { gene, drug } of geneDrugPairs) {
      // Fetch data
      const phenotypes = await fetchPhenotypes(gene);
      const guidelines = await fetchGuidelines(gene, drug);
      const recommendations = await fetchRecommendations(gene, drug);

      // Transform data into your schema format
      const entry = {
        medicineClass: drug, // Adjust as needed
        drug,
        genotype: gene,
        phenotype: phenotypes.map((p) => p.result).join(", "),
        summary: `Guidelines and recommendations for ${gene}-${drug}`,
        guideline: guidelines.map((g) => g.guideline_url).join(", "),
      };

      knowledgeBaseEntries.push(entry);
    }

    // Save entries to your KnowledgeBase (replace with your DB logic)
    for (const entry of knowledgeBaseEntries) {
      await fetch(process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.APPSYNC_API_KEY,
        },
        body: JSON.stringify({
          query: `
            mutation CreateKnowledgeBase($input: CreateKnowledgeBaseInput!) {
              createKnowledgeBase(input: $input) {
                id
                medicineClass
                drug
                genotype
                phenotype
                summary
                guideline
              }
            }
          `,
          variables: { input: entry },
        }),
      });
    }

    return NextResponse.json({ message: "KnowledgeBase populated successfully!" });
  } catch (error) {
    console.error("Error populating KnowledgeBase:", error);
    return NextResponse.json({ error: "Failed to populate KnowledgeBase" }, { status: 500 });
  }
}
