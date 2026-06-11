import { StorefrontProduct, SorterRecord, Competitor, StorefrontProfile } from "./types";

export const DEFAULT_PRODUCTS: StorefrontProduct[] = [
  {
    id: "p1",
    name: "Quantum Series Graphics Card (GPU v4)",
    price: 799.00,
    category: "Graphics Cards",
    desc: "Built for creators and gaming enthusiasts. Features high-performance tensor cores and an advanced vapor chamber cooling system for quiet, reliable workloads.",
    salesCount: 142,
    viewsCount: 1104,
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=300",
    buyingPrice: 450.00,
    stockCount: 85
  },
  {
    id: "p2",
    name: "Holographic Touch Glass Keyboard",
    price: 249.00,
    category: "Keyboards",
    desc: "An elegant, projection-style glass keyboard. Includes built-in haptic touch feedback, custom colored LED options, and ultra-low typing latency.",
    salesCount: 89,
    viewsCount: 654,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=300",
    buyingPrice: 110.00,
    stockCount: 120
  },
  {
    id: "p3",
    name: "Cyberpunk Active Noise-Cancelling Earbuds",
    price: 189.90,
    category: "Audio",
    desc: "Equipped with custom beryllium drivers and advanced 42dB active noise cancellation. Enjoy rich bass and clear conversations dynamically.",
    salesCount: 218,
    viewsCount: 1721,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=300",
    buyingPrice: 75.00,
    stockCount: 44
  },
  {
    id: "p4",
    name: "Neural Link Ultra VR Headset",
    price: 420.00,
    category: "Virtual Reality",
    desc: "Experience complete immersion with ultra-crisp micro-OLED lenses, a smooth 144Hz refresh rate, and responsive tracking capabilities.",
    salesCount: 64,
    viewsCount: 412,
    imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=300",
    buyingPrice: 210.00,
    stockCount: 35
  }
];

export const SANDBOX_RAW_LOGS = `[FEEDBACK-1] 23-May-2026: Arrived safe and sound! The cooling unit on this graphics card is spectacular and keeps my desktop entirely quiet during long rendering tasks. - Sarah K.
[FEEDBACK-2] 22-May-2026: The holographic keys work wonderfully in my home office. Perfect visual feedback and responsive. - Dr. David K.
[FEEDBACK-3] 21-May-2026: Exceptional sound balance! The active noise cancellation on these earbuds is a complete lifesaver for studying on noisy campuses. - Marcus J.
[FEEDBACK-4] 19-May-2026: Had a small delivery issue, but the support team resolved it immediately and checked back to ensure my satisfaction. Truly helpful! - Brenda S.
[FEEDBACK-5] 18-May-2026: Excellent build materials on the VR headband. Lightweight, soft fabric lining, and holds securely even during movement. - Operator Daniel M.
[FEEDBACK-6] 18-May-2026: Fits comfortably right out of the box. Display resolution is sharp. Highly recommend the standard bundle setup. - Gregory P.`;

export const BASE_SORTED_ITEMS: SorterRecord[] = [
  {
    id: "REC-1",
    originalText: "Graphics card arrived safely. The cooling block performs layout beautifully.",
    category: "Delivery",
    sentiment: "Positive",
    priority: "Medium",
    resolvedSummary: "Fast and reliable shipping with robust parcel support.",
    actionableInsight: "Highlight express shipping availability at checkout to boost customer confidence."
  },
  {
    id: "REC-2",
    originalText: "Holographic glass keycaps don't register instantly in ambient sunlight.",
    category: "Usability Feedback",
    sentiment: "Neutral",
    priority: "High",
    resolvedSummary: "Outdoor daylight brightness impacts visibility of key projections.",
    actionableInsight: "Add a helpful recommendation to user manuals suggesting indoor or shaded environment use."
  },
  {
    id: "REC-3",
    originalText: "Earbuds deliver incredible sound clarity and bass response.",
    category: "Customer Praise",
    sentiment: "Positive",
    priority: "Low",
    resolvedSummary: "Premium audio drivers validated by verified customer review.",
    actionableInsight: "Praise deep bass response in search tags to increase listing views."
  }
];

export const DEFAULT_COMPETITORS: Competitor[] = [
  { name: "Sovereign Silicon Labs", price: 749.00 },
  { name: "MacroCenter Systems", price: 219.00 },
  { name: "Atlas Hardware Optics", price: 440.00 }
];

export const INITIAL_STOREFRONT_PROFILES: StorefrontProfile[] = [
  {
    id: "cyber-monkey",
    name: "Cyber Monkey Store",
    tagline: "Futuristic hardware & cybernetic interfaces",
    categoryDefault: "Electronics",
    primaryColor: "orange",
    themeStyle: "tech",
    bannerText: "Better choices, better prices on active sovereign hardware.",
    simulatedUrl: "https://www.cybermonkey.io",
    isDeployed: true,
    subdomain: "cyber-monkey.invowise.shop",
    layoutTheme: {
      headerLayout: "minimalist",
      fontFamily: "sans",
      spacing: "comfortable",
      borderRadius: "md",
      primaryColor: "orange"
    },
    benefitsStrip: [
      { title: "Value-for-money", desc: "Highly competitive rates", iconName: "Gift" },
      { title: "100M+ Devices", desc: "Expansive active catalog", iconName: "Cpu" },
      { title: "Fast delivery", desc: "Sovereign Air dispatch", iconName: "Truck" },
      { title: "Safe payments", desc: "Secured key validation", iconName: "Check" },
      { title: "Buyer protection", desc: "Comprehensive refunds", iconName: "ShieldCheck" },
      { title: "Download app", desc: "Scan QR & play", iconName: "Smartphone" }
    ],
    products: [
      {
        id: "cyber-1",
        name: "Quantum Series Graphics Card (GPU v4)",
        price: 799.00,
        category: "Graphics Cards",
        desc: "Built for creators and gaming enthusiasts. Features high-performance tensor cores and an advanced vapor chamber cooling system for quiet, reliable workloads.",
        salesCount: 142,
        viewsCount: 1104,
        imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 450.00,
        stockCount: 85,
        targetSites: ["cyber-monkey"]
      },
      {
        id: "cyber-2",
        name: "Holographic Touch Glass Keyboard",
        price: 249.00,
        category: "Keyboards",
        desc: "An elegant, projection-style glass keyboard. Includes built-in haptic touch feedback, custom colored LED options, and ultra-low typing latency.",
        salesCount: 89,
        viewsCount: 654,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 110.00,
        stockCount: 120,
        targetSites: ["cyber-monkey"]
      },
      {
        id: "cyber-3",
        name: "Cyberpunk Active Noise-Cancelling Earbuds",
        price: 189.90,
        category: "Audio",
        desc: "Equipped with custom beryllium drivers and advanced 42dB active noise cancellation. Enjoy rich bass and clear conversations dynamically.",
        salesCount: 218,
        viewsCount: 1721,
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 75.00,
        stockCount: 44,
        targetSites: ["cyber-monkey"]
      },
      {
        id: "cyber-4",
        name: "Neural Link Ultra VR Headset",
        price: 420.00,
        category: "Virtual Reality",
        desc: "Experience complete immersion with ultra-crisp micro-OLED lenses, a smooth 144Hz refresh rate, and responsive tracking capabilities.",
        salesCount: 64,
        viewsCount: 412,
        imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 210.00,
        stockCount: 35,
        targetSites: ["cyber-monkey"]
      }
    ]
  },
  {
    id: "retro-byte",
    name: "Retro Byte Arcade",
    tagline: "Ultra clicky pixels & legendary vintage hardware",
    categoryDefault: "Consoles",
    primaryColor: "rose",
    themeStyle: "retro",
    bannerText: "Experience pure 8-bit phosphorus nostalgia in modern gaming hulls.",
    simulatedUrl: "https://www.retrobyte-arcade.com",
    benefitsStrip: [
      { title: "Nostalgic value", desc: "True authentic soundchips", iconName: "Gift" },
      { title: "Retro Inventory", desc: "Pre-patched vintage cores", iconName: "Cpu" },
      { title: "Sovereign Dispatch", desc: "Bubble-wrapped air shipment", iconName: "Truck" },
      { title: "Verified handshakes", desc: "Encrypted cartridge trade", iconName: "Check" },
      { title: "Warranty seal", desc: "1-year cathode protection", iconName: "ShieldCheck" },
      { title: "Handheld firmware", desc: "Pre-installed loader app", iconName: "Smartphone" }
    ],
    products: [
      {
        id: "retro-1",
        name: "Neon Retro Game Cab Player x8",
        price: 349.00,
        category: "Consoles",
        desc: "Full-sized arcade console emulator with gorgeous multi-input ports. Styled with high-density glowing neon tubes and ultra clicky physical Sanwa microswitches.",
        salesCount: 45,
        viewsCount: 322,
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 180.00,
        stockCount: 15
      },
      {
        id: "retro-2",
        name: "Holographic Pixel Controller",
        price: 120.00,
        category: "Accessories",
        desc: "Premium haptic retro d-pad. Supports dynamic tactile keymaps, scanline HUD triggers, and sub-millisecond wireless transmitter latency during emulation.",
        salesCount: 110,
        viewsCount: 521,
        imageUrl: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 48.00,
        stockCount: 60
      },
      {
        id: "retro-3",
        name: "Cyber Retro CRT Monitor Core",
        price: 280.00,
        category: "Monitors",
        desc: "Retro active curved monitor rendering phosphorus beam distortion, adjustable horizontal blanking, and optional shadow mask scanline filters.",
        salesCount: 33,
        viewsCount: 198,
        imageUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 140.00,
        stockCount: 12
      },
      {
        id: "retro-4",
        name: "8-bit Audio Drum Emulator",
        price: 159.00,
        category: "Audio",
        desc: "Sovereign chiptune sound processor mimicking legend retro consoles. Dial-in raw square wave parameters, noise filters, and vintage envelopes easily.",
        salesCount: 52,
        viewsCount: 290,
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 70.00,
        stockCount: 22
      }
    ]
  },
  {
    id: "zenith-wellness",
    name: "Zenith Wellness Hub",
    tagline: "Sovereign bio-hacking & circadian energy alignment",
    categoryDefault: "Wellness",
    primaryColor: "emerald",
    themeStyle: "wellness",
    bannerText: "Optimize biological performance and align neural pathways.",
    simulatedUrl: "https://www.zenithwellness.org",
    benefitsStrip: [
      { title: "Adaptive recovery", desc: "Tuned biological balance", iconName: "Gift" },
      { title: "Medical telemetry", desc: "FDA-compliant sensors", iconName: "Cpu" },
      { title: "Carbon dispatch", desc: "Climate-neutral delivery", iconName: "Truck" },
      { title: "Safe data node", desc: "HIPAA-grade encryption", iconName: "Check" },
      { title: "Lifetime backing", desc: "Full sensory diagnostics", iconName: "ShieldCheck" },
      { title: "SDR connection", desc: "Bluetooth telemetry sync", iconName: "Smartphone" }
    ],
    products: [
      {
        id: "wellness-1",
        name: "Circadian Light Bio-Glasses v8",
        price: 189.00,
        category: "Eyewear",
        desc: "Specialized amber spectrum active lenses. Calibrates raw blue melatonin feedback loops dynamically to stimulate high energy and optimize REM recovery stages.",
        salesCount: 184,
        viewsCount: 941,
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 85.00,
        stockCount: 40
      },
      {
        id: "wellness-2",
        name: "Neural Rest Sleep Ring Core",
        price: 299.00,
        category: "Wearables",
        desc: "Premium grade titanium telemetry band. Tracks sub-cutaneous oxygen levels, autonomic thermal tracking, and daily heart-rate variability indexes securely.",
        salesCount: 112,
        viewsCount: 785,
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 130.00,
        stockCount: 55
      },
      {
        id: "wellness-3",
        name: "Holographic Posture Core Sensor",
        price: 135.00,
        category: "Healthcare",
        desc: "Intelligent lightweight belt that tracks spine curvature. Pulses gentle micro-haptic reminders if posture slumps from ideal ergonomic alignment benchmarks.",
        salesCount: 95,
        viewsCount: 450,
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 60.00,
        stockCount: 38
      },
      {
        id: "wellness-4",
        name: "Bio-coherence Breath Modulator",
        price: 95.00,
        category: "Wellness",
        desc: "Soothing tactile lung analyzer. Coordinates natural resonant breathing cycles at 0.1Hz frequency using light ripples and gentle mechanical vibrations.",
        salesCount: 220,
        viewsCount: 810,
        imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=300",
        buyingPrice: 42.00,
        stockCount: 110
      }
    ]
  }
];

