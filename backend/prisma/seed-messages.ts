/**
 * Seed: realistic ARDD messaging conversations between existing profiles
 * Run: npx tsx prisma/seed-messages.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Realistic ARDD conversation threads ──────────────────────────────────────

interface Thread {
  messages: { senderIndex: 0 | 1; content: string }[];
}

const THREADS: Thread[] = [
  {
    messages: [
      { senderIndex: 0, content: "Hi! I caught your poster on senolytic combinations this morning — the synergy data with dasatinib + quercetin in lung tissue was really compelling. Are you presenting any unpublished extension data at the talk tomorrow?" },
      { senderIndex: 1, content: "Thanks so much for stopping by! Yes, the full talk tomorrow has 6-month follow-up in IPF patients. The effect size held up better than we expected. Would love to chat about the mechanism side — are you free for coffee around 8am before the sessions?" },
      { senderIndex: 0, content: "Absolutely, 8am works perfectly. I'll bring our latest SASP proteomics data — there might be some overlap with what you're seeing clinically. See you at the conference café." },
      { senderIndex: 1, content: "Perfect. Looking forward to it. I'll flag you on LinkedIn afterwards too so we can keep the conversation going after the conference." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hello Dr. Chen — I'm reaching out because I'm actively looking at Series A opportunities in cellular senescence. Your work on SASP biology is exactly the kind of foundational science we like to back. Do you have 20 minutes this week to discuss the IP landscape around your lead compound?" },
      { senderIndex: 1, content: "Hi Alex, appreciate you reaching out. We do have a compound in IND-enabling studies. I'm protective about timing but happy to have a preliminary conversation. Are you available Thursday afternoon after the plenary?" },
      { senderIndex: 0, content: "Thursday 4pm works great. I'll bring our standard NDA — we can do a proper scientific exchange. Our portfolio already has two senolytic companies so we understand the space well." },
      { senderIndex: 1, content: "Great, see you then. FWIW we've had inbound from two other funds this week so I want to move thoughtfully. Looking forward to the conversation." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hey Emily, I saw your talk on partial reprogramming in retinal cells — really elegant use of the Dox-inducible system. I'm working on similar problems in muscle tissue at Altos. Have you thought about delivery approaches for non-ocular tissues?" },
      { senderIndex: 1, content: "Hi Rachel! Yes, ocular delivery is relatively easy but muscle is a completely different beast. We've been looking at AAV9 but the capacity constraints with 4-factor OSKM are tough. What are you using?" },
      { senderIndex: 0, content: "We're testing a truncated OSK (no c-Myc) with dual AAV vectors. Early data is promising but the efficiency is lower. Worth a deeper discussion — can I share a preprint with you? It's embargoed but I can share under confidentiality." },
      { senderIndex: 1, content: "Absolutely, I'd love to read it. My email is e.nakamura@hms.harvard.edu. This could be really complementary to what I'm doing — maybe a co-first paper opportunity down the line?" },
      { senderIndex: 0, content: "Sending it now. And yes, I was thinking the same thing. Altos is very open to academic collaborations when it's the right science fit." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hi Sophia, loved your poster on the multi-modal aging clock. The proteomics integration layer is something we've been struggling with at Calico. What dimensionality reduction approach worked best for you?" },
      { senderIndex: 1, content: "Thanks Aisha! We tried PCA, UMAP, and learned embeddings — ultimately a variational autoencoder gave the best biological interpretability. The key insight was training on the healthy aging trajectory rather than cross-sectional age. Happy to share the architecture details." },
      { senderIndex: 0, content: "That's a really elegant framing. Would you be open to a virtual meeting next week? Our team has 50+ species data that might be a great stress test for your model — could be mutually beneficial." },
      { senderIndex: 1, content: "I'd love that! I'm looking for validation datasets and cross-species transfer learning is something I want to explore for my thesis. Let me grab your card and we can set something up." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Dr. Washington — I'm reaching out because we're also running a senolytic trial, but in frailty rather than AD. Your MCI trial design looked very clean. Would you be willing to share your biomarker panel selection rationale? We're wrestling with endpoint choice right now." },
      { senderIndex: 1, content: "Happy to share, David. We landed on a panel of 5 markers: p16 in T-cells, CXCL10, GDF15, IL-6, and episcore biological age. The p16 T-cell assay is the most mechanistically direct. What's your primary endpoint?" },
      { senderIndex: 0, content: "We're using SPPB as the primary functional endpoint with p16 as a key secondary. Your IL-6 and GDF15 additions make sense — I'll propose adding those to our monitoring panel. Could we do a 30-min call after the conference to compare notes?" },
      { senderIndex: 1, content: "Absolutely. A multi-site consortium across our two trials would also be worth discussing — shared controls would significantly increase statistical power. I'll have my coordinator reach out to schedule." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hi Mei! Your plasma proteome aging clock work is directly relevant to something we're building at NIA. The GDF15 findings in particular — have you looked at it as a causal driver vs. just a marker?" },
      { senderIndex: 1, content: "Hi Dr. Nwosu! Yes, this is actually the core question of my thesis. We have some parabiosis data in mice suggesting GDF15 is downstream of inflammaging rather than upstream, but the evidence is incomplete. Do you have longitudinal BLSA samples available for validation?" },
      { senderIndex: 0, content: "We have 20-year longitudinal plasma for ~600 BLSA participants with full proteomics. This is exactly the validation dataset you'd need. Let's talk about a data sharing agreement — NIA is very open to collaborations that advance the field." },
      { senderIndex: 1, content: "That would be incredible for my dissertation. I'll send you my IRB protocol and data analysis plan. This could answer the causality question definitively with the longitudinal design." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "William, congrats on the NewLimit raise — I saw the announcement. I've been working on epigenetic reprogramming in muscle aging and I think there might be a nice industry-academic partnership angle here. Our HSF1 activator data might actually complement your epigenetic approach." },
      { senderIndex: 1, content: "Thanks Jennifer! The proteostasis-epigenetics connection is really interesting — there's evidence that proteostasis collapse precedes and maybe drives epigenetic dysregulation. What's your mechanism hypothesis?" },
      { senderIndex: 0, content: "Exactly that — we think HSF1 loss in aged cells creates a stress response deficit that allows epigenetic entropy to accelerate. We haven't published this yet but I'd love to share the model with your team. It could actually inform which cell types you prioritize for reprogramming." },
      { senderIndex: 1, content: "This is exactly the kind of mechanistic insight we need to contextualize our computational predictions. Can we set up a call with our biology team next week? I think this is worth exploring seriously." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hi Hassan, your microbiome transplant trial design was fascinating — especially the centenarian-to-young direction. Have you seen any cognitive effects in the recipients, or is it too early in the follow-up?" },
      { senderIndex: 1, content: "Hi Eduardo! It's too early for hard cognitive endpoints but we're seeing interesting inflammatory marker changes that suggest CNS-relevant effects — reduced IL-6 and TNF-α at 3 months. The gut-brain axis angle is something I want to explore more rigorously. Your dietary work might actually be upstream of what we're seeing." },
      { senderIndex: 0, content: "Almost certainly — we see very similar inflammatory marker profiles in the high adherence Mediterranean diet group. The polyphenol-microbiome interaction is probably the mechanism. Would you consider adding a dietary arm to your transplant trial? It could help disambiguate the causal pathway." },
      { senderIndex: 1, content: "That's a brilliant idea. A 2x2 factorial design — transplant vs. control, high polyphenol diet vs. standard — would give us real mechanistic resolution. Let's write a grant together. I have strong BBSRC connections and you must have EU Horizon relationships." },
      { senderIndex: 0, content: "EU Horizon Rising project just opened — this is perfect timing. I'll draft a 1-page concept note this week and send it over. Let's connect our institutions' grant offices." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Amanda — impressive CRISPR screen work for a PhD student. The NF-κB network as a hub for SASP regulation makes complete sense mechanistically. Have you identified any hits that are tractable drug targets?" },
      { senderIndex: 1, content: "Thank you Dr. Foster! Yes, we have three hits that are either existing drug targets or have known chemical matter. I'm a bit cautious about sharing specifics in public but I'd love to get your perspective as someone who has translated senescence work to the clinic. Do you have 20 minutes?" },
      { senderIndex: 0, content: "Of course, I'd be happy to give feedback. I can also connect you with our tech transfer office if the IP looks promising. Meet me at the poster area around 5pm today?" },
      { senderIndex: 1, content: "That would be amazing — thank you so much. This is exactly why I wanted to attend ARDD. I'll see you at 5pm, poster #47." },
    ],
  },
  {
    messages: [
      { senderIndex: 0, content: "Hi Benjamin, your selective mTOR inhibition approach is really elegant. The tissue-selectivity challenge is the biggest bottleneck in rapamycin translation. Are your Torin analogs hitting any off-targets in your screens?" },
      { senderIndex: 1, content: "Hi Yuki! The selectivity profile is actually cleaner than full rapamycin — we're seeing muscle-preferential distribution at 10:1 ratio over lymphoid tissue. The immunosuppression issue that's plagued rapamycin trials seems much reduced. How does it compare to your C. elegans combinations?" },
      { senderIndex: 0, content: "Interesting — in our screens, the mTOR component of synergistic combinations always worked best when combined with NAD+ precursors rather than metformin. Have you tested NMN combinations? The complementary pathways might give you additive effects without overlapping toxicity." },
      { senderIndex: 1, content: "We haven't systematically screened combination partners yet — that's a gap in our program. Could I visit your lab sometime this spring? The C. elegans screening platform sounds like exactly what we'd need to triage combination partners efficiently." },
    ],
  },
];

// ─── Seed runner ────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding ARDD messaging conversations...");

  // Fetch existing profiles so we can pair them up
  const profiles = await prisma.profiles.findMany({
    select: { id: true, name: true, email: true },
    take: 20,
    orderBy: { created_at: "asc" },
  });

  if (profiles.length < 2) {
    console.log("⚠️  Need at least 2 profiles in the database. Run the backend and create some profiles first.");
    return;
  }

  console.log(`  Found ${profiles.length} profiles — creating ${Math.min(THREADS.length, Math.floor(profiles.length / 2))} conversations`);

  let conversationsCreated = 0;
  let messagesCreated = 0;

  for (let i = 0; i < THREADS.length && i * 2 + 1 < profiles.length; i++) {
    const profileA = profiles[i * 2];
    const profileB = profiles[i * 2 + 1];
    const thread = THREADS[i];

    // Create conversation
    const conversation = await prisma.conversations.create({
      data: {
        participants: {
          create: [
            { profile_id: profileA.id },
            { profile_id: profileB.id },
          ],
        },
      },
    });

    // Seed messages with realistic timestamps spread over the conference
    const baseTime = new Date("2025-10-14T09:00:00Z"); // ARDD conference day 1
    for (let j = 0; j < thread.messages.length; j++) {
      const msg = thread.messages[j];
      const senderId = msg.senderIndex === 0 ? profileA.id : profileB.id;
      const msgTime = new Date(baseTime.getTime() + i * 3_600_000 + j * 900_000); // space out by 15min

      await prisma.messages.create({
        data: {
          conversation_id: conversation.id,
          sender_id: senderId,
          content: msg.content,
          created_at: msgTime,
        },
      });
      messagesCreated++;
    }

    // Update conversation updated_at to last message time
    await prisma.conversations.update({
      where: { id: conversation.id },
      data: { updated_at: new Date(baseTime.getTime() + i * 3_600_000 + (thread.messages.length - 1) * 900_000) },
    });

    console.log(`  ✓ Conversation between ${profileA.name} ↔ ${profileB.name} (${thread.messages.length} messages)`);
    conversationsCreated++;
  }

  console.log(`\n✓ Seeded ${conversationsCreated} conversations, ${messagesCreated} messages`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
