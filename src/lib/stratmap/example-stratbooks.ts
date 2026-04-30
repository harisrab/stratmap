export type ExampleStratbookNote = {
  body: string;
  filename: string;
  geo?: {
    label: string;
    lat: number;
    lng: number;
  };
};

export type ExampleStratbook = {
  blurb: string;
  description: string;
  dot: string;
  id: string;
  index: string;
  notes: ExampleStratbookNote[];
  pins: number;
  shareId: string;
  tags: string[];
  title: string;
};

export const EXAMPLE_PUBLIC_OWNER_ID = "_stratbook_examples";

export const exampleStratbooks: ExampleStratbook[] = [
  {
    blurb: "Iran's posture, Hormuz chokepoints, the Gaza front, and Damascus.",
    description:
      "Conflict, chokepoints, and shifting alignments across the Levant, Gulf, and Red Sea.",
    dot: "#fb923c",
    id: "example-middle-east",
    index: "01",
    pins: 8,
    shareId: "middle-east-strategic-outlook",
    tags: ["Energy", "Hormuz", "Iran"],
    title: "Middle East — Strategic Outlook",
    notes: [
      {
        filename: "00-overview.md",
        body: `# Middle East — Strategic Outlook

This example stratbook maps the regional pressure points shaping conflict, energy security, and alliance behavior across the Middle East.

Use the pins to move from headline-level analysis into geographic context: Gaza, southern Lebanon, the Strait of Hormuz, Bab el-Mandeb, Iran's nuclear infrastructure, and Gulf diplomatic nodes.`,
      },
      {
        filename: "gaza-strip.md",
        geo: { lat: 31.5017, lng: 34.4668, label: "Gaza City" },
        body: `# Gaza Strip

A dense coastal enclave where military operations, humanitarian access, hostage negotiations, and postwar governance questions converge.

Watch Rafah, the Philadelphi Corridor, northern Gaza re-entry, and any proposed transitional administration model.`,
      },
      {
        filename: "southern-lebanon.md",
        geo: { lat: 33.5, lng: 35.5, label: "Southern Lebanon" },
        body: `# Southern Lebanon

The Hezbollah-Israel frontier remains one of the region's most sensitive escalation zones.

The geography matters: the Blue Line, Litani River, and border villages define both ceasefire monitoring and future force posture.`,
      },
      {
        filename: "strait-of-hormuz.md",
        geo: { lat: 26.55, lng: 56.25, label: "Strait of Hormuz" },
        body: `# Strait of Hormuz

The world's most important energy chokepoint. Any disruption here would immediately affect oil and LNG markets.

Iran's coastal missile forces, IRGC Navy fast craft, and tanker seizure history make this a central escalation node.`,
      },
      {
        filename: "bab-el-mandeb.md",
        geo: { lat: 12.58, lng: 43.32, label: "Bab el-Mandeb" },
        body: `# Bab el-Mandeb

The Red Sea gateway between the Suez Canal and Indian Ocean.

Houthi missile and drone attacks demonstrated how a local conflict can reroute global shipping around the Cape of Good Hope.`,
      },
      {
        filename: "natanz.md",
        geo: { lat: 33.7244, lng: 51.7167, label: "Natanz" },
        body: `# Natanz

Iran's primary uranium enrichment site and a recurring focus of sabotage, inspection disputes, and military contingency planning.`,
      },
      {
        filename: "abu-dhabi.md",
        geo: { lat: 24.4539, lng: 54.3773, label: "Abu Dhabi" },
        body: `# Abu Dhabi

The UAE acts as a diplomatic and logistics hub, balancing ties with Washington, Beijing, Tehran, Tel Aviv, and regional capitals.`,
      },
      {
        filename: "damascus.md",
        geo: { lat: 33.5138, lng: 36.2765, label: "Damascus" },
        body: `# Damascus

Syria's capital anchors the regional contest between local factions, Turkish influence, Iranian networks, Israeli airpower, and Russian basing interests.`,
      },
    ],
  },
  {
    blurb: "TSMC, Kinmen, the median line, PLARF posture in Fujian.",
    description:
      "Cross-strait military, economic, and alliance geography around the Taiwan Strait.",
    dot: "#38bdf8",
    id: "example-taiwan-strait",
    index: "02",
    pins: 7,
    shareId: "taiwan-strait-flashpoint-atlas",
    tags: ["Semiconductors", "PLARF", "INDOPACOM"],
    title: "Taiwan Strait — Flashpoint Atlas",
    notes: [
      {
        filename: "00-overview.md",
        body: `# Taiwan Strait — Flashpoint Atlas

This example stratbook maps the core geography of a Taiwan contingency: political centers, semiconductor risk, outlying islands, PLA launch geography, and allied basing.`,
      },
      {
        filename: "taipei.md",
        geo: { lat: 25.033, lng: 121.5654, label: "Taipei" },
        body: `# Taipei

Taiwan's political center and decision node. Any cross-strait crisis is as much about coercion and legitimacy as amphibious capability.`,
      },
      {
        filename: "taiwan-strait.md",
        geo: { lat: 24.5, lng: 120.0, label: "Taiwan Strait median line" },
        body: `# Taiwan Strait

The unofficial median line has steadily eroded as a stabilizing boundary. PLA air and naval operations now normalize pressure around the island.`,
      },
      {
        filename: "kinmen.md",
        geo: { lat: 24.4488, lng: 118.3171, label: "Kinmen" },
        body: `# Kinmen

ROC-controlled islands just off Xiamen. Symbolically important, geographically exposed, and central to gray-zone coast guard activity.`,
      },
      {
        filename: "hsinchu-tsmc.md",
        geo: { lat: 24.7783, lng: 120.9942, label: "Hsinchu Science Park" },
        body: `# Hsinchu Science Park

The heart of Taiwan's semiconductor ecosystem. Disruption here would be a global economic event, not just a regional military issue.`,
      },
      {
        filename: "fujian-rocket-force.md",
        geo: { lat: 26.0745, lng: 119.2965, label: "Fuzhou / Fujian coast" },
        body: `# Fujian Coast

The PLA's eastern launch geography for missile, air, naval, and amphibious pressure against Taiwan.`,
      },
      {
        filename: "luzon-strait.md",
        geo: { lat: 20.5, lng: 121.5, label: "Luzon Strait" },
        body: `# Luzon Strait

A key southern approach for submarines, aircraft, and allied access between Taiwan and the northern Philippines.`,
      },
      {
        filename: "yokosuka.md",
        geo: { lat: 35.2839, lng: 139.6722, label: "Yokosuka Naval Base" },
        body: `# Yokosuka

Home of the US Seventh Fleet and a critical rear-area node for any Western Pacific contingency.`,
      },
    ],
  },
  {
    blurb: "Pokrovsk, the Kharkiv axis, Sevastopol, Zaporizhzhia NPP.",
    description:
      "Frontline geography, strategic depth, and key infrastructure of the post-2022 war.",
    dot: "#a78bfa",
    id: "example-russia-ukraine",
    index: "03",
    pins: 8,
    shareId: "russia-ukraine-operational-map",
    tags: ["Front line", "ZNPP", "Black Sea"],
    title: "Russia–Ukraine — Operational Map",
    notes: [
      {
        filename: "00-overview.md",
        body: `# Russia–Ukraine — Operational Map

This example stratbook maps the political centers, active axes, ports, and strategic infrastructure that define the war's operational geography.`,
      },
      {
        filename: "kyiv.md",
        geo: { lat: 50.4501, lng: 30.5234, label: "Kyiv" },
        body: `# Kyiv

Ukraine's political center and the failed objective of Russia's initial 2022 campaign.`,
      },
      {
        filename: "pokrovsk.md",
        geo: { lat: 48.2818, lng: 37.1781, label: "Pokrovsk" },
        body: `# Pokrovsk Axis

A critical road and rail node supporting Ukrainian logistics across the Donetsk front.`,
      },
      {
        filename: "avdiivka.md",
        geo: { lat: 48.1395, lng: 37.7426, label: "Avdiivka" },
        body: `# Avdiivka

A fortified town whose fall in February 2024 shifted Russian pressure westward toward Pokrovsk.`,
      },
      {
        filename: "kharkiv.md",
        geo: { lat: 49.9935, lng: 36.2304, label: "Kharkiv" },
        body: `# Kharkiv

Ukraine's second-largest city, close to the Russian border and repeatedly targeted by missile, drone, and glide-bomb attacks.`,
      },
      {
        filename: "sevastopol.md",
        geo: { lat: 44.6166, lng: 33.5254, label: "Sevastopol" },
        body: `# Sevastopol

Black Sea Fleet headquarters and a repeated target of Ukrainian long-range strike and naval drone operations.`,
      },
      {
        filename: "zaporizhzhia-npp.md",
        geo: { lat: 47.5119, lng: 34.5856, label: "Zaporizhzhia NPP" },
        body: `# Zaporizhzhia Nuclear Power Plant

Europe's largest nuclear plant, occupied by Russian forces and located near active conflict geography.`,
      },
      {
        filename: "odesa.md",
        geo: { lat: 46.4825, lng: 30.7233, label: "Odesa" },
        body: `# Odesa

Ukraine's principal Black Sea port complex and anchor of grain export resilience.`,
      },
      {
        filename: "kursk.md",
        geo: { lat: 51.5, lng: 35.0, label: "Kursk Oblast" },
        body: `# Kursk Oblast

The 2024 Ukrainian incursion into Russian territory reframed the political and operational geography of the war.`,
      },
    ],
  },
];

export function getExampleByShareId(shareId: string) {
  return exampleStratbooks.find((example) => example.shareId === shareId);
}

export function getExampleVersion(example: ExampleStratbook) {
  const json = JSON.stringify({
    blurb: example.blurb,
    description: example.description,
    id: example.id,
    notes: example.notes,
    pins: example.pins,
    shareId: example.shareId,
    tags: example.tags,
    title: example.title,
  });
  let hash = 0;
  for (let index = 0; index < json.length; index += 1) {
    hash = (hash * 31 + json.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}
