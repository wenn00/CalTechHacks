/**
 * Seed: ARDD publication data + precomputed match scores
 * Run: npm run db:seed-matches
 *
 * Seeds publications for existing profiles, then runs the match engine
 * across all profile pairs so the /api/matches feed is populated immediately.
 */
import { PrismaClient } from "@prisma/client";
import { computeMatchesForUser } from "../src/matching/engine";

const prisma = new PrismaClient();

const PUBLICATIONS = [
  {
    emailHint: "senescence",
    title: "Dasatinib and Quercetin Clear Senescent Cells and Improve Physical Function in Aged Mice",
    abstract: "We demonstrate that the combination of dasatinib and quercetin (D+Q) selectively eliminates senescent cells in aged mice, leading to improvements in physical function, grip strength, and running endurance. Treated mice showed a 35% reduction in p16-positive cells in skeletal muscle and a corresponding decrease in SASP markers including IL-6 and MMP-3.",
    keywords: ["senolytics", "dasatinib", "quercetin", "p16", "SASP", "cellular senescence", "physical function", "frailty"],
    year: 2023, journal: "Nature Medicine",
  },
  {
    emailHint: "unity",
    title: "UBX1325 Clears Senescent Endothelial Cells and Restores Vascular Function in Diabetic Retinopathy",
    abstract: "UBX1325, a potent BCL-xL inhibitor, selectively eliminates senescent endothelial and pericyte cells in diabetic retinopathy models. Intravitreal injection led to significant improvements in retinal vasculature integrity and visual acuity scores in phase 1b trial participants. Safety profile was excellent with no dose-limiting toxicities.",
    keywords: ["senolytics", "BCL-xL", "UBX1325", "diabetic retinopathy", "endothelial senescence", "vascular aging", "clinical trial"],
    year: 2024, journal: "NEJM",
  },
  {
    emailHint: "harvard",
    title: "Partial Reprogramming with OSK Restores Youthful Gene Expression in Aged Retinal Ganglion Cells",
    abstract: "Transient expression of Oct4, Sox2, and Klf4 (OSK) in aged retinal ganglion cells resets their epigenetic age and restores visual function in a mouse model of glaucoma. Single-cell transcriptomics revealed a 60% reduction in epigenetic age acceleration without induction of pluripotency genes or teratoma formation.",
    keywords: ["partial reprogramming", "OSK", "epigenetic clock", "retinal aging", "yamanaka factors", "Horvath clock", "epigenetic rejuvenation"],
    year: 2023, journal: "Nature",
  },
  {
    emailHint: "calico",
    title: "FOXO3 Variants Associated with Extreme Longevity Modulate Stress Resistance and Autophagy",
    abstract: "Genome-wide analysis of 3,200 centenarians identified enrichment of FOXO3 variants that enhance nuclear localization and transcriptional activity. Mechanistically, these variants upregulate autophagy flux and reduce oxidative stress markers. Functional validation in iPSC-derived neurons confirmed a 40% increase in resistance to proteotoxic stress.",
    keywords: ["FOXO3", "longevity genetics", "autophagy", "oxidative stress", "centenarians", "IGF-1 signaling", "proteostasis"],
    year: 2022, journal: "Cell",
  },
  {
    emailHint: "nia.nih",
    title: "Rapamycin and Acarbose Synergistically Extend Lifespan in Female and Male Mice",
    abstract: "ITP trial testing the combination of rapamycin and acarbose demonstrates a 25% increase in median lifespan in both sexes, exceeding either compound alone. The combination preferentially activates AMPK in liver and muscle while maintaining mTORC2 signaling. Transcriptomic analysis reveals unique gene expression patterns not seen with either drug alone.",
    keywords: ["rapamycin", "acarbose", "mTOR", "AMPK", "lifespan extension", "ITP", "drug combinations", "longevity"],
    year: 2023, journal: "Aging Cell",
  },
  {
    emailHint: "salk",
    title: "Telomerase Gene Therapy Reverses Aging Hallmarks in Multiple Tissues Simultaneously",
    abstract: "AAV9-mediated telomerase (TERT) delivery in aged mice reversed multiple hallmarks of aging including telomere shortening, mitochondrial dysfunction, and epigenetic age acceleration. Two-year follow-up showed sustained rejuvenation effects without cancer incidence. Plasma proteomics revealed normalization of 74 aging-associated proteins.",
    keywords: ["telomerase", "TERT", "telomeres", "gene therapy", "hallmarks of aging", "mitochondria", "epigenetic clock", "rejuvenation"],
    year: 2024, journal: "Science",
  },
  {
    emailHint: "mit.edu",
    title: "HSF1 Activity Declines Non-Linearly at Midlife, Triggering Proteostasis Collapse",
    abstract: "Longitudinal measurement of heat shock factor 1 (HSF1) activity across the mouse lifespan reveals a non-linear decline beginning at 12 months that precedes the onset of major aging phenotypes. HSF1 activating compounds restored proteostasis and extended healthspan by 18% in 18-month-old mice. Single-cell analysis identified skeletal muscle and neurons as primary collapse sites.",
    keywords: ["HSF1", "proteostasis", "heat shock proteins", "chaperones", "unfolded protein response", "healthspan", "muscle aging"],
    year: 2023, journal: "Molecular Cell",
  },
  {
    emailHint: "insilico",
    title: "Generative AI Identifies Novel Senescence Targets: INS018_055 in Phase II for IPF",
    abstract: "Using the PandaOmics AI platform, we identified TNIK as a novel target in idiopathic pulmonary fibrosis with strong aging-pathway connections. INS018_055, designed de novo by our Chemistry42 generative AI system, achieved Phase I safety endpoints and is advancing to Phase II. This represents the first AI-designed drug to reach Phase II clinical trial.",
    keywords: ["AI drug discovery", "generative AI", "IPF", "TNIK", "aging target", "clinical trial", "drug design"],
    year: 2023, journal: "Nature Biotechnology",
  },
  {
    emailHint: "mpg.de",
    title: "A Novel DAF-16/FOXO Target Gene Extends C. elegans Lifespan by 40%",
    abstract: "CRISPR screen in C. elegans identified clt-1 as a downstream target of DAF-16/FOXO that extends lifespan by 40% when overexpressed. clt-1 encodes a mitochondrial membrane protein that enhances electron transport chain efficiency. Mammalian ortholog analysis identified CLATM1 as a candidate for translational studies.",
    keywords: ["C. elegans", "DAF-16", "FOXO", "lifespan extension", "mitochondria", "CRISPR screen", "aging genetics", "AMPK"],
    year: 2022, journal: "eLife",
  },
  {
    emailHint: "newlimit",
    title: "Machine Learning Identifies Epigenetic Rejuvenation Factors from Single-Cell Aging Atlas",
    abstract: "Single-cell multi-omic profiling of 40 tissues across the mouse aging trajectory identified 847 CpG sites that define the aging epigenetic program. Our ML model predicts which transcription factor perturbations maximally reverse this program without inducing pluripotency. Top candidates validated in vitro show 15-year biological age reduction in primary human fibroblasts.",
    keywords: ["epigenetic clock", "machine learning", "single-cell", "aging atlas", "partial reprogramming", "CpG methylation", "biological age"],
    year: 2024, journal: "Cell Systems",
  },
];

async function main() {
  console.log("Seeding ARDD match data...");

  const profiles = await prisma.profiles.findMany({
    select: { id: true, email: true, name: true, onboarding_complete: true },
  });

  if (profiles.length === 0) {
    console.log("  ⚠️  No profiles found. Create profiles through the app first.");
    return;
  }

  // Seed publications by matching email hints to profiles
  console.log(`  → Seeding publications for ${profiles.length} profiles...`);
  let pubCount = 0;

  for (const pub of PUBLICATIONS) {
    const profile = profiles.find((p) =>
      p.email.toLowerCase().includes(pub.emailHint) ||
      p.email.toLowerCase().includes(pub.emailHint.split(".")[0])
    ) ?? profiles[pubCount % profiles.length]; // fallback: round-robin

    const existing = await prisma.publications.findFirst({
      where: { profile_id: profile.id, title: pub.title },
    });
    if (!existing) {
      const { emailHint, ...pubData } = pub;
      await prisma.publications.create({ data: { profile_id: profile.id, ...pubData } });
      console.log(`    ✓ "${pub.title.slice(0, 60)}..." → ${profile.name}`);
    }
    pubCount++;
  }

  // Precompute matches for each profile
  console.log(`\n  → Computing matches for ${profiles.length} profiles...`);
  let totalMatches = 0;

  for (const profile of profiles) {
    const count = await computeMatchesForUser(profile.id);
    if (count > 0) console.log(`    ✓ ${profile.name}: ${count} matches computed`);
    totalMatches = Math.max(totalMatches, count);
  }

  const matchCount = await prisma.matches.count();
  console.log(`\n✓ Seeded ${pubCount} publications, ${matchCount} match pairs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
