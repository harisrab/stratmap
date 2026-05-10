import { absoluteUrl, siteConfig } from "@/lib/site";

export type BlogPost = {
  category: string;
  description: string;
  heroImage?: {
    brief: string;
    title: string;
  };
  kind?: "blog" | "comparison" | "guide";
  keywords: string[];
  path?: string;
  publishedAt: string;
  references?: {
    label: string;
    url: string;
  }[];
  readingTime: string;
  sections: {
    body: string[];
    eyebrow?: string;
    heading: string;
    image?: {
      brief: string;
      title: string;
    };
  }[];
  slug: string;
  title: string;
};

export const blogPosts: BlogPost[] = [
  {
    category: "OSINT",
    description:
      "A practical definition of OSINT map tools, why map-first workflows matter, and how analysts turn sources, coordinates, and notes into investigations.",
    heroImage: {
      brief:
        "Replace with a Stratbook screenshot showing a map with pins, a source note panel, and a short briefing summary. Ideal caption: 'An OSINT map workspace keeps each claim tied to its source and location.'",
      title: "OSINT map workspace hero",
    },
    kind: "guide",
    keywords: [
      "OSINT map tool",
      "OSINT geolocation tool",
      "open source intelligence mapping",
      "investigation map software",
      "OSINT investigation workspace",
    ],
    path: "/guides/what-is-an-osint-map-tool",
    publishedAt: "2026-05-08",
    readingTime: "8 min read",
    references: [
      {
        label: "Bellingcat Online Investigation Toolkit",
        url: "https://docs.google.com/spreadsheets/d/18rtqh8EG2HUXahWMa9LNyKiX96Q5a0N2yyl1iioJLPs/edit",
      },
      {
        label: "Bellingcat: Searching the Earth",
        url: "https://www.bellingcat.com/resources/how-tos/2015/07/25/searching-the-earth-essential-geolocation-tools-for-verification/",
      },
      {
        label: "Verification Handbook",
        url: "https://verificationhandbook.com/",
      },
    ],
    sections: [
      {
        body: [
          "An OSINT map tool is software for organizing open-source evidence around the places it describes. Instead of treating location as a note afterthought, it lets investigators connect sources, claims, imagery, coordinates, and confidence levels to a live spatial workspace.",
          "This matters because open-source investigations often begin with geography: a road, port, facility, neighborhood, border crossing, convoy route, airfield, or satellite-visible landmark. A map-first workspace keeps that geographic context visible while the investigation changes.",
          "Bellingcat's toolkit is a useful reference point because its categories include maps, satellite services, geolocation tools, image and video verification, archiving, and social platforms. That taxonomy shows the real job: investigators are not only collecting links; they are moving between evidence, place, time, and verification.",
        ],
        heading: "What is an OSINT map tool?",
        image: {
          brief:
            "Use a diagram or screenshot that separates source intake, geolocation, verification, map notes, and briefing output into five columns.",
          title: "OSINT workflow map",
        },
      },
      {
        body: [
          "A useful OSINT map workflow usually starts with source intake, then moves through geolocation, verification, evidence organization, and briefing. The map is not just a final visualization. It is the working surface where the analyst tests whether claims fit the terrain, distances, routes, and surrounding evidence.",
          "For Stratbook, the core pattern is simple: pin a location, write the note in markdown, attach source context, draw supporting layers, and ask the AI Strategist to help summarize or compare the evidence without losing the location anchor.",
          "A strong workflow preserves uncertainty. Each pin should make clear whether the location is confirmed, likely, disputed, or only a lead. Each source should preserve its original URL, archive URL when available, retrieval date, uploader or publisher, and any transformation made by the analyst.",
        ],
        heading: "The workflow: collect, locate, verify, brief",
      },
      {
        body: [
          "Look for pinned notes, source links, lines, polygons, range rings, public sharing, exports, and a way to separate confirmed facts from hypotheses. For teams, also look for repeatable brief templates and clear ownership of the underlying notes.",
          "Traditional GIS tools are excellent for formal geospatial analysis. Generic note apps are excellent for writing. OSINT map tools sit between them: they give investigators enough spatial structure to think clearly without forcing every note into an enterprise GIS pipeline.",
          "A practical evaluation checklist is: can the tool preserve original sources, store coordinates, show nearby context, capture confidence, represent routes and areas, support collaboration, export the underlying notes, and publish a readable artifact for non-technical stakeholders?",
        ],
        heading: "What to look for when choosing one",
        image: {
          brief:
            "Create a comparison table screenshot with columns for source links, coordinates, confidence, routes, areas, collaboration, export, and public brief.",
          title: "OSINT map tool checklist",
        },
      },
      {
        body: [
          "A useful pin template can be short: place name, coordinate, source link, archived source, claim, evidence observed, confidence level, alternate explanations, related pins, and next action. Keeping this structure consistent makes later review much easier.",
          "For photo or video claims, add fields for landmark match, shadow or weather clues, visible text, road geometry, terrain, upload chronology, and reverse-image-search results. For social posts, add the account, platform, original timestamp, repost chain, and whether the media appears elsewhere.",
        ],
        heading: "A practical schema for OSINT map notes",
      },
    ],
    slug: "what-is-an-osint-map-tool",
    title: "What Is an OSINT Map Tool?",
  },
  {
    category: "GEOINT",
    description:
      "A clear explanation of geospatial intelligence, GEOINT workflows, and how AI-assisted map workspaces help analysts reason about places.",
    heroImage: {
      brief:
        "Replace with a layered map screenshot: satellite imagery base, facility pins, route lines, a polygon area of interest, and a side note explaining the key judgment.",
      title: "GEOINT workspace hero",
    },
    kind: "guide",
    keywords: [
      "geospatial intelligence",
      "GEOINT",
      "geospatial intelligence tools",
      "GEOINT workflow",
      "AI geospatial intelligence",
    ],
    path: "/guides/what-is-geospatial-intelligence",
    publishedAt: "2026-05-08",
    readingTime: "7 min read",
    references: [
      {
        label: "National Geospatial-Intelligence Agency: About NGA",
        url: "https://www.nga.mil/about/About_Us.html",
      },
      {
        label: "NGA: GEOINT Artificial Intelligence",
        url: "https://www.nga.mil/news/GEOINT_Artificial_Intelligence_.html",
      },
      {
        label: "NASA Earth Observatory: How to Interpret a Satellite Image",
        url: "https://earthobservatory.nasa.gov/features/ColorImage",
      },
    ],
    sections: [
      {
        body: [
          "Geospatial intelligence, often shortened to GEOINT, is the practice of using geography, imagery, mapping, and spatial information to understand what is happening in the world. The key idea is not just that data has coordinates. It is that location changes the meaning of the data.",
          "A GEOINT workflow can include satellite imagery, map layers, field reports, facility locations, route analysis, environmental context, and human judgment. The output is usually a decision-ready understanding of a place, event, network, or area of interest.",
          "The National Geospatial-Intelligence Agency describes GEOINT as an indispensable discipline for shaping decisions. For non-government teams, the same idea appears in smaller form: a newsroom, investor, NGO, or research desk may need to know where events occur, how places relate, and what spatial patterns change over time.",
        ],
        heading: "Geospatial intelligence, in plain language",
      },
      {
        body: [
          "Many teams need GEOINT-style thinking long before they need a full enterprise GIS stack. A journalist tracking infrastructure, an investor mapping supply-chain chokepoints, or a think tank studying border activity may need lightweight spatial reasoning, notes, and briefings more than formal cartographic production.",
          "That is the opening for a map-first research workspace: keep the analyst close to the evidence, keep the evidence close to the place, and let the final brief emerge from the map instead of a detached document.",
          "NASA's guidance for reading satellite images gives a useful analyst habit: inspect scale, patterns, shapes, textures, color, shadows, north orientation, and prior knowledge. Those habits translate directly into Stratbook notes: every image-based observation should record what was visible, what was inferred, and what remains unknown.",
        ],
        heading: "Why GEOINT is not only for GIS specialists",
        image: {
          brief:
            "Use a before/after visual showing a raw satellite screenshot on the left and an annotated Stratbook map on the right with scale, route, and facility labels.",
          title: "From imagery to annotated spatial analysis",
        },
      },
      {
        body: [
          "AI can help summarize source material, compare locations, draft briefings, and identify missing questions. It should not replace source evaluation or analytic judgment. It works best when the workspace gives it grounded context: the selected place, nearby notes, prior sources, and the team’s own assumptions.",
          "Stratbook’s position is not to replace professional GIS or imagery analysis platforms. It is to give analysts a spatial research desk where pins, notes, layers, sources, and AI briefings stay connected.",
          "A useful AI-assisted GEOINT workflow has four guardrails: cite the source behind each observation, keep assumptions visible, preserve alternate hypotheses, and separate what the model summarized from what the analyst judged. The final brief should make that distinction obvious.",
        ],
        heading: "Where AI fits in a GEOINT workflow",
      },
      {
        body: [
          "A lightweight GEOINT note should capture the area of interest, coordinate or bounding box, imagery date, source provider, observed features, confidence, change since prior imagery, and the decision question. This is enough structure to keep the work auditable without turning every note into a formal GIS record.",
          "For recurring monitoring, keep one layer for stable infrastructure, one for observed changes, one for source confidence, and one for hypotheses. That separation helps readers distinguish the base map from the analyst's interpretation.",
        ],
        heading: "A lightweight GEOINT note template",
        image: {
          brief:
            "Create a four-layer Stratbook screenshot: stable infrastructure, observed changes, confidence markers, and hypothesis annotations.",
          title: "GEOINT layer structure",
        },
      },
    ],
    slug: "what-is-geospatial-intelligence",
    title: "What Is Geospatial Intelligence?",
  },
  {
    category: "Comparison",
    description:
      "A practical comparison of Stratbook and ArcGIS StoryMaps for teams creating map-backed briefings, research artifacts, and public spatial narratives.",
    heroImage: {
      brief:
        "Replace with a split screenshot: left side a polished slide/story-style map briefing, right side a working Stratbook research map with notes, sources, and unresolved questions.",
      title: "Publishing canvas vs research workspace",
    },
    kind: "comparison",
    keywords: [
      "Stratbook vs ArcGIS StoryMaps",
      "ArcGIS StoryMaps alternative",
      "map briefing software",
      "spatial storytelling tool",
      "map research workspace",
    ],
    path: "/comparisons/stratbook-vs-arcgis-storymaps",
    publishedAt: "2026-05-08",
    readingTime: "6 min read",
    references: [
      {
        label: "ArcGIS StoryMaps overview",
        url: "https://www.esri.com/en-us/arcgis/products/arcgis-storymaps/overview",
      },
      {
        label: "ArcGIS StoryMaps documentation",
        url: "https://doc.arcgis.com/en/arcgis-storymaps/get-started/what-is-arcgis-storymaps.htm",
      },
      {
        label: "ArcGIS StoryMaps briefings",
        url: "https://www.esri.com/arcgis-blog/products/story-maps/announcements/briefings-in-arcgis-storymaps",
      },
    ],
    sections: [
      {
        body: [
          "ArcGIS StoryMaps is excellent when the job is to publish polished spatial stories, explainers, and map-backed narratives. Stratbook is built for the earlier research stage: collecting place-based notes, reasoning over sources, drawing working layers, and turning the analyst’s workspace into a brief.",
          "The difference is workflow. StoryMaps is strongest as an authored presentation surface. Stratbook is strongest as a map-first research desk that can also publish and share the result.",
          "Esri's own documentation frames StoryMaps around stories, briefings, multimedia, live maps, and published URLs. That is a strong communications model. Stratbook's sharper use case is when the map is still the place where the team is thinking, not only the place where the team is presenting.",
        ],
        heading: "The short version",
      },
      {
        body: [
          "Choose ArcGIS StoryMaps when the final public story is the main artifact and you already have the map content, media, and narrative structure ready. It is especially strong for communication teams, educators, public-sector storytelling, and GIS-backed explainers.",
          "Choose Stratbook when the research is still moving: you need pinned notes, source context, markdown files, AI-assisted brief drafting, and a working map that changes as your understanding improves.",
          "A good rule of thumb: if the question is 'how do we publish this map-backed story beautifully?', StoryMaps is a natural fit. If the question is 'how do we organize evidence, locations, assumptions, and briefings while the analysis is still developing?', Stratbook is closer to the center of the job.",
        ],
        heading: "When each tool fits",
        image: {
          brief:
            "Use a two-column decision tree: 'Need polished public narrative?' points to StoryMaps; 'Need active source-and-map research workspace?' points to Stratbook.",
          title: "Tool selection decision tree",
        },
      },
      {
        body: [
          "The practical comparison is not “which tool has maps?” Both do. The better question is whether your team needs a publishing canvas or an investigation workspace. Stratbook is designed for the analyst who starts with messy evidence and needs to preserve spatial context until the final brief is ready.",
          "For teams that already have mature GIS infrastructure, Stratbook can sit upstream as the research and briefing layer. For teams without GIS specialists, it can provide enough spatial structure to build a credible map-backed brief without beginning in a heavyweight GIS environment.",
        ],
        heading: "The buyer decision",
      },
      {
        body: [
          "Use these criteria when comparing the two: source-note depth, live map capability, multimedia publishing, private work-in-progress notes, markdown export, AI briefing support, collaboration model, and whether the map is primarily a finished artifact or an active research surface.",
          "The most important criterion is reversibility. If the team must return from the final brief back to the evidence, Stratbook's note and source structure matters. If the work is already finalized and the goal is public explanation, StoryMaps' authored narrative structure can be a better fit.",
        ],
        heading: "Comparison checklist",
      },
    ],
    slug: "stratbook-vs-arcgis-storymaps",
    title: "Stratbook vs ArcGIS StoryMaps for Briefings",
  },
  {
    category: "Comparison",
    description:
      "A clear comparison of Stratbook and Obsidian for researchers who like markdown, linked notes, and knowledge bases but need spatial context.",
    heroImage: {
      brief:
        "Replace with a split screenshot: Obsidian-style graph/markdown notes on one side, Stratbook map-pinned markdown notes on the other.",
      title: "Markdown graph vs spatial workspace",
    },
    kind: "comparison",
    keywords: [
      "Stratbook vs Obsidian",
      "Obsidian alternative for research",
      "markdown spatial research",
      "map based note taking",
      "spatial knowledge base",
    ],
    path: "/comparisons/stratbook-vs-obsidian",
    publishedAt: "2026-05-08",
    readingTime: "6 min read",
    references: [
      {
        label: "Obsidian Help: About Obsidian",
        url: "https://obsidian.md/help/obsidian",
      },
      {
        label: "ArcGIS Map Notes",
        url: "https://doc.arcgis.com/en/arcgis-solutions/latest/reference/introduction-to-map-notes.htm",
      },
      {
        label: "Bellingcat Online Investigation Toolkit",
        url: "https://docs.google.com/spreadsheets/d/18rtqh8EG2HUXahWMa9LNyKiX96Q5a0N2yyl1iioJLPs/edit",
      },
    ],
    sections: [
      {
        body: [
          "Obsidian is a powerful markdown editor and personal knowledge base. It is excellent for linked thinking, local-first notes, plugins, and long-lived personal archives. Stratbook starts with a different assumption: some research is not document-first or graph-first. It is place-first.",
          "If the main unit of your work is an idea, a person, or a document, Obsidian may fit beautifully. If the main unit is a port, route, district, border crossing, facility, or event location, a map-first workspace can reduce friction.",
          "Obsidian's official help describes it as both a Markdown editor and a knowledge base app, with links as first-class citizens and plain text ownership as a major advantage. Stratbook should respect that strength. The comparison is not about replacing a personal knowledge base; it is about what changes when the knowledge base needs a geographic spine.",
        ],
        heading: "Markdown notes vs spatial notes",
      },
      {
        body: [
          "Stratbook keeps markdown in the workflow but gives each note a coordinate-aware context. That means a note can live inside a broader map, connect to surrounding layers, and become part of a shareable spatial brief.",
          "For analysts, the difference is retrieval and synthesis. You are not only asking “what did I write about this topic?” You are asking “what do we know about this place, what is nearby, and what should the briefing say?”",
          "This matters most when the evidence is spatially clustered: multiple claims about one facility, a route with several incidents, an infrastructure network, or a city where neighborhoods carry different operational meaning. In those cases, a map is not an attachment to the note. It is the index.",
        ],
        heading: "Where Stratbook differs",
        image: {
          brief:
            "Use a screenshot with one selected pin and a markdown note panel showing source URL, confidence, related pins, and a briefing snippet.",
          title: "Coordinate-aware markdown note",
        },
      },
      {
        body: [
          "Use Obsidian when you want maximum control over a personal markdown vault. Use Stratbook when your notes, sources, and outputs need to stay anchored to geography and become understandable to teammates or public readers through a map.",
          "A hybrid workflow can also work: maintain deep personal notes in Obsidian, then use Stratbook for the spatial subset that needs pins, layers, public examples, or AI-assisted briefing. The cleaner the boundary, the better: Obsidian for personal knowledge, Stratbook for place-based intelligence artifacts.",
        ],
        heading: "Which should you choose?",
      },
      {
        body: [
          "A useful migration pattern is to start with one area of interest, not the whole vault. Export or copy only the notes that have a clear location, convert each location into a pin, preserve backlinks as related-pin references, and keep one summary note for the analytic question.",
          "Do not try to recreate every graph edge on the map. Spatial work benefits from restraint. The map should show places, routes, areas, and relationships that matter to the decision, not every possible association in the archive.",
        ],
        heading: "How to move spatial notes into Stratbook",
      },
    ],
    slug: "stratbook-vs-obsidian",
    title: "Stratbook vs Obsidian for Spatial Research",
  },
  {
    category: "Briefings",
    description:
      "A repeatable workflow for turning scattered notes, map pins, source links, and geospatial layers into a clear intelligence brief.",
    heroImage: {
      brief:
        "Replace with a Stratbook screenshot showing pins on the map, a source-rich note, and a generated briefing outline side by side.",
      title: "From mapped evidence to intelligence brief",
    },
    kind: "guide",
    keywords: [
      "intelligence brief template",
      "analyst briefing workflow",
      "AI briefing tool",
      "research briefing tool",
      "strategic intelligence brief",
    ],
    path: "/guides/notes-pins-layers-intelligence-brief",
    publishedAt: "2026-05-08",
    readingTime: "7 min read",
    references: [
      {
        label: "CIA: A Tradecraft Primer",
        url: "https://www.cia.gov/resources/csi/static/Tradecraft-Primer-apr09.pdf",
      },
      {
        label: "Google: Creating helpful, reliable, people-first content",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
      },
      {
        label: "ArcGIS StoryMaps overview",
        url: "https://www.esri.com/en-us/arcgis/products/arcgis-storymaps/overview",
      },
    ],
    sections: [
      {
        body: [
          "A good intelligence brief turns scattered evidence into a decision-ready explanation. For place-based research, the path from evidence to brief should preserve the map: what happened, where it happened, what nearby context matters, and how confident the analyst is.",
          "The simplest workflow is to organize the workspace into four layers: pins for key locations, notes for evidence and interpretation, shapes or lines for spatial relationships, and a briefing layer that synthesizes the findings.",
          "CIA tradecraft guidance emphasizes the difficulty of incomplete, ambiguous information and the limits of human judgment. A map-first brief should therefore make uncertainty visible instead of smoothing it away. The reader should see not only the conclusion, but the spatial evidence and assumptions behind it.",
        ],
        heading: "Start with the map, not the document",
        image: {
          brief:
            "Create a diagram with four layers: key locations, evidence notes, spatial relationships, and final briefing synthesis.",
          title: "Four-layer briefing model",
        },
      },
      {
        body: [
          "Each pin should answer a narrow question: what is this place, why does it matter, what source supports it, and what remains uncertain? That structure makes the final brief easier to write because every paragraph traces back to an anchored location.",
          "Lines, polygons, and range rings should explain relationships rather than decorate the map. Use them for routes, areas of interest, possible influence zones, contested boundaries, chokepoints, or scenario assumptions.",
          "Before drafting, group notes into key judgments, supporting observations, contradictions, and collection gaps. This gives the brief a skeleton and prevents the final output from becoming a chronological pile of notes.",
        ],
        heading: "Structure the workspace before drafting",
      },
      {
        body: [
          "Once the map is structured, AI can help draft the first synthesis: executive summary, key judgments, open questions, and source-backed observations. The analyst still owns the final judgment. The assistant’s job is to accelerate synthesis without detaching the brief from the evidence.",
          "In Stratbook, this is the loop: map the evidence, write the notes, ask for a brief, revise against the sources, then share the stratbook so readers can inspect the spatial context behind the conclusion.",
          "The review step is where quality comes from. Check every claim against its source note, remove unsupported speculation, label assumptions, and add a clear 'what would change our assessment' section. That final section is often more useful than another paragraph of confidence language.",
        ],
        heading: "Use AI for synthesis, not blind authority",
      },
      {
        body: [
          "A useful brief structure is: executive summary, key judgments, map orientation, evidence by location, alternate explanations, confidence levels, implications, collection gaps, and recommended next monitoring actions.",
          "For public readers, add a short methods note explaining what sources were used, what was excluded, how locations were verified, and how often the stratbook will be updated. For internal readers, add owner, decision deadline, and required follow-up.",
        ],
        heading: "A practical intelligence brief template",
        image: {
          brief:
            "Use a screenshot or designed layout of an intelligence brief with labeled sections: summary, map orientation, evidence by location, confidence, gaps, and next actions.",
          title: "Brief template placeholder",
        },
      },
    ],
    slug: "notes-pins-layers-intelligence-brief",
    title: "How to Turn Notes, Pins, and Layers into an Intelligence Brief",
  },
  {
    category: "AI research",
    description:
      "A practical guide to map-first AI research workspaces for OSINT, geopolitical analysis, defense planning, and place-based strategic research.",
    heroImage: {
      brief:
        "Replace with a product screenshot showing the complete Stratbook workspace: map canvas, pinned notes, file tree, and AI briefing panel.",
      title: "Map-first AI research workspace",
    },
    keywords: [
      "AI research workspace",
      "map-first AI research workspace",
      "geospatial AI research",
      "OSINT research workspace",
      "strategic intelligence workspace",
    ],
    publishedAt: "2026-05-08",
    references: [
      {
        label: "ArcGIS Pro: Map notes",
        url: "https://pro.arcgis.com/en/pro-app/latest/help/mapping/layer-properties/map-notes.htm",
      },
      {
        label: "Obsidian Help: About Obsidian",
        url: "https://obsidian.md/help/obsidian",
      },
      {
        label: "NGA: GEOINT Artificial Intelligence",
        url: "https://www.nga.mil/news/GEOINT_Artificial_Intelligence_.html",
      },
    ],
    readingTime: "6 min read",
    sections: [
      {
        body: [
          "Most research tools treat geography as metadata. A map-first AI research workspace reverses that model: the map becomes the primary surface, and every note, source, file, and briefing inherits spatial context from the place it describes.",
          "That matters for OSINT researchers, geopolitical analysts, field reporters, defense planners, and market researchers because their questions are rarely abstract. They are about border crossings, ports, neighborhoods, airfields, corridors, range rings, chokepoints, facilities, and the relationships between them.",
          "The category sits between three existing tool families: GIS platforms that handle formal spatial data, knowledge-base tools that handle notes and links, and AI workspaces that help draft or summarize. Stratbook's wedge is to combine enough of each for the analyst's day-to-day research loop.",
        ],
        heading: "What is a map-first AI research workspace?",
        image: {
          brief:
            "Use a labeled product screenshot with callouts for map canvas, coordinate-pinned markdown note, source link, file system, and AI Strategist.",
          title: "Workspace anatomy",
        },
      },
      {
        body: [
          "In a conventional notebook, the analyst writes a document and later tries to remember where the evidence belongs. In a map-first notebook, the analyst starts with the location. A pin can hold markdown notes, cited source material, briefing drafts, and team context.",
          "When AI is added to that workflow, the assistant can answer with awareness of the selected place, nearby notes, prior research, and the wider spatial story. The output is less like a generic chatbot answer and more like a working intelligence brief.",
          "The key design principle is retrieval by place. A user should be able to click a location and immediately see what is known, what is suspected, which sources support it, which nearby locations matter, and what the current briefing says.",
        ],
        heading: "How map-first research changes the workflow",
      },
      {
        body: [
          "Stratbook is built around this workflow. Analysts can pin notes to coordinates, organize markdown files, draw geospatial layers, create shareable stratbooks, and ask the AI Strategist to reason over the workspace.",
          "The goal is not to replace analyst judgment. The goal is to keep sources, places, and generated briefings in the same working environment so teams can preserve context as the research changes.",
          "A strong Stratbook should feel inspectable. Readers should be able to move from a conclusion back to the map, from the map back to the note, and from the note back to the source. That reversibility is what turns a pretty map into a trustworthy research artifact.",
        ],
        heading: "Where Stratbook fits",
        image: {
          brief:
            "Create a simple traceability graphic: briefing claim -> map pin -> note -> original source -> related locations.",
          title: "Traceable research chain",
        },
      },
      {
        body: [
          "The minimum useful workspace includes a map, a note model, a source model, a layer model, and a briefing model. The note model should support markdown and coordinates. The source model should preserve URLs, archive links, and retrieval dates. The layer model should separate facts, hypotheses, and planning geometry.",
          "The briefing model should not be a separate destination. It should be generated from, and linked back to, the underlying map notes so that readers can audit the work.",
        ],
        heading: "The minimum useful product surface",
      },
    ],
    slug: "map-first-ai-research-workspace",
    title: "What Is a Map-First AI Research Workspace?",
  },
  {
    category: "OSINT",
    description:
      "How OSINT teams can use map-based notes, citations, range rings, and AI briefings to build clearer place-based investigations.",
    heroImage: {
      brief:
        "Replace with a real example stratbook screenshot: a claimed incident location, nearby corroborating pins, and a note panel with source/confidence fields.",
      title: "Place-based OSINT research",
    },
    keywords: [
      "OSINT map tool",
      "OSINT research tool",
      "geospatial OSINT",
      "map notes for OSINT",
      "AI OSINT workspace",
    ],
    publishedAt: "2026-05-08",
    references: [
      {
        label: "Bellingcat Online Investigation Toolkit",
        url: "https://bellingcat.gitbook.io/toolkit",
      },
      {
        label: "Bellingcat: About maps and satellites",
        url: "https://bellingcat.gitbook.io/toolkit/more/all-tools/about-maps-and-satellites",
      },
      {
        label: "InVID Verification Plugin",
        url: "https://www.invid-project.eu/tools-and-services/invid-verification-plugin/",
      },
    ],
    readingTime: "7 min read",
    sections: [
      {
        body: [
          "OSINT work often starts with a place: a port, a road junction, a city block, a convoy route, a factory, a satellite image, or a claim tied to a coordinate. A map-based OSINT workflow keeps that geographic anchor visible while the evidence accumulates.",
          "Instead of scattering screenshots, source links, and notes across documents, analysts can organize evidence around the locations that make the story intelligible.",
          "Bellingcat's toolkit separates maps and satellites, geolocation, image/video verification, social media, and archiving. A map-based workspace becomes useful when it lets those tool outputs converge in one place instead of forcing the analyst to manually reconcile them later.",
        ],
        heading: "Why OSINT benefits from a map-based workspace",
      },
      {
        body: [
          "A strong OSINT map tool should support pinned notes, source capture, markdown writing, shareable briefs, and visual context such as polygons, lines, and range rings. It should also make it easy to separate confirmed information from hypotheses.",
          "AI can help summarize source material, draft comparison briefs, and surface gaps in the investigation, but it works best when the workspace gives it grounded context instead of a loose prompt.",
          "The verification loop should be explicit: collect the claim, find the earliest available source, archive it, extract media clues, compare the place against maps or imagery, record confidence, then write the briefing. If any step is missing, the final map may look more certain than the evidence really is.",
        ],
        heading: "What to look for in an OSINT map tool",
        image: {
          brief:
            "Use a flowchart from claim intake to archive, media clues, geolocation, confidence, mapped note, and public brief.",
          title: "OSINT verification loop",
        },
      },
      {
        body: [
          "Stratbook gives teams a map-first notebook for this kind of work. Each public stratbook can become a crawlable, shareable artifact with the map, notes, and briefing context preserved together.",
          "For teams publishing research, that means the final page is not just a PDF or a static article. It is a structured spatial brief that can be indexed, shared, forked, and extended.",
          "The best public examples should be narrow. A useful stratbook might monitor one port, one border corridor, one infrastructure network, or one event chronology. Narrow scope makes sources easier to audit and helps readers understand why each pin exists.",
        ],
        heading: "Publishing OSINT research as a stratbook",
        image: {
          brief:
            "Create a placeholder for a public Stratbook example page with title, map, source list, and 'last updated' metadata.",
          title: "Public stratbook example",
        },
      },
      {
        body: [
          "A practical OSINT map note can include: claim, source URL, archived URL, original timestamp, observed place, coordinate, verification method, confidence, contradictions, related pins, and next collection task.",
          "For video investigations, add keyframes, reverse-search results, uploader context, visible signage, terrain or road clues, weather and shadow observations, and any mismatch between claimed and observed location.",
        ],
        heading: "A reusable OSINT note template",
      },
    ],
    slug: "osint-map-tool-for-place-based-research",
    title: "How to Choose an OSINT Map Tool for Place-Based Research",
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostUrl(post: Pick<BlogPost, "slug">) {
  const fullPost = getBlogPost(post.slug);
  return absoluteUrl(fullPost?.path ?? `/blog/${post.slug}`);
}

export function getResourcePost(kind: NonNullable<BlogPost["kind"]>, slug: string) {
  return blogPosts.find((post) => post.kind === kind && post.slug === slug);
}

export function getBlogJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    dateModified: post.publishedAt,
    datePublished: post.publishedAt,
    description: post.description,
    headline: post.title,
    image: absoluteUrl(siteConfig.ogImage),
    inLanguage: "en-US",
    keywords: post.keywords.join(", "),
    mainEntityOfPage: getBlogPostUrl(post),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}
