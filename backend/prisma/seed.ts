/**
 * Seed: 40 realistic ARDD conference attendees
 * Run: npm run db:seed
 */
import { PrismaClient, CareerStage, InstitutionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Reference data ────────────────────────────────────────────────────────────

const INSTITUTIONS: { name: string; type: InstitutionType; country: string }[] = [
  { name: "Buck Institute for Research on Aging",     type: "RESEARCH_INSTITUTE", country: "USA" },
  { name: "Salk Institute for Biological Studies",    type: "RESEARCH_INSTITUTE", country: "USA" },
  { name: "Harvard Medical School",                   type: "UNIVERSITY",         country: "USA" },
  { name: "Stanford University School of Medicine",   type: "UNIVERSITY",         country: "USA" },
  { name: "MIT",                                      type: "UNIVERSITY",         country: "USA" },
  { name: "Calico Life Sciences",                     type: "BIOTECH",            country: "USA" },
  { name: "Unity Biotechnology",                      type: "BIOTECH",            country: "USA" },
  { name: "SENS Research Foundation",                 type: "NONPROFIT",          country: "USA" },
  { name: "Mayo Clinic",                              type: "HOSPITAL",           country: "USA" },
  { name: "National Institute on Aging (NIA)",        type: "GOVERNMENT",         country: "USA" },
  { name: "Johns Hopkins University",                 type: "UNIVERSITY",         country: "USA" },
  { name: "UC San Francisco",                         type: "UNIVERSITY",         country: "USA" },
  { name: "UC San Diego",                             type: "UNIVERSITY",         country: "USA" },
  { name: "Altos Labs",                               type: "BIOTECH",            country: "USA" },
  { name: "NewLimit",                                 type: "BIOTECH",            country: "USA" },
  { name: "Retro Biosciences",                        type: "BIOTECH",            country: "USA" },
  { name: "Ora Biomedical",                           type: "BIOTECH",            country: "USA" },
  { name: "Scripps Research Institute",               type: "RESEARCH_INSTITUTE", country: "USA" },
  { name: "Brigham and Women's Hospital",             type: "HOSPITAL",           country: "USA" },
  { name: "Insilico Medicine",                        type: "BIOTECH",            country: "USA" },
  { name: "Longevity Fund",                           type: "VENTURE_CAPITAL",    country: "USA" },
  { name: "Apollo Health Ventures",                   type: "VENTURE_CAPITAL",    country: "USA" },
  { name: "Juvenescence",                             type: "BIOTECH",            country: "UK"  },
  { name: "Max Planck Institute for Biology of Ageing", type: "RESEARCH_INSTITUTE", country: "Germany" },
  { name: "University of Cambridge",                  type: "UNIVERSITY",         country: "UK"  },
  { name: "King's College London",                    type: "UNIVERSITY",         country: "UK"  },
  { name: "Newcastle University Institute for Ageing", type: "UNIVERSITY",        country: "UK"  },
  { name: "University of Copenhagen",                 type: "UNIVERSITY",         country: "Denmark" },
  { name: "Vanderbilt University Medical Center",     type: "UNIVERSITY",         country: "USA" },
];

const RESEARCH_AREAS: { name: string; description: string }[] = [
  { name: "Longevity Biology",           description: "Molecular and cellular mechanisms underlying organismal aging and lifespan extension" },
  { name: "Epigenetics & Aging",         description: "Epigenetic changes over time including DNA methylation, histone modification, and chromatin remodeling" },
  { name: "Cellular Senescence",         description: "Biology of senescent cells, SASP, and therapeutic clearance strategies (senolytics/senomorphics)" },
  { name: "Metabolic Health & Aging",    description: "Metabolic dysfunction in aging: insulin resistance, NAD+ decline, mitochondrial dysfunction" },
  { name: "Neurodegeneration",           description: "Age-related neurodegenerative diseases including Alzheimer's, Parkinson's, and ALS" },
  { name: "Cardiovascular Aging",        description: "Age-related changes in cardiac function, vascular stiffness, and atherosclerosis" },
  { name: "Stem Cell Biology",           description: "Stem cell aging, regenerative capacity decline, and rejuvenation strategies" },
  { name: "Drug Discovery & Aging",      description: "Development of pharmacological interventions targeting aging pathways" },
  { name: "Genomics & Aging",            description: "Genomic instability, DNA damage response, and genetic factors in lifespan" },
  { name: "Clinical Geroscience",        description: "Translation of aging biology into clinical interventions targeting the aging process" },
  { name: "AI & Aging Research",         description: "Machine learning and AI approaches to aging biomarker discovery and drug development" },
  { name: "Microbiome & Aging",          description: "Role of the gut microbiome in aging, age-related disease, and longevity" },
  { name: "Proteostasis",                description: "Protein quality control, unfolded protein response, and chaperone biology in aging" },
  { name: "mTOR & Nutrient Signaling",   description: "mTOR, AMPK, IGF-1, and other nutrient-sensing pathways as aging regulators" },
];

const KEYWORDS: string[] = [
  "rapamycin", "metformin", "NAD+", "sirtuins", "SIRT1", "SIRT3", "telomeres", "telomerase",
  "autophagy", "mTOR", "AMPK", "senolytics", "senomorphics", "SASP", "epigenetic clock",
  "Horvath clock", "biological age", "healthspan", "lifespan extension", "caloric restriction",
  "intermittent fasting", "mitochondria", "mitophagy", "proteostasis", "heat shock proteins",
  "inflammaging", "microbiome", "p16", "p21", "p53", "CDK inhibitors", "NF-κB",
  "FOXO", "IGF-1 signaling", "partial reprogramming", "yamanaka factors", "cellular reprogramming",
  "longevity escape velocity", "geroscience", "biomarkers of aging", "aging clocks",
  "rejuvenation", "hallmarks of aging", "stem cell exhaustion", "proteome",
  "GDF11", "klotho", "GDF15", "NMN", "NR", "resveratrol", "dasatinib", "quercetin",
  "navitoclax", "OSKM", "iPSC", "heterochromatin", "transposable elements",
  "mitochondrial dysfunction", "reactive oxygen species", "antioxidants",
];

// ─── Attendee data ─────────────────────────────────────────────────────────────

interface SeedAttendee {
  firstName: string;
  lastName: string;
  email: string;
  careerStage: CareerStage;
  institution: string;
  bio: string;
  linkedinUrl?: string;
  googleScholarUrl?: string;
  conferenceGoals: string;
  researchAreas: string[];
  keywords: string[];
}

const ATTENDEES: SeedAttendee[] = [
  {
    firstName: "Sarah", lastName: "Chen",
    email: "sarah.chen@buckinstitute.org",
    careerStage: "PROFESSOR",
    institution: "Buck Institute for Research on Aging",
    bio: "Dr. Chen's lab studies the mechanisms by which senescent cells drive tissue dysfunction. Her work identified key SASP factors that promote neighboring cell paracrine senescence. She is co-inventor of two senolytic drug candidates currently in Phase I trials.",
    linkedinUrl: "https://linkedin.com/in/sarah-chen-aging",
    googleScholarUrl: "https://scholar.google.com/citations?user=sarahchen",
    conferenceGoals: "Connect with clinical translators to advance our senolytic pipeline. Interested in combining our SASP biology findings with AI-driven drug discovery approaches.",
    researchAreas: ["Cellular Senescence", "Longevity Biology", "Drug Discovery & Aging"],
    keywords: ["senolytics", "senomorphics", "SASP", "p16", "p21", "rapamycin", "dasatinib", "quercetin"],
  },
  {
    firstName: "James", lastName: "Martinez",
    email: "james.martinez@unitybiotech.com",
    careerStage: "FOUNDER",
    institution: "Unity Biotechnology",
    bio: "Co-founder and CEO of Unity Biotechnology, pioneering senolytic medicines for age-related diseases. Previously led aging programs at Genentech. Focused on translating decades of cellular senescence research into transformative therapies.",
    linkedinUrl: "https://linkedin.com/in/jamesmartinez-unity",
    conferenceGoals: "Explore partnerships with academic groups working on next-generation senolytic targets. Looking for clinical advisors with ophthalmology and pulmonology expertise.",
    researchAreas: ["Cellular Senescence", "Drug Discovery & Aging", "Clinical Geroscience"],
    keywords: ["senolytics", "navitoclax", "SASP", "p16", "healthspan", "clinical trials"],
  },
  {
    firstName: "Emily", lastName: "Nakamura",
    email: "emily.nakamura@hms.harvard.edu",
    careerStage: "POSTDOC",
    institution: "Harvard Medical School",
    bio: "Postdoctoral researcher in the Sinclair Lab studying epigenetic reprogramming as a strategy for tissue rejuvenation. My thesis characterized the epigenetic changes during Yamanaka factor induction in aged retinal cells. Currently developing safer, partial reprogramming protocols.",
    linkedinUrl: "https://linkedin.com/in/emily-nakamura-epigenetics",
    googleScholarUrl: "https://scholar.google.com/citations?user=emilynakamura",
    conferenceGoals: "Find collaborators for in vivo partial reprogramming experiments in aged mouse models. Open to industry positions in cellular reprogramming.",
    researchAreas: ["Epigenetics & Aging", "Stem Cell Biology", "Longevity Biology"],
    keywords: ["partial reprogramming", "yamanaka factors", "OSKM", "epigenetic clock", "Horvath clock", "biological age", "iPSC"],
  },
  {
    firstName: "Robert", lastName: "Kim",
    email: "r.kim@calicolabs.com",
    careerStage: "SENIOR_RESEARCHER",
    institution: "Calico Life Sciences",
    bio: "Senior scientist at Calico investigating the genetics of exceptional longevity using large-scale cohort data and model organisms. Led the analysis identifying novel longevity-associated variants in the FOXO3 locus across multiple ethnic populations.",
    linkedinUrl: "https://linkedin.com/in/robertkim-calico",
    googleScholarUrl: "https://scholar.google.com/citations?user=robertkim",
    conferenceGoals: "Share our population genetics findings and explore functional validation collaborations. Interested in connecting with clinical phenotyping groups.",
    researchAreas: ["Genomics & Aging", "Longevity Biology"],
    keywords: ["FOXO", "IGF-1 signaling", "longevity genetics", "biomarkers of aging", "healthspan", "lifespan extension"],
  },
  {
    firstName: "Lisa", lastName: "Patel",
    email: "lisa.patel@nia.nih.gov",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "National Institute on Aging (NIA)",
    bio: "Program officer and researcher at NIA overseeing the Interventions Testing Program. My lab studies metabolic biomarkers of aging in the Baltimore Longitudinal Study of Aging cohort. Passionate about rigorous, reproducible aging research.",
    linkedinUrl: "https://linkedin.com/in/lisapatel-nia",
    googleScholarUrl: "https://scholar.google.com/citations?user=lisapatel",
    conferenceGoals: "Discuss NIA funding priorities for interventions research. Connect with investigators interested in the ITP compound submission process.",
    researchAreas: ["Metabolic Health & Aging", "Clinical Geroscience", "Drug Discovery & Aging"],
    keywords: ["metformin", "rapamycin", "NMN", "NAD+", "AMPK", "caloric restriction", "biomarkers of aging", "hallmarks of aging"],
  },
  {
    firstName: "Michael", lastName: "Torres",
    email: "m.torres@salk.edu",
    careerStage: "PROFESSOR",
    institution: "Salk Institute for Biological Studies",
    bio: "Full professor studying telomere dynamics during aging and cancer. Developed a novel single-molecule telomere length assay now used in clinical trials. Recent work shows telomerase reactivation can reverse multiple hallmarks of aging simultaneously.",
    linkedinUrl: "https://linkedin.com/in/michaeltorres-salk",
    googleScholarUrl: "https://scholar.google.com/citations?user=michaeltorres",
    conferenceGoals: "Explore combination therapies pairing telomerase activation with senolytic approaches. Discuss commercialization of our telomere length diagnostic.",
    researchAreas: ["Longevity Biology", "Genomics & Aging", "Clinical Geroscience"],
    keywords: ["telomeres", "telomerase", "genomic instability", "hallmarks of aging", "rejuvenation", "biological age"],
  },
  {
    firstName: "Amanda", lastName: "Foster",
    email: "amanda.foster@stanford.edu",
    careerStage: "GRADUATE_STUDENT",
    institution: "Stanford University School of Medicine",
    bio: "PhD candidate in the Bhanu lab using CRISPR screens to identify novel regulators of cellular senescence. My project maps the genetic landscape of SASP regulation to find new senolytic and senomorphic targets. ARDD is my first major conference.",
    conferenceGoals: "Get feedback on my CRISPR screen data from domain experts. Explore postdoc opportunities at leading aging labs.",
    researchAreas: ["Cellular Senescence", "Genomics & Aging"],
    keywords: ["CRISPR", "SASP", "senolytics", "p16", "p21", "NF-κB", "senomorphics"],
  },
  {
    firstName: "David", lastName: "Okonkwo",
    email: "d.okonkwo@mayo.edu",
    careerStage: "PROFESSOR",
    institution: "Mayo Clinic",
    bio: "Professor of Medicine and co-director of the Mayo Clinic Geroscience program. Led the landmark TAPAS clinical trial of senolytics in idiopathic pulmonary fibrosis. Research focuses on translating geroscience discoveries into clinical interventions for frailty and age-related multimorbidity.",
    linkedinUrl: "https://linkedin.com/in/davidokonkwo-mayo",
    googleScholarUrl: "https://scholar.google.com/citations?user=davidokonkwo",
    conferenceGoals: "Present TAPAS follow-up data and identify academic partners for next senolytic trial in frailty. Discuss biomarker harmonization across aging trials.",
    researchAreas: ["Clinical Geroscience", "Cellular Senescence", "Drug Discovery & Aging"],
    keywords: ["senolytics", "frailty", "clinical trials", "dasatinib", "quercetin", "healthspan", "geroscience"],
  },
  {
    firstName: "Jennifer", lastName: "Wu",
    email: "j.wu@mit.edu",
    careerStage: "PROFESSOR",
    institution: "MIT",
    bio: "Associate professor at MIT's Department of Biology studying protein homeostasis collapse in aging. Lab discovered that heat shock factor 1 (HSF1) activity declines non-linearly past midlife, triggering a proteostasis crisis. Developing small molecules to reactivate the heat shock response.",
    linkedinUrl: "https://linkedin.com/in/jenniferwu-mit",
    googleScholarUrl: "https://scholar.google.com/citations?user=jenniferwu",
    conferenceGoals: "Present new HSF1 activator data. Connect with structural biologists to optimize our lead compounds.",
    researchAreas: ["Proteostasis", "Longevity Biology", "Drug Discovery & Aging"],
    keywords: ["proteostasis", "heat shock proteins", "HSF1", "unfolded protein response", "autophagy", "hallmarks of aging"],
  },
  {
    firstName: "Alex", lastName: "Johnson",
    email: "alex@longevityfund.com",
    careerStage: "INVESTOR",
    institution: "Longevity Fund",
    bio: "Managing partner at Longevity Fund, the leading early-stage fund focused exclusively on longevity therapeutics. Portfolio includes 22 companies spanning senolytics, epigenetic reprogramming, and metabolic aging interventions. Former computational biologist.",
    linkedinUrl: "https://linkedin.com/in/alexjohnson-longevity",
    conferenceGoals: "Identify Series A-ready companies in the SENS/senolytics and epigenetic reprogramming space. Connect with founders ready to spin out of academic labs.",
    researchAreas: ["Drug Discovery & Aging", "Longevity Biology"],
    keywords: ["longevity escape velocity", "healthspan", "senolytics", "partial reprogramming", "aging clocks", "geroscience"],
  },
  {
    firstName: "Rachel", lastName: "Green",
    email: "r.green@altoslabs.com",
    careerStage: "SENIOR_RESEARCHER",
    institution: "Altos Labs",
    bio: "Senior scientist at Altos Labs working on in vivo partial reprogramming. Led the team demonstrating transient OSKM expression reverses aging hallmarks in aged mouse muscle without inducing teratoma. Current focus: tissue-specific reprogramming delivery vectors.",
    linkedinUrl: "https://linkedin.com/in/rachelgreen-altos",
    googleScholarUrl: "https://scholar.google.com/citations?user=rachelgreen",
    conferenceGoals: "Discuss delivery challenges for in vivo reprogramming. Find clinical translation experts for our muscle regeneration program.",
    researchAreas: ["Epigenetics & Aging", "Stem Cell Biology", "Longevity Biology"],
    keywords: ["partial reprogramming", "OSKM", "yamanaka factors", "cellular reprogramming", "epigenetic clock", "iPSC", "stem cell exhaustion"],
  },
  {
    firstName: "Carlos", lastName: "Rodriguez",
    email: "c.rodriguez@insilico.com",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "Insilico Medicine",
    bio: "VP of Biology at Insilico Medicine, leading the application of generative AI to aging drug discovery. Our PandaOmics platform has identified 12 novel aging targets with strong genetic and multi-omic validation. Currently advancing INS018_055 for IPF into Phase II.",
    linkedinUrl: "https://linkedin.com/in/carlosrodriguez-insilico",
    conferenceGoals: "Demonstrate AI-driven target identification for aging. Explore academic partnerships for wet-lab validation of AI-predicted targets.",
    researchAreas: ["AI & Aging Research", "Drug Discovery & Aging", "Longevity Biology"],
    keywords: ["AI drug discovery", "generative AI", "aging clocks", "biomarkers of aging", "target identification", "omics"],
  },
  {
    firstName: "Anna", lastName: "Lindqvist",
    email: "a.lindqvist@age.mpg.de",
    careerStage: "PROFESSOR",
    institution: "Max Planck Institute for Biology of Ageing",
    bio: "Research group leader using C. elegans as a model to dissect the conserved mechanisms of lifespan extension. Discovered a novel DAF-16/FOXO target gene that extends lifespan by 40% when overexpressed. Interested in conserved translation to mammalian aging.",
    linkedinUrl: "https://linkedin.com/in/annalindqvist-mpg",
    googleScholarUrl: "https://scholar.google.com/citations?user=annalindqvist",
    conferenceGoals: "Identify mammalian equivalents of our C. elegans lifespan genes. Build bridges between invertebrate aging genetics and clinical translation.",
    researchAreas: ["Longevity Biology", "Genomics & Aging", "mTOR & Nutrient Signaling"],
    keywords: ["FOXO", "DAF-16", "IGF-1 signaling", "C. elegans", "lifespan extension", "caloric restriction", "mTOR", "AMPK"],
  },
  {
    firstName: "William", lastName: "Grant",
    email: "w.grant@newlimit.com",
    careerStage: "FOUNDER",
    institution: "NewLimit",
    bio: "Co-founder of NewLimit, working to unlock the epigenetic basis of aging and develop medicines that restore youthful epigenetic states. Background in machine learning and single-cell genomics. Previously at Coinbase leading ML infrastructure.",
    linkedinUrl: "https://linkedin.com/in/williamgrant-newlimit",
    conferenceGoals: "Connect with academic pioneers in epigenetic reprogramming. Discuss computational approaches for identifying safe partial reprogramming cocktails.",
    researchAreas: ["Epigenetics & Aging", "AI & Aging Research", "Longevity Biology"],
    keywords: ["epigenetic clock", "partial reprogramming", "yamanaka factors", "biological age", "single-cell genomics", "machine learning"],
  },
  {
    firstName: "Priya", lastName: "Sharma",
    email: "p.sharma@ucsf.edu",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "UC San Francisco",
    bio: "Associate professor studying chronic low-grade inflammation (inflammaging) as a driver of age-related tissue dysfunction. Lab identified NF-κB as a master regulator of the aging inflammatory state. Currently developing precision anti-inflammaging interventions.",
    linkedinUrl: "https://linkedin.com/in/priyasharma-ucsf",
    googleScholarUrl: "https://scholar.google.com/citations?user=priyasharma",
    conferenceGoals: "Connect with immunologists and cardiologists to extend inflammaging research into clinical settings. Discuss NF-κB inhibitor safety in aged populations.",
    researchAreas: ["Longevity Biology", "Cardiovascular Aging", "Cellular Senescence"],
    keywords: ["inflammaging", "NF-κB", "SASP", "senomorphics", "chronic inflammation", "hallmarks of aging"],
  },
  {
    firstName: "Noah", lastName: "Williams",
    email: "noah@retrobiosciences.com",
    careerStage: "FOUNDER",
    institution: "Retro Biosciences",
    bio: "Co-founder and CEO of Retro Biosciences, a biotech dedicated to adding 10 healthy years to the human lifespan. Programs in autophagy enhancement, plasma-inspired therapeutics, and cellular reprogramming. Previously at Apple in computational biology.",
    linkedinUrl: "https://linkedin.com/in/noahwilliams-retro",
    conferenceGoals: "Present Retro's multi-program strategy and connect with academic advisors for our autophagy and plasma fraction programs.",
    researchAreas: ["Longevity Biology", "Proteostasis", "Epigenetics & Aging"],
    keywords: ["autophagy", "mitophagy", "cellular reprogramming", "plasma", "GDF11", "lifespan extension", "healthspan"],
  },
  {
    firstName: "Thomas", lastName: "Hughes",
    email: "t.hughes@jhmi.edu",
    careerStage: "PROFESSOR",
    institution: "Johns Hopkins University",
    bio: "Professor of Medicine at Johns Hopkins studying age-related cardiovascular disease. Research focuses on how vascular stiffness and endothelial dysfunction accumulate with age. Running a pilot trial of low-dose rapamycin for vascular aging prevention.",
    linkedinUrl: "https://linkedin.com/in/thomashughes-jhu",
    googleScholarUrl: "https://scholar.google.com/citations?user=thomashughes",
    conferenceGoals: "Share rapamycin trial design and discuss biomarker selection. Connect with aging biologists to understand the mechanisms driving our clinical observations.",
    researchAreas: ["Cardiovascular Aging", "Clinical Geroscience", "Drug Discovery & Aging"],
    keywords: ["rapamycin", "mTOR", "vascular aging", "endothelial dysfunction", "cardiovascular aging", "healthspan", "clinical trials"],
  },
  {
    firstName: "Yuki", lastName: "Tanaka",
    email: "y.tanaka@orabiomedical.com",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "Ora Biomedical",
    bio: "Chief Scientific Officer at Ora Biomedical, developing drug combinations that synergistically extend lifespan in model organisms. Built the largest systematic longevity drug combination screening platform in C. elegans. Former research faculty at UW.",
    linkedinUrl: "https://linkedin.com/in/yukitanaka-ora",
    googleScholarUrl: "https://scholar.google.com/citations?user=yukitanaka",
    conferenceGoals: "Discuss translating our C. elegans combination lifespan findings into mammalian models. Explore partnerships with clinical trial groups.",
    researchAreas: ["Drug Discovery & Aging", "Metabolic Health & Aging", "mTOR & Nutrient Signaling"],
    keywords: ["rapamycin", "metformin", "NAD+", "NMN", "lifespan extension", "drug combinations", "C. elegans", "mTOR", "AMPK"],
  },
  {
    firstName: "Maya", lastName: "Richardson",
    email: "m.richardson@buckinstitute.org",
    careerStage: "EARLY_CAREER_RESEARCHER",
    institution: "Buck Institute for Research on Aging",
    bio: "Assistant professor studying NAD+ metabolism and its role in mitochondrial aging. Discovered that NMN supplementation rescues vascular aging in 18-month-old mice by restoring SIRT1 activity. Currently characterizing tissue-specific NAD+ depletion mechanisms.",
    linkedinUrl: "https://linkedin.com/in/mayarichardson-buck",
    googleScholarUrl: "https://scholar.google.com/citations?user=mayarichardson",
    conferenceGoals: "Present NAD+ vascular data. Identify clinical collaborators for an NMN/NR human trial targeting vascular aging endpoints.",
    researchAreas: ["Metabolic Health & Aging", "Longevity Biology", "Cardiovascular Aging"],
    keywords: ["NAD+", "NMN", "NR", "sirtuins", "SIRT1", "SIRT3", "mitochondria", "mitophagy", "resveratrol"],
  },
  {
    firstName: "Christopher", lastName: "Lee",
    email: "chris@apollohealthventures.com",
    careerStage: "INVESTOR",
    institution: "Apollo Health Ventures",
    bio: "General partner at Apollo Health Ventures, a longevity-focused VC. Led investments in 15 longevity biotech companies including a $70M Series B in an epigenetic reprogramming startup. Former cell biology PhD turned investor.",
    linkedinUrl: "https://linkedin.com/in/christopherlee-apollo",
    conferenceGoals: "Source pre-Series A companies with strong IP in senolytics, reprogramming, and AI-driven drug discovery. Connect with academic founders.",
    researchAreas: ["Drug Discovery & Aging", "Epigenetics & Aging"],
    keywords: ["longevity", "venture capital", "partial reprogramming", "senolytics", "aging clocks", "biotech"],
  },
  {
    firstName: "Victoria", lastName: "Santos",
    email: "v.santos@ucsd.edu",
    careerStage: "PROFESSOR",
    institution: "UC San Diego",
    bio: "Professor of Genomics studying transposable element derepression as a driver of genomic instability in aged cells. Lab showed L1 retrotransposon activation triggers interferon signaling and sterile inflammation in old tissues. Developing TEs as aging biomarkers.",
    linkedinUrl: "https://linkedin.com/in/victoriasantos-ucsd",
    googleScholarUrl: "https://scholar.google.com/citations?user=victoriasantos",
    conferenceGoals: "Discuss transposable elements as druggable aging targets. Connect with immunologists to understand the innate immune component of TE-driven aging.",
    researchAreas: ["Genomics & Aging", "Longevity Biology", "Epigenetics & Aging"],
    keywords: ["transposable elements", "genomic instability", "heterochromatin", "inflammaging", "NF-κB", "hallmarks of aging"],
  },
  {
    firstName: "Hassan", lastName: "Malik",
    email: "h.malik@cam.ac.uk",
    careerStage: "PROFESSOR",
    institution: "University of Cambridge",
    bio: "Professor in the Department of Genetics studying how the aging gut microbiome drives systemic inflammation and cognitive decline. Identified microbiome signatures that predict biological age with 85% accuracy. Running a microbiome transplant trial in centenarian-to-young transfer direction.",
    linkedinUrl: "https://linkedin.com/in/hassanmalik-cambridge",
    googleScholarUrl: "https://scholar.google.com/citations?user=hassanmalik",
    conferenceGoals: "Discuss microbiome-targeted longevity interventions. Find clinical partners for a larger microbiome age-reversal trial.",
    researchAreas: ["Microbiome & Aging", "Longevity Biology", "Clinical Geroscience"],
    keywords: ["microbiome", "gut health", "inflammaging", "biological age", "aging clocks", "probiotics", "healthspan"],
  },
  {
    firstName: "Sophia", lastName: "Andersen",
    email: "s.andersen@mit.edu",
    careerStage: "GRADUATE_STUDENT",
    institution: "MIT",
    bio: "PhD student in Computational Biology developing deep learning models for aging clock construction from multi-modal data. My thesis model integrates DNA methylation, transcriptomics, and proteomics to produce a unified aging score with sub-year precision.",
    googleScholarUrl: "https://scholar.google.com/citations?user=sophiaandersen",
    conferenceGoals: "Present my multi-modal aging clock model. Find experimental collaborators to validate computational predictions. Explore PhD-to-industry transitions.",
    researchAreas: ["AI & Aging Research", "Epigenetics & Aging", "Genomics & Aging"],
    keywords: ["aging clocks", "epigenetic clock", "machine learning", "deep learning", "biological age", "biomarkers of aging", "proteome"],
  },
  {
    firstName: "Kevin", lastName: "Zhang",
    email: "k.zhang@scripps.edu",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "Scripps Research Institute",
    bio: "Associate professor focused on structural-biology-guided drug discovery targeting aging pathways. Lab solved the first cryo-EM structure of the SIRT3-substrate complex, enabling rational design of SIRT3 activators for metabolic aging. One compound is in IND-enabling studies.",
    linkedinUrl: "https://linkedin.com/in/kevinzhang-scripps",
    googleScholarUrl: "https://scholar.google.com/citations?user=kevinzhang",
    conferenceGoals: "Present SIRT3 activator program data. Seek licensing or co-development partners for metabolic aging indication.",
    researchAreas: ["Drug Discovery & Aging", "Metabolic Health & Aging"],
    keywords: ["SIRT3", "sirtuins", "NAD+", "mitochondria", "drug discovery", "cryo-EM", "AMPK"],
  },
  {
    firstName: "Isabella", lastName: "Russo",
    email: "i.russo@kcl.ac.uk",
    careerStage: "EARLY_CAREER_RESEARCHER",
    institution: "King's College London",
    bio: "Lecturer studying the intersection of stem cell aging and tissue regeneration. Research uses iPSC-derived organoids as human aging models. Recently showed that FOXO3 loss in aged mesenchymal stem cells impairs bone regeneration and can be rescued pharmacologically.",
    linkedinUrl: "https://linkedin.com/in/isabellarusso-kcl",
    googleScholarUrl: "https://scholar.google.com/citations?user=isabellarusso",
    conferenceGoals: "Connect with regenerative medicine specialists. Discuss using our organoid aging platform for drug screening partnerships.",
    researchAreas: ["Stem Cell Biology", "Longevity Biology", "Drug Discovery & Aging"],
    keywords: ["stem cell exhaustion", "iPSC", "FOXO", "organoids", "regenerative medicine", "MSC", "bone aging"],
  },
  {
    firstName: "James", lastName: "Park",
    email: "j.park@sens.org",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "SENS Research Foundation",
    bio: "Research director at SENS Research Foundation overseeing programs targeting the seven categories of aging damage. Leading the WILT project on cancer prevention through telomere deletion and ALT suppression. Passionate about comprehensive damage repair approaches.",
    linkedinUrl: "https://linkedin.com/in/jamespark-sens",
    googleScholarUrl: "https://scholar.google.com/citations?user=jamespark",
    conferenceGoals: "Advance collaboration with oncologists and aging biologists on the WILT program. Identify funding for our intracellular aggregates clearance project.",
    researchAreas: ["Longevity Biology", "Genomics & Aging", "Cellular Senescence"],
    keywords: ["rejuvenation", "hallmarks of aging", "telomeres", "damage repair", "longevity escape velocity", "WILT", "healthspan"],
  },
  {
    firstName: "Laura", lastName: "Mitchell",
    email: "l.mitchell@bwh.harvard.edu",
    careerStage: "PROFESSOR",
    institution: "Brigham and Women's Hospital",
    bio: "Professor of Medicine studying epigenetic aging in the context of chronic disease. Demonstrated that the epigenetic age acceleration correlates strongly with 10-year cardiovascular risk, independent of traditional risk factors. Running the first randomized trial of lifestyle interventions on epigenetic age.",
    linkedinUrl: "https://linkedin.com/in/lauramitchell-bwh",
    googleScholarUrl: "https://scholar.google.com/citations?user=lauramitchell",
    conferenceGoals: "Share trial results on lifestyle and epigenetic age. Discuss clinical utility of methylation clocks as regulatory endpoints.",
    researchAreas: ["Epigenetics & Aging", "Clinical Geroscience", "Cardiovascular Aging"],
    keywords: ["epigenetic clock", "Horvath clock", "biological age", "DNA methylation", "cardiovascular aging", "clinical trials", "healthspan"],
  },
  {
    firstName: "Ryan", lastName: "O'Brien",
    email: "ryan@agelessbiotech.com",
    careerStage: "FOUNDER",
    institution: "Buck Institute for Research on Aging",
    bio: "Founder of Ageless Biotech developing evidence-based longevity supplements supported by rigorous human trials. Former neuroscientist who pivoted to longevity product development. Our NMN+resveratrol combination showed significant epigenetic age reduction in a 6-month RCT.",
    linkedinUrl: "https://linkedin.com/in/ryanobrien-ageless",
    conferenceGoals: "Present RCT data. Connect with academic labs for follow-on mechanistic studies. Explore partnerships with longevity clinics.",
    researchAreas: ["Metabolic Health & Aging", "Clinical Geroscience"],
    keywords: ["NMN", "NR", "resveratrol", "NAD+", "epigenetic clock", "clinical trials", "supplements", "healthspan"],
  },
  {
    firstName: "Amara", lastName: "Nwosu",
    email: "a.nwosu@nia.nih.gov",
    careerStage: "SENIOR_RESEARCHER",
    institution: "National Institute on Aging (NIA)",
    bio: "Senior scientist at NIA leading the BLSA (Baltimore Longitudinal Study of Aging) data analytics initiative. Oversees a 70-year longitudinal dataset of 3,000+ participants. Research focuses on identifying early biomarkers of accelerated aging trajectories and multimorbidity.",
    linkedinUrl: "https://linkedin.com/in/amaranwosu-nia",
    googleScholarUrl: "https://scholar.google.com/citations?user=amaranwosu",
    conferenceGoals: "Share BLSA longitudinal insights on aging trajectories. Explore data sharing agreements with external researchers for cross-cohort analyses.",
    researchAreas: ["Clinical Geroscience", "Genomics & Aging", "AI & Aging Research"],
    keywords: ["biomarkers of aging", "longitudinal aging", "frailty", "multimorbidity", "healthspan", "biological age", "proteome"],
  },
  {
    firstName: "Peter", lastName: "Christiansen",
    email: "p.christiansen@sund.ku.dk",
    careerStage: "PROFESSOR",
    institution: "University of Copenhagen",
    bio: "Professor of Molecular Gerontology studying caloric restriction and fasting mimetics in mammalian models. Led the most comprehensive CR dose-response lifespan study in mice to date. Currently running a long-term human caloric restriction study based on CALERIE design.",
    linkedinUrl: "https://linkedin.com/in/peterchristiansen-ku",
    googleScholarUrl: "https://scholar.google.com/citations?user=peterchristiansen",
    conferenceGoals: "Present human CR trial interim data. Discuss optimal fasting regimens and interaction with rapamycin or metformin.",
    researchAreas: ["Metabolic Health & Aging", "mTOR & Nutrient Signaling", "Longevity Biology"],
    keywords: ["caloric restriction", "intermittent fasting", "mTOR", "AMPK", "IGF-1 signaling", "metformin", "lifespan extension", "healthspan"],
  },
  {
    firstName: "Mei", lastName: "Lin",
    email: "mei.lin@ucsf.edu",
    careerStage: "GRADUATE_STUDENT",
    institution: "UC San Francisco",
    bio: "PhD candidate developing a plasma-based aging clock that integrates hundreds of circulating proteins. My model achieves 3.2-year prediction accuracy on biological age. Thesis project: identifying which plasma factors drive vs. reflect biological aging.",
    googleScholarUrl: "https://scholar.google.com/citations?user=meilin",
    conferenceGoals: "Present plasma proteome aging clock data. Find experimental collaborators to test causal roles of top proteins in aging phenotypes.",
    researchAreas: ["AI & Aging Research", "Longevity Biology", "Metabolic Health & Aging"],
    keywords: ["proteome", "aging clocks", "plasma proteins", "biological age", "GDF15", "GDF11", "klotho", "biomarkers of aging"],
  },
  {
    firstName: "Samuel", lastName: "Washington",
    email: "s.washington@vumc.org",
    careerStage: "PROFESSOR",
    institution: "Vanderbilt University Medical Center",
    bio: "Professor of Neurology studying the intersection of aging biology and Alzheimer's disease. Lab demonstrated that senolytic treatment reduces amyloid burden and neuroinflammation in aged mouse models. Running a pilot senolytic trial in patients with early-stage MCI.",
    linkedinUrl: "https://linkedin.com/in/samuelwashington-vumc",
    googleScholarUrl: "https://scholar.google.com/citations?user=samuelwashington",
    conferenceGoals: "Share MCI senolytic trial design. Connect with geroscientists to understand the aging component of AD beyond amyloid hypothesis.",
    researchAreas: ["Neurodegeneration", "Cellular Senescence", "Clinical Geroscience"],
    keywords: ["Alzheimer's disease", "senolytics", "neuroinflammation", "amyloid", "SASP", "neurodegeneration", "inflammaging", "clinical trials"],
  },
  {
    firstName: "Benjamin", lastName: "Cole",
    email: "b.cole@stanford.edu",
    careerStage: "EARLY_CAREER_RESEARCHER",
    institution: "Stanford University School of Medicine",
    bio: "Assistant professor studying mTOR complex regulation in the context of tissue aging. Discovered a novel mTORC1 substrate that controls age-related muscle atrophy. Current project uses Torin-1 analogs to achieve tissue-selective mTOR inhibition, avoiding the immunosuppressive effects of systemic rapamycin.",
    linkedinUrl: "https://linkedin.com/in/benjamincole-stanford",
    googleScholarUrl: "https://scholar.google.com/citations?user=benjamincole",
    conferenceGoals: "Discuss selective mTOR inhibition strategies. Connect with pharmaceutical partners for IND-enabling studies.",
    researchAreas: ["mTOR & Nutrient Signaling", "Longevity Biology", "Drug Discovery & Aging"],
    keywords: ["mTOR", "rapamycin", "AMPK", "muscle aging", "sarcopenia", "IGF-1 signaling", "drug discovery", "healthspan"],
  },
  {
    firstName: "Olivia", lastName: "Thompson",
    email: "o.thompson@ncl.ac.uk",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "Newcastle University Institute for Ageing",
    bio: "Reader in Biogerontology leading Newcastle's aging intervention research. Built a platform for rapid testing of pharmacological interventions in old human tissue explants. Currently screening 200+ FDA-approved compounds for pro-longevity effects in aged skeletal muscle.",
    linkedinUrl: "https://linkedin.com/in/oliviathompson-ncl",
    googleScholarUrl: "https://scholar.google.com/citations?user=oliviathompson",
    conferenceGoals: "Share drug repurposing screen results. Identify academic or industry partners for lead compound follow-up.",
    researchAreas: ["Drug Discovery & Aging", "Longevity Biology", "Clinical Geroscience"],
    keywords: ["drug repurposing", "muscle aging", "sarcopenia", "senolytics", "healthspan", "hallmarks of aging", "drug discovery"],
  },
  {
    firstName: "Marcus", lastName: "Brown",
    email: "m.brown@juvenescence.ai",
    careerStage: "INDUSTRY_PROFESSIONAL",
    institution: "Juvenescence",
    bio: "VP Clinical Development at Juvenescence overseeing multiple longevity drug programs in clinical stages. Background in metabolic disease clinical trials. Leading a Phase II trial of JUV-161, a first-in-class AMPK activator, for physical performance in adults 65+.",
    linkedinUrl: "https://linkedin.com/in/marcusbrown-juvenescence",
    conferenceGoals: "Present JUV-161 Phase II design and discuss AMPK activation as a clinical strategy. Connect with KOLs in geriatric medicine.",
    researchAreas: ["Clinical Geroscience", "Metabolic Health & Aging", "Drug Discovery & Aging"],
    keywords: ["AMPK", "metformin", "frailty", "sarcopenia", "clinical trials", "healthspan", "drug development"],
  },
  {
    firstName: "Aisha", lastName: "Patel",
    email: "a.patel@calicolabs.com",
    careerStage: "MID_CAREER_RESEARCHER",
    institution: "Calico Life Sciences",
    bio: "Staff data scientist at Calico building ML models for aging phenotype prediction from multi-omic data. Developed Calico's internal aging atlas integrating 50+ species transcriptomic aging profiles. Interested in identifying conserved aging signatures across the tree of life.",
    linkedinUrl: "https://linkedin.com/in/aishapatel-calico",
    conferenceGoals: "Present cross-species aging transcriptomics atlas. Connect with biologists to validate computationally-predicted conserved aging targets.",
    researchAreas: ["AI & Aging Research", "Genomics & Aging", "Longevity Biology"],
    keywords: ["machine learning", "transcriptomics", "aging clocks", "biological age", "multi-omics", "biomarkers of aging", "bioinformatics"],
  },
  {
    firstName: "Eduardo", lastName: "Fernandez",
    email: "e.fernandez@ub.edu",
    careerStage: "PROFESSOR",
    institution: "University of Copenhagen",
    bio: "Professor of Nutritional Geroscience studying Mediterranean diet components as longevity interventions. Led a 10-year cohort study of 12,000 older adults linking olive oil polyphenols with reduced epigenetic age acceleration. Currently running a 2-year RCT.",
    linkedinUrl: "https://linkedin.com/in/eduardofernandez-aging",
    googleScholarUrl: "https://scholar.google.com/citations?user=eduardofernandez",
    conferenceGoals: "Present polyphenol-epigenetics RCT data. Discuss gut microbiome mediation of dietary longevity effects.",
    researchAreas: ["Metabolic Health & Aging", "Microbiome & Aging", "Clinical Geroscience"],
    keywords: ["Mediterranean diet", "polyphenols", "resveratrol", "epigenetic clock", "microbiome", "inflammaging", "caloric restriction", "healthspan"],
  },
  {
    firstName: "Grace", lastName: "Kim",
    email: "g.kim@jhmi.edu",
    careerStage: "POSTDOC",
    institution: "Johns Hopkins University",
    bio: "Postdoctoral fellow studying how autophagy flux declines in aging neurons and contributes to Parkinson's pathology. Identified a novel autophagy-activating compound, GK-201, that clears α-synuclein aggregates and extends lifespan by 18% in flies.",
    googleScholarUrl: "https://scholar.google.com/citations?user=gracekim",
    conferenceGoals: "Present GK-201 data and find co-investigators for mammalian PD model studies. Explore academic positions at US aging institutes.",
    researchAreas: ["Neurodegeneration", "Proteostasis", "Drug Discovery & Aging"],
    keywords: ["autophagy", "mitophagy", "Parkinson's disease", "neurodegeneration", "proteostasis", "alpha-synuclein", "lifespan extension"],
  },
  {
    firstName: "Daniel", lastName: "Murphy",
    email: "daniel.murphy@healthspanangels.com",
    careerStage: "INVESTOR",
    institution: "Apollo Health Ventures",
    bio: "Angel investor and entrepreneur focused on longevity and healthspan extension. Co-founded two biotech exits in the metabolic disease space. Active board member at three longevity startups. Passionate about democratizing access to longevity interventions.",
    linkedinUrl: "https://linkedin.com/in/danielmurphy-longevity",
    conferenceGoals: "Connect with early-stage founders and academic spinouts. Explore co-investment opportunities in the biomarker and diagnostics space.",
    researchAreas: ["Drug Discovery & Aging", "Clinical Geroscience"],
    keywords: ["healthspan", "longevity", "biomarkers of aging", "aging clocks", "venture", "drug development", "clinical trials"],
  },
  {
    firstName: "Fatima", lastName: "Al-Rashid",
    email: "f.alrashid@kaust.edu.sa",
    careerStage: "PROFESSOR",
    institution: "Max Planck Institute for Biology of Ageing",
    bio: "Associate professor developing pharmacological strategies to extend healthspan in model organisms. Lab pioneered high-throughput drug screening in aged Drosophila and identified three novel compounds that extend fly median lifespan by >30%. Now translating findings to mammalian models.",
    linkedinUrl: "https://linkedin.com/in/fatimaalrashid",
    googleScholarUrl: "https://scholar.google.com/citations?user=fatimaalrashid",
    conferenceGoals: "Share Drosophila longevity compound data. Connect with mammalian aging researchers for translation studies and with industry for licensing.",
    researchAreas: ["Drug Discovery & Aging", "Longevity Biology", "mTOR & Nutrient Signaling"],
    keywords: ["drug discovery", "lifespan extension", "Drosophila", "drug screening", "mTOR", "AMPK", "healthspan", "hallmarks of aging"],
  },
];

// ─── Seed runner ────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding ARDD Conference database...");

  // 1. Institutions
  console.log("  → Creating institutions...");
  const institutionMap = new Map<string, string>(); // name → id
  for (const inst of INSTITUTIONS) {
    const record = await prisma.institution.upsert({
      where: { name: inst.name },
      create: inst,
      update: {},
    });
    institutionMap.set(inst.name, record.id);
  }

  // 2. Research areas
  console.log("  → Creating research areas...");
  const areaMap = new Map<string, string>(); // name → id
  for (const area of RESEARCH_AREAS) {
    const record = await prisma.researchArea.upsert({
      where: { name: area.name },
      create: area,
      update: {},
    });
    areaMap.set(area.name, record.id);
  }

  // 3. Keywords
  console.log("  → Creating keywords...");
  const keywordMap = new Map<string, string>(); // name → id
  for (const name of KEYWORDS) {
    const record = await prisma.keyword.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    keywordMap.set(name, record.id);
  }

  // 4. Users + profiles
  console.log("  → Creating attendees...");
  const defaultPassword = await bcrypt.hash("password123", 12);

  for (const attendee of ATTENDEES) {
    // Upsert user (idempotent re-runs)
    const user = await prisma.user.upsert({
      where: { email: attendee.email },
      create: {
        email: attendee.email,
        passwordHash: defaultPassword,
        profile: {
          create: {
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            careerStage: attendee.careerStage,
            bio: attendee.bio,
            linkedinUrl: attendee.linkedinUrl ?? null,
            googleScholarUrl: attendee.googleScholarUrl ?? null,
            conferenceGoals: attendee.conferenceGoals,
            institutionId: institutionMap.get(attendee.institution) ?? null,
            isPublic: true,
          },
        },
      },
      update: {},
      include: { profile: true },
    });

    const profileId = user.profile?.id;
    if (!profileId) continue;

    // Connect research areas
    const areaIds = attendee.researchAreas
      .map((name) => areaMap.get(name))
      .filter(Boolean) as string[];

    await prisma.attendeeResearchArea.deleteMany({ where: { profileId } });
    await prisma.attendeeResearchArea.createMany({
      data: areaIds.map((researchAreaId) => ({ profileId, researchAreaId })),
      skipDuplicates: true,
    });

    // Connect keywords (upsert any that aren't in the master list)
    const kwIds: string[] = [];
    for (const kwName of attendee.keywords) {
      let id = keywordMap.get(kwName);
      if (!id) {
        const kw = await prisma.keyword.upsert({
          where: { name: kwName },
          create: { name: kwName },
          update: {},
        });
        id = kw.id;
        keywordMap.set(kwName, id);
      }
      kwIds.push(id);
    }

    await prisma.attendeeKeyword.deleteMany({ where: { profileId } });
    await prisma.attendeeKeyword.createMany({
      data: kwIds.map((keywordId) => ({ profileId, keywordId })),
      skipDuplicates: true,
    });
  }

  console.log(`✓ Seeded ${ATTENDEES.length} attendees, ${INSTITUTIONS.length} institutions, ${RESEARCH_AREAS.length} research areas`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
