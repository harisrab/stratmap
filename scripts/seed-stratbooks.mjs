// Seeds Supabase Storage with three example stratbooks.
//
// Each stratbook is a top-level folder named with a 10-char nanoid, mirroring
// what `createProject()` in src/lib/stratmap/workspace.ts does. The folder
// contains:
//   - project.json   (Project metadata read by listProjects())
//   - notes/*.md     (markdown notes; geo-anchored notes have YAML frontmatter
//                     with a `geo: { lat, lng, label }` block)
//
// Run from the stratmap project root:
//   node scripts/seed-stratbooks.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// SUPABASE_STORAGE_BUCKET from .env (or the process environment).

import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─── env loading ─────────────────────────────────────────────────────────────
// We do a minimal .env parse rather than pulling dotenv: the file format is
// simple `KEY=value` lines and we want zero new deps.

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env");
try {
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let [, key, value] = m;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // env file is optional; fall through to process.env
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "stratmap-workspace";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ─── upload helpers ──────────────────────────────────────────────────────────

async function upload(path, content, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([content], { type: contentType }), {
      contentType,
      upsert: true,
    });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
}

/**
 * Render a markdown file. If `geo` is provided, prepend YAML frontmatter
 * matching the shape that workspace.ts → extractLocationFromMarkdown reads.
 */
function renderNote({ body, geo }) {
  if (!geo) return body;
  const labelLine = geo.label ? `\n  label: ${JSON.stringify(geo.label)}` : "";
  return `---\ngeo:\n  lat: ${geo.lat}\n  lng: ${geo.lng}${labelLine}\n---\n\n${body}`;
}

async function seedProject({ name, description, notes }) {
  const id = nanoid(10);
  const project = {
    id,
    name,
    description,
    createdAt: new Date().toISOString(),
    onboardingComplete: true,
  };
  await upload(
    `${id}/project.json`,
    JSON.stringify(project, null, 2),
    "application/json; charset=utf-8"
  );

  for (const note of notes) {
    const md = renderNote(note);
    await upload(`${id}/notes/${note.filename}`, md, "text/markdown; charset=utf-8");
  }

  console.log(`✓ ${name}  (${id})  ${notes.length} notes`);
  return id;
}

// ─── content ─────────────────────────────────────────────────────────────────
// All three stratbooks below. Notes are deliberately concise analyst-style
// briefs — enough to demo the product without wandering into commentary on
// fast-moving frontline detail.

const middleEast = {
  name: "Middle East — Strategic Outlook",
  description:
    "Conflict, chokepoints, and shifting alignments across the Levant, Gulf, and Red Sea.",
  notes: [
    {
      filename: "00-overview.md",
      body: `# Overview

The post-October-7 Middle East is defined by four interlocking pressure points:

1. **Israel and the Iran-aligned axis** — Hamas in Gaza, Hezbollah in southern Lebanon, the Houthis in Yemen, and Shia militias in Iraq and Syria.
2. **Iran's nuclear program**, which crossed the 60% enrichment threshold in 2023 and remains the dominant proliferation concern in the region.
3. **Maritime chokepoints** — the Strait of Hormuz (≈20% of global oil) and Bab el-Mandeb (≈12% of global trade), both directly threatened by state and non-state actors.
4. **Gulf realignment** — UAE/Bahrain normalization with Israel under the Abraham Accords, Saudi-Iran rapprochement brokered by China in March 2023, and a halting Saudi-Israeli normalization track that froze after October 7.

Use the map-anchored notes in this stratbook to navigate by geography rather than headline.`,
    },
    {
      filename: "gaza-strip.md",
      geo: { lat: 31.5017, lng: 34.4668, label: "Gaza City" },
      body: `# Gaza Strip

A 365 km² coastal enclave with a pre-war population of ~2.2 million, governed by Hamas since its 2007 takeover. The October 7, 2023 attack on southern Israel killed roughly 1,200 people and triggered the most destructive Israeli military campaign in the territory's history.

**Key dynamics:**
- **Humanitarian collapse.** UN agencies have repeatedly described conditions as catastrophic, with displacement affecting the vast majority of the population.
- **Tunnel network.** Hamas's "Gaza Metro" — hundreds of kilometers of subterranean infrastructure — has been the central operational challenge for the IDF.
- **Day-after question.** No durable governance model has been agreed. Proposals range from a reformed Palestinian Authority to Arab-state-led transitional administration to continued Israeli security control.
- **Rafah and the Egyptian border.** The Philadelphi Corridor along the Egypt-Gaza border has been a flashpoint over smuggling and any future buffer arrangement.`,
    },
    {
      filename: "southern-lebanon.md",
      geo: { lat: 33.5, lng: 35.5, label: "Southern Lebanon" },
      body: `# Southern Lebanon — Hezbollah Front

Hezbollah opened a "support front" against Israel on October 8, 2023, exchanging cross-border fire across the Blue Line for nearly a year. The conflict escalated dramatically in September 2024 with the pager and walkie-talkie attacks against Hezbollah operatives, followed by the killing of Secretary-General Hassan Nasrallah on September 27, 2024.

A US-brokered ceasefire took effect on November 27, 2024. Its core terms:
- **60-day Israeli withdrawal** from southern Lebanon.
- **Hezbollah pullback** north of the Litani River.
- **LAF (Lebanese Armed Forces) deployment** to the south, alongside an enhanced UNIFIL mandate.
- **US-led monitoring mechanism** to adjudicate violations.

**Open questions:** Hezbollah's degraded but not destroyed missile arsenal, the political weight of a movement whose senior leadership was decapitated, and Lebanon's own paralyzed state institutions.`,
    },
    {
      filename: "strait-of-hormuz.md",
      geo: { lat: 26.55, lng: 56.25, label: "Strait of Hormuz" },
      body: `# Strait of Hormuz

The most strategically significant maritime chokepoint in the world. At its narrowest, the strait is roughly 33 km wide, with a 3 km wide shipping channel in each direction.

**Why it matters:**
- Roughly **20% of global petroleum liquids** transit Hormuz daily — the bulk of crude exports from Saudi Arabia, the UAE, Iraq, Kuwait, Qatar, and Iran itself.
- Approximately **one third of global LNG trade** passes through, dominated by Qatari shipments.
- Iran's IRGC Navy operates a large fleet of small fast-attack craft from coastal bases (Bandar Abbas, Bandar-e-Jask), and has periodically detained foreign-flagged tankers.

**Bypass capacity is limited.** Saudi Arabia's East-West Pipeline (~5 mbpd) and the UAE's Habshan-Fujairah line (~1.8 mbpd) provide only partial alternatives. Closing or seriously disrupting Hormuz would be a global energy event.`,
    },
    {
      filename: "bab-el-mandeb.md",
      geo: { lat: 12.58, lng: 43.32, label: "Bab el-Mandeb" },
      body: `# Bab el-Mandeb — Red Sea Chokepoint

The 30 km wide strait between Yemen and Djibouti/Eritrea — gateway between the Red Sea and the Gulf of Aden, and by extension between the Suez Canal and the Indian Ocean.

**The Houthi shipping campaign:** Beginning in November 2023, Yemen's Houthi movement launched anti-ship missiles, drones, and uncrewed surface vessels against commercial traffic, declaring solidarity with Gaza. Effects included:

- **Suez Canal traffic collapsed** by roughly 50–70% versus pre-war baselines as carriers rerouted around the Cape of Good Hope (adds ~10–14 days to Asia–Europe transit).
- **Operation Prosperity Guardian** (US-led, December 2023) and the parallel EU **Operation Aspides** provided convoy protection.
- **US and UK strikes** on Houthi targets in Yemen began January 2024 and continued at varying intensity.

The episode exposed the fragility of Red Sea trade and renewed strategic interest in alternative routes — the IMEC corridor, the Northern Sea Route, and overland China-Europe rail.`,
    },
    {
      filename: "natanz-iran.md",
      geo: { lat: 33.7244, lng: 51.7167, label: "Natanz" },
      body: `# Natanz — Iran's Enrichment Hub

Iran's primary uranium enrichment site, located near the city of Natanz in Isfahan Province. Hosts the **Fuel Enrichment Plant (FEP)** above ground and the heavily fortified **Fordow-style underground hall** built into Mount Kolang Gaz La.

**Status:**
- Iran has enriched uranium to 60% U-235 since 2021 — a short technical step from weapons-grade (90%).
- The IAEA has lost continuous monitoring access in stages since 2021.
- The site has been the target of multiple attributed and unattributed sabotage events, most notably the April 2021 power-system attack and the 2010 Stuxnet operation.

**Strategic context:** Israel has long signaled willingness to act unilaterally if Iran moves to weaponize. The collapse of the JCPOA in 2018, the breakdown of restoration talks, and Iran's accelerating program have left the region with no agreed diplomatic framework.`,
    },
    {
      filename: "abu-dhabi-uae.md",
      geo: { lat: 24.4539, lng: 54.3773, label: "Abu Dhabi" },
      body: `# Abu Dhabi — UAE as Diplomatic Hub

The UAE has emerged as one of the most consequential middle powers in the region, balancing relationships that few other states can hold simultaneously.

**Anchor positions:**
- **Abraham Accords (2020)** — full normalization with Israel, including embassy exchange, direct flights, and rapidly growing trade.
- **Iran reset (2023)** — restored ambassador-level ties despite continuing rivalry on Yemen and the disputed Tunbs/Abu Musa islands.
- **China partnership** — comprehensive strategic partnership; Chinese Belt and Road infrastructure investment alongside continued US security ties.
- **Africa and South Asia** — major investor in port infrastructure (DP World) from Berbera to Karachi.

**Tensions to watch:** UAE involvement in Sudan's civil war (alleged backing of the RSF), competition with Saudi Arabia over regional leadership, and the long-running fault lines of the 2017–2021 Qatar blockade.`,
    },
    {
      filename: "damascus-post-assad.md",
      geo: { lat: 33.5138, lng: 36.2765, label: "Damascus" },
      body: `# Damascus — Post-Assad Syria

Bashar al-Assad's regime collapsed in early December 2024 after a lightning offensive led by **Hayat Tahrir al-Sham (HTS)** from Idlib swept through Aleppo, Hama, Homs, and finally the capital. Assad fled to Moscow on December 8, 2024.

**Immediate aftermath:**
- HTS leader Ahmed al-Sharaa (Abu Mohammed al-Jolani) emerged as the dominant figure of a transitional administration.
- Israeli forces moved into the buffer zone on Mount Hermon and conducted extensive airstrikes against former regime weapons stockpiles to prevent transfer to hostile actors.
- Russian forces consolidated at the Khmeimim airbase and Tartus naval facility, with their long-term status uncertain.
- Turkey, the US (via SDF partnership in the northeast), and Israel each hold de facto zones of influence.

**Open questions:** Whether HTS's stated moderation translates into pluralist governance, the fate of Kurdish-held northeast Syria, and whether Captagon trafficking — a regime cash cow — is dismantled or simply changes hands.`,
    },
  ],
};

const taiwan = {
  name: "Taiwan Strait — Flashpoint Atlas",
  description:
    "Cross-strait military, economic, and alliance geography around the Taiwan Strait.",
  notes: [
    {
      filename: "00-overview.md",
      body: `# Overview

The Taiwan Strait is the most likely venue for a great-power war in the next decade. The strategic problem has three layers:

1. **The cross-strait military balance.** PLA modernization since the 1996 Taiwan Strait Crisis has produced a force posture explicitly designed for an anti-access / area-denial campaign against US intervention.
2. **The semiconductor chokehold.** TSMC manufactures the overwhelming majority of leading-edge logic chips. Disruption — by blockade, kinetic action, or cyber — is a global economic event, not a regional one.
3. **The alliance lattice.** US treaty obligations to Japan, the Philippines, South Korea, and Australia all activate in any major Taiwan contingency. AUKUS, the Quad, and reinvigorated US-Japan-South Korea trilateral cooperation form the backdrop.

This stratbook anchors the geography. The notes are intentionally short — the value is in seeing the spatial relationships at a glance.`,
    },
    {
      filename: "taipei.md",
      geo: { lat: 25.033, lng: 121.5654, label: "Taipei" },
      body: `# Taipei — ROC Capital

Political center of the Republic of China (Taiwan). President **Lai Ching-te (William Lai)** of the Democratic Progressive Party took office in May 2024, succeeding Tsai Ing-wen. The DPP holds the presidency but lost its legislative majority — the Kuomintang (KMT) and Taiwan People's Party (TPP) together control the Legislative Yuan, producing a contested political environment over defense spending and cross-strait policy.

**Defense posture:**
- Defense spending rising toward ~2.5% of GDP, with ambitions to reach 3%.
- Conscription extended to 12 months from January 2024.
- Asymmetric / "porcupine" strategy emphasizing mobile missile launchers, sea mines, drones, and reservist mobilization over big-ticket platforms.
- US arms sales notification backlog includes F-16Vs, HIMARS, NSM coastal-defense systems, and Stinger missiles.`,
    },
    {
      filename: "taiwan-strait.md",
      geo: { lat: 24.5, lng: 120.0, label: "Taiwan Strait median line" },
      body: `# The Strait

The body of water separating Taiwan from mainland Fujian. Approximately **180 km wide on average, 130 km at its narrowest**. The unofficial median line, observed for decades as a tacit boundary, has been routinely crossed by PLA aircraft since August 2022 following Speaker Pelosi's visit.

**PLA activity baseline (2024–2025):**
- Daily ADIZ incursions, frequently in the dozens of sorties.
- Large-scale exercises such as **Joint Sword 2024A and 2024B** simulating blockade and joint fires.
- Naval presence routinely encircling the island.

**Geography for an amphibious operation:**
- Only a handful of beaches on Taiwan's west coast are suitable for large-scale landings.
- The strait's monsoon and typhoon seasons compress the operational window to roughly April–May and September–October.
- Mudflats on the Fujian coast complicate embarkation.`,
    },
    {
      filename: "kinmen.md",
      geo: { lat: 24.4488, lng: 118.3171, label: "Kinmen" },
      body: `# Kinmen — Frontline Outpost

ROC-controlled island group sitting roughly **3 km from the mainland city of Xiamen** and over 180 km from Taiwan proper. Kinmen was the site of the 1958 artillery crisis and remains a politically resonant frontline.

**Recent dynamics:**
- The February 2024 deaths of two Chinese fishermen during a ROC Coast Guard pursuit triggered an extended period of PRC coast-guard "patrols" inside Kinmen-claimed waters, eroding the previously tacit operational boundary.
- Cross-strait tourism and the "small three links" trade have made Kinmen economically interdependent with Xiamen.
- In a contingency, Kinmen would likely be cut off rapidly and is widely treated as politically symbolic rather than militarily defensible.`,
    },
    {
      filename: "hsinchu-tsmc.md",
      geo: { lat: 24.7783, lng: 120.9942, label: "Hsinchu Science Park" },
      body: `# Hsinchu — TSMC Heartland

Home to **Taiwan Semiconductor Manufacturing Company's** main fabrication complex. TSMC produces an estimated **90%+ of the world's most advanced (≤5nm) logic chips** and the majority of all leading-edge nodes used in AI accelerators, smartphones, and high-end automotive computing.

**Why this matters strategically:**
- A blockade or strike on Hsinchu would create a multi-year gap in global advanced-chip supply.
- TSMC's overseas expansion (Arizona, Kumamoto, Dresden) is real but limited in scale and trails the leading edge by 1–2 nodes.
- Industry observers refer to a "**silicon shield**" thesis — that the West's chip dependence deters PRC action — but this assumption is contested by analysts who note that Beijing may discount global economic costs in a sufficiently high-stakes scenario.

**The Hsinchu Science Park** itself hosts dozens of supplier firms, making the geographic concentration of risk acute.`,
    },
    {
      filename: "fujian-rocket-force.md",
      geo: { lat: 26.0745, lng: 119.2965, label: "Fuzhou" },
      body: `# Fujian Coast — PLA Rocket Force Posture

The mainland Fujian and eastern Guangdong coastlines host the bulk of **PLARF (PLA Rocket Force)** brigades fielding short- and medium-range conventional ballistic and cruise missiles oriented on Taiwan.

**Force structure highlights:**
- **DF-11 / DF-15** SRBMs in the hundreds — the legacy strike force.
- **DF-16** medium-range ballistic missiles for hardened targets.
- **DF-17** hypersonic glide vehicle, deployed since ~2020.
- **CJ-10 / CJ-100** ground-launched cruise missiles for stand-off strike.
- **DF-26** "carrier killer" intermediate-range systems for US and allied surface combatants east of Taiwan.

The Eastern Theater Command headquartered in Nanjing exercises operational control and has held its capstone joint exercises in this geography since 2022.`,
    },
    {
      filename: "yokosuka.md",
      geo: { lat: 35.2839, lng: 139.6722, label: "Yokosuka Naval Base" },
      body: `# Yokosuka — US 7th Fleet HQ

Forward-deployed home of the **US Navy's 7th Fleet** and the only US carrier strike group permanently based outside the continental US (USS Ronald Reagan, replaced by USS George Washington in late 2024).

**Why Yokosuka anchors any Taiwan contingency:**
- Hosts the carrier, an Aegis-equipped surface action group, and amphibious shipping.
- Co-located with Japanese Maritime Self-Defense Force assets — interoperability is unusually deep.
- Within ~2,000 km of Taiwan — the operational reach question is how to keep the base, and the surrounding Japanese basing complex (Sasebo, Iwakuni, Kadena), inside the fight under sustained PLARF attack.

The US-Japan alliance has progressively shifted from a passive "shield and spear" division toward integrated operational planning, particularly after the 2022 Japanese National Security Strategy authorized counter-strike capabilities.`,
    },
    {
      filename: "luzon-strait.md",
      geo: { lat: 20.5, lng: 121.5, label: "Luzon Strait / Bashi Channel" },
      body: `# Luzon Strait — Southern Approach

The body of water between Taiwan and the northern Philippines, comprising the Bashi, Balintang, and Babuyan channels. Strategically vital for two reasons:

1. **PLA submarine egress.** The strait is one of the few deep-water passages from the South China Sea to the Western Pacific. PLAN submarines transiting to "deep dive" patrol stations must run this gauntlet.
2. **US allied access.** The 2023 expansion of the **US-Philippines EDCA** (Enhanced Defense Cooperation Agreement) added four new bases, three of which face Taiwan and the South China Sea — most notably Naval Base Camilo Osias and Lal-lo Airport in Cagayan, less than 400 km from Taiwan's southern coast.

The Marcos administration's tilt back toward the US and its more confrontational posture on the South China Sea (Second Thomas Shoal, Scarborough Shoal) have made Manila a more consequential ally than at any point since the early 2000s.`,
    },
  ],
};

const ukraine = {
  name: "Russia–Ukraine War — Operational Map",
  description:
    "Frontline geography, strategic depth, and key infrastructure of the post-2022 war.",
  notes: [
    {
      filename: "00-overview.md",
      body: `# Overview

Russia's full-scale invasion began on February 24, 2022. After the failure of the initial drive on Kyiv, the war settled into a brutal positional contest concentrated in eastern and southeastern Ukraine.

**The war by phase:**
1. **Feb–Apr 2022:** Failed multi-axis invasion; Russian withdrawal from northern Ukraine.
2. **Apr–Sep 2022:** Russian advances in Donbas (Severodonetsk, Lysychansk).
3. **Sep–Nov 2022:** Ukrainian counteroffensives recapture Kharkiv Oblast and Kherson city.
4. **2023:** Ukrainian summer counteroffensive falls short of operational breakthrough; Wagner mutiny and Prigozhin's death.
5. **2024:** Russian initiative returns. Avdiivka falls in February; sustained pressure on Pokrovsk axis. Ukrainian incursion into Kursk Oblast in August.
6. **2025–onward:** Attritional contest along an ~1,000 km front; long-range strike campaigns against Russian energy infrastructure and Ukrainian power grid.

This stratbook anchors the major nodes — political centers, fronts, and contested infrastructure.`,
    },
    {
      filename: "kyiv.md",
      geo: { lat: 50.4501, lng: 30.5234, label: "Kyiv" },
      body: `# Kyiv — Political Center

Ukraine's capital and the failed objective of the initial Russian invasion. The Kyiv Offensive (February–April 2022) saw Russian airborne forces seize Hostomel airport but fail to take it, while armored columns from Belarus stalled along the Hostomel–Bucha–Irpin axis. Russian forces withdrew at the end of March.

**Since 2022, Kyiv has been the focal point of:**
- Sustained long-range air defense operations against Russian missile and Shahed drone attacks (peak intensities of hundreds of inbound munitions per night).
- Diplomacy — almost every Western leader of consequence has visited.
- Domestic politics under wartime conditions: martial law, suspended elections, and a contested debate over postwar political reform.`,
    },
    {
      filename: "pokrovsk-axis.md",
      geo: { lat: 48.2818, lng: 37.1781, label: "Pokrovsk" },
      body: `# Pokrovsk Axis — 2024–2025 Main Effort

After the February 2024 fall of Avdiivka, Russian forces oriented their main effort on the **Pokrovsk axis** in western Donetsk Oblast. Pokrovsk is a critical road and rail junction supporting Ukrainian logistics across the entire Donetsk front.

**Why it matters:**
- Sits on the **H-15 highway** linking Dnipro to the Donetsk frontline.
- Loss would force Ukrainian forces in the Kostyantynivka–Kramatorsk–Sloviansk fortress belt to reroute supply via more exposed corridors.
- Russian advance through 2024 was measured in kilometers per month — slow but steady, reliant on glide-bomb saturation, infantry assault groups, and exploitation of Ukrainian manpower shortages.

The Pokrovsk fight is the clearest current illustration of attritional positional warfare: high cost, low operational tempo, decisive cumulative effect.`,
    },
    {
      filename: "avdiivka.md",
      geo: { lat: 48.1395, lng: 37.7426, label: "Avdiivka" },
      body: `# Avdiivka — Fall, February 2024

A fortified Ukrainian-held town on the northern outskirts of Russian-occupied Donetsk city. Avdiivka had been on the line of contact since 2014 and was hardened over a decade.

**The 2023–24 battle:**
- Russian assault began October 2023 with concentric attacks from the north and south aimed at encircling the town.
- The Avdiivka Coke Plant — a fortified industrial complex on the northern edge — became the symbolic redoubt.
- Withdrawal ordered by Ukrainian command on **February 17, 2024** under newly appointed C-in-C Oleksandr Syrskyi, citing the cost of holding versus the operational gain.

Avdiivka's loss marked the first significant Russian territorial gain since the May 2023 capture of Bakhmut and shifted operational momentum into the Pokrovsk push.`,
    },
    {
      filename: "kharkiv.md",
      geo: { lat: 49.9935, lng: 36.2304, label: "Kharkiv" },
      body: `# Kharkiv — Northern Front

Ukraine's second-largest city, located **~30 km from the Russian border**. Kharkiv was besieged but not captured in 2022, and recaptured surrounding Kharkiv Oblast in the September 2022 counteroffensive that broke the Russian northern line at Izyum.

**The May 2024 cross-border offensive:**
- Russian forces launched a new ground operation across the international border into northern Kharkiv Oblast on May 10, 2024.
- Initial gains around Vovchansk and Lyptsi were halted within roughly 10 km, but the operation forced Ukraine to commit reserves and exposed the political constraint that had prevented Western-supplied weapons from striking targets inside Russia.
- That constraint was relaxed for limited cross-border use in late May 2024, opening a new dimension to the war.

Kharkiv itself remains under sustained S-300, Iskander, and glide-bomb attack — the city is within range of weapons systems that cannot be effectively intercepted at the volumes used.`,
    },
    {
      filename: "crimea-sevastopol.md",
      geo: { lat: 44.6166, lng: 33.5254, label: "Sevastopol" },
      body: `# Sevastopol — Black Sea Fleet HQ

Headquarters of Russia's **Black Sea Fleet**, illegally annexed by Russia in 2014. The fleet has been the target of a sustained Ukrainian long-range strike and naval drone campaign that has fundamentally altered the maritime balance.

**Notable losses include:**
- Cruiser **Moskva** (April 2022, Neptune ASCM).
- Landing ship **Saratov** (March 2022, Berdyansk port).
- Submarine **Rostov-on-Don** and landing ship **Minsk** (Storm Shadow strikes on Sevastopol drydock, September 2023).
- Multiple small craft and patrol vessels lost to Magura V5 and Sea Baby unmanned surface vessels.

By late 2023 the operational headquarters of the Black Sea Fleet had effectively relocated east to **Novorossiysk**, and Ukrainian commercial shipping resumed from Odesa through a **western Black Sea corridor** hugging the Romanian and Bulgarian coastlines.`,
    },
    {
      filename: "zaporizhzhia-npp.md",
      geo: { lat: 47.5119, lng: 34.5856, label: "Zaporizhzhia NPP" },
      body: `# Zaporizhzhia Nuclear Power Plant

The **largest nuclear power plant in Europe** (six VVER-1000 reactors, ~5,700 MW installed capacity), located near Enerhodar on the south bank of the Dnipro reservoir. Seized by Russian forces in early March 2022 and operated under occupation since.

**The safety picture:**
- All six reactors have been in cold or hot shutdown for extended periods, but the plant still requires power for cooling and spent-fuel management.
- The June 2023 destruction of the **Kakhovka Dam** downstream emptied the reservoir that fed the plant's cooling water intake — cooling now relies on alternative ponds and wells.
- IAEA monitors have been continuously present since September 2022 but have repeatedly reported access constraints and described the situation as fragile.

The plant's location on the front line, with active ground combat in the surrounding area, represents the most acute civil-nuclear safety risk of any war in history.`,
    },
    {
      filename: "kursk-incursion.md",
      geo: { lat: 51.5, lng: 35.0, label: "Kursk Oblast" },
      body: `# Kursk Oblast — The Ukrainian Incursion

On **August 6, 2024**, Ukrainian mechanized forces crossed the international border into Russia's Kursk Oblast in the first significant invasion of Russian territory by foreign forces since World War II. The operation seized roughly 1,000 km² in the opening days, including the town of Sudzha and a critical Gazprom transit node.

**Stated and plausible objectives:**
- **Political signaling** — demonstrate Ukrainian initiative after a difficult winter.
- **Force diversion** — pull Russian units away from the Donetsk axis.
- **Bargaining chip** — hold Russian territory for any future negotiation.
- **Domestic effect** — pierce the Kremlin's narrative of insulation from the war's costs.

By 2025, Russian counterattacks (reportedly involving North Korean troops deployed alongside Russian formations) had retaken much of the salient, but the operation reshaped the political dimension of the conflict.`,
    },
    {
      filename: "odesa-port.md",
      geo: { lat: 46.4825, lng: 30.7233, label: "Odesa" },
      body: `# Odesa — Black Sea Grain Corridor

Ukraine's principal Black Sea port complex (Odesa, Chornomorsk, Pivdennyi) and the lifeline of the country's grain export economy.

**The corridor's evolution:**
- **July 2022 – July 2023:** UN/Türkiye-brokered **Black Sea Grain Initiative** allowed inspected commercial transits.
- **July 2023:** Russia withdrew from the BSGI; sustained Russian missile and drone attacks on port infrastructure (Odesa, Reni, Izmail) followed.
- **August 2023 onward:** Ukraine unilaterally established a **western corridor** hugging the Romanian and Bulgarian coastlines, defended by air defense, naval drones, and the degradation of the Black Sea Fleet (see Sevastopol note).
- By 2024, monthly export volumes had recovered to roughly pre-war levels — a quietly significant operational and economic outcome.

Odesa itself is also the cultural anchor of Russian-speaking, Ukrainian-identifying southern Ukraine — a political fact that has hardened over the course of the war.`,
    },
  ],
};

// ─── run ─────────────────────────────────────────────────────────────────────

const stratbooks = [middleEast, taiwan, ukraine];

console.log(`Seeding ${stratbooks.length} stratbooks into bucket "${BUCKET}"…\n`);

for (const sb of stratbooks) {
  await seedProject(sb);
}

console.log(`\nDone. Reload the home page to see them.`);
