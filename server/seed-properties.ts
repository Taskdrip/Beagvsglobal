import { db } from "./db";
import { listings, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const WHATSAPP = "+2348037232210";

const PROPERTIES = [
  {
    title: "4 Units 2-Bedroom Apartments – First Unity Estate Ajah Badore",
    slug: "4-units-2bed-first-unity-estate-ajah-badore-" + Date.now(),
    description: `Premium 2-bedroom apartments available at First Unity Estate, Ajah Badore, Lagos. Available as individual units at ₦90,000,000 per unit or purchase all 4 units together at ₦360,000,000.\n\nEach apartment features spacious living areas, modern kitchen, fitted wardrobes, and ample parking. Located in the serene and fast-growing Ajah Badore axis with easy access to main roads.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "90000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Ajah Badore, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "apartment",
      category: "sale",
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1200,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Gated Estate", "CCTV Security", "Ample Parking", "Borehole Water", "24hr Electricity", "Tarred Road"],
      amenities: ["Fitted Kitchen", "Wardrobes", "POP Ceiling", "Tiled Floors"],
      thankYouMessage: "Thank you for your interest! Our agent will contact you on WhatsApp within 24 hours.",
      unitsAvailable: 4,
      pricePerUnit: 90000000,
      totalPrice: 360000000,
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "Adesoye Golden Estate – 50-Unit 4-Bedroom Duplexes, Grand Inn GRA Ijebu-Ode",
    slug: "adesoye-golden-estate-ijebu-ode-" + (Date.now() + 1),
    description: `Introducing Adesoye Golden Estate at Grand Inn GRA, Ijebu-Ode, Ogun State — a prestigious development of 50 units of 4-bedroom fully-detached duplexes priced at ₦115,000,000 per unit.\n\nEach duplex comes with a BQ (Boys' Quarters), spacious compound, modern finishing, and access to top-class estate facilities. Strategically located in the Government Reserved Area (GRA) of Ijebu-Ode with excellent road network.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "115000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Grand Inn GRA, Ijebu-Ode, Ogun State, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "house",
      category: "sale",
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 3500,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["GRA Location", "BQ Inclusive", "Estate Security", "Perimeter Fencing", "Road Network", "Drainage System"],
      amenities: ["4 Bedrooms", "BQ", "Spacious Compound", "Modern Finishing", "Fitted Kitchen", "POP Ceiling"],
      thankYouMessage: "Thank you for your interest in Adesoye Golden Estate! Our agent will contact you on WhatsApp within 24 hours.",
      unitsAvailable: 50,
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "Filling Station with 4 Acres Land – C of O, Abeokuta (Part A)",
    slug: "filling-station-4acres-coo-abeokuta-a-" + (Date.now() + 2),
    description: `A rare investment opportunity — a fully operational filling station sitting on a 4-acre land with Certificate of Occupancy (C of O) in Abeokuta, Ogun State. Priced at ₦1,600,000,000.\n\nThis commercial property includes the filling station structure, storage tanks, a functional canopy, office space, and extensive land area with significant development potential. The C of O ensures clear title and easy transfer.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "1600000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Abeokuta, Ogun State, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "commercial",
      category: "sale",
      areaSqft: 174240,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Operational Filling Station", "Storage Tanks", "Canopy Structure", "Office Space", "4 Acres Land", "Tarred Access Road"],
      amenities: ["C of O Title", "High Commercial Value", "Strategic Location", "Development Potential"],
      thankYouMessage: "Thank you for your interest! Our agent will contact you on WhatsApp within 24 hours.",
      landSize: "4 Acres",
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "Filling Station with 4 Acres Land – C of O, Abeokuta (Part B – Full Details)",
    slug: "filling-station-4acres-coo-abeokuta-b-" + (Date.now() + 3),
    description: `Extended listing details for the commercial filling station property in Abeokuta. Total 4 acres with Certificate of Occupancy, priced at ₦1,600,000,000.\n\nThis extraordinary commercial asset offers multiple revenue streams. The filling station operates with NNPC/DPR approval. The remaining land area allows for construction of shops, warehouse, or residential development. Buyers can negotiate payment terms with part-payment options available.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "1600000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Abeokuta, Ogun State, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "commercial",
      category: "sale",
      areaSqft: 174240,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["NNPC/DPR Approval", "Operational Status", "Multiple Pumps", "Underground Tanks", "Office & Shop", "Expansive Land"],
      amenities: ["C of O", "Part-Payment Options", "Multiple Revenue Streams", "Development Potential"],
      thankYouMessage: "Thank you! Our agent will reach out via WhatsApp within 24 hours to discuss payment terms.",
      landSize: "4 Acres",
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "4-Bedroom Detached Duplex – Lekki Scheme 2 (₦180m)",
    slug: "4bed-detached-duplex-lekki-scheme2-180m-" + (Date.now() + 4),
    description: `Magnificent 4-bedroom fully-detached duplex in the exclusive Lekki Scheme 2, Lagos. Priced at ₦180,000,000.\n\nThis stunning property features 4 en-suite bedrooms, a BQ, expansive living and dining areas, modern kitchen with island, beautiful landscaping, and a 2-car garage. Located in one of Lagos' most sought-after neighbourhoods with 24/7 security.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "180000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Lekki Scheme 2, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "house",
      category: "sale",
      bedrooms: 4,
      bathrooms: 5,
      areaSqft: 4200,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["24/7 Security", "2-Car Garage", "BQ", "Landscaped Garden", "Borehole Water", "Prepaid Meter"],
      amenities: ["4 En-suite Bedrooms", "Kitchen Island", "Family Lounge", "Staff Quarters", "POP Ceiling", "Imported Tiles"],
      thankYouMessage: "Thank you for your interest! Our agent will contact you on WhatsApp within 24 hours.",
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "4-Bedroom Detached Duplex – Lekki Scheme 2 (₦200m Premium)",
    slug: "4bed-detached-duplex-lekki-scheme2-200m-" + (Date.now() + 5),
    description: `Premium 4-bedroom fully-detached duplex in Lekki Scheme 2, Lagos. Priced at ₦200,000,000 — offering superior finishing and a larger plot.\n\nThis top-of-the-market property boasts 4 en-suite bedrooms with walk-in closets, home office, cinema room, rooftop terrace, swimming pool, and a double BQ. The property sits on a large corner plot with exceptional finishes throughout.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "200000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Lekki Scheme 2, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "house",
      category: "sale",
      bedrooms: 4,
      bathrooms: 5,
      areaSqft: 5500,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Swimming Pool", "Rooftop Terrace", "Double BQ", "Home Cinema", "Corner Plot", "Smart Home System"],
      amenities: ["Walk-in Closets", "Home Office", "Kitchen Island", "Granite Countertops", "Imported Fixtures", "Solar Inverter"],
      thankYouMessage: "Thank you for your interest in this premium property! Our agent will contact you on WhatsApp within 24 hours.",
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "Industrial Warehouse – Ikeja, 17,000 sqm at ₦15.5 Billion",
    slug: "industrial-warehouse-ikeja-17000sqm-" + (Date.now() + 6),
    description: `Rare acquisition opportunity — massive 17,000 sqm industrial warehouse in Ikeja Industrial Estate, Lagos. Priced at ₦15,500,000,000.\n\nThis world-class industrial facility features reinforced concrete floors, 12m clear height, multiple loading bays, 33KVA dedicated power supply, overhead cranes, fire suppression system, and extensive office space. Fully compliant with industrial standards and strategically located near Murtala Muhammed Airport.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "15500000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Ikeja Industrial Estate, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1565891741441-64926e3838b0?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "warehouse",
      category: "sale",
      areaSqft: 183000,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Multiple Loading Bays", "Overhead Cranes", "33KVA Power Supply", "Fire Suppression", "Security House", "Rail Access"],
      amenities: ["12m Clear Height", "Reinforced Floors", "Office Block", "Staff Facilities", "CCTV System", "24hr Security"],
      thankYouMessage: "Thank you for your interest! Our team will contact you via WhatsApp within 24 hours to arrange a site inspection.",
      floorArea: "17,000 sqm",
      whatsapp: WHATSAPP,
    },
  },
  {
    title: "Block of 8 Luxury 3-Bedroom Apartments – Lekki Phase 1 at ₦4 Billion",
    slug: "block-8-luxury-3bed-apartments-lekki-phase1-" + (Date.now() + 7),
    description: `Exceptional investment opportunity — a full block of 8 luxury 3-bedroom apartments in the heart of Lekki Phase 1, Lagos. Priced at ₦4,000,000,000 for the entire block.\n\nEach of the 8 apartments is finished to the highest international standard with premium materials. The block includes rooftop facilities, underground car park for 16 cars, backup power, swimming pool, gym, and 24/7 concierge service. Each apartment generates premium rental income, making this an outstanding real estate investment.\n\nFor enquiries contact: ${WHATSAPP}`,
    priceCrypto: "4000000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Lekki Phase 1, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "apartment",
      category: "sale",
      bedrooms: 3,
      bathrooms: 4,
      areaSqft: 2400,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Swimming Pool", "Gym", "Rooftop Terrace", "Underground Parking", "24hr Concierge", "Backup Generator"],
      amenities: ["Premium Finishing", "Smart Home", "Central A/C", "American Kitchen", "Marble Floors", "En-suite Rooms"],
      thankYouMessage: "Thank you for your interest in this premium investment! Our agent will contact you via WhatsApp within 24 hours.",
      totalUnits: 8,
      pricePerUnit: 500000000,
      whatsapp: WHATSAPP,
    },
  },
];

export async function seedProperties() {
  try {
    // Find the admin user to use as seller
    const adminUsers = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);
    
    if (adminUsers.length === 0) {
      console.log("No admin user found. Run createAdminUser.ts first.");
      return { success: false, message: "No admin user found" };
    }

    const adminUser = adminUsers[0];
    console.log(`Seeding properties with admin user: ${adminUser.email}`);

    let created = 0;
    let skipped = 0;

    for (const prop of PROPERTIES) {
      // Check if already seeded (by slug prefix)
      const slugPrefix = prop.slug.split("-").slice(0, 4).join("-");
      const existing = await db.select().from(listings).where(eq(listings.sellerId, adminUser.id));
      const alreadyExists = existing.some(l => l.title === prop.title);
      
      if (alreadyExists) {
        console.log(`Skipping: ${prop.title}`);
        skipped++;
        continue;
      }

      await db.insert(listings).values({
        ...prop,
        sellerId: adminUser.id,
        isActive: true,
      });

      console.log(`Created: ${prop.title}`);
      created++;
    }

    return { success: true, created, skipped, total: PROPERTIES.length };
  } catch (error: any) {
    console.error("Seed error:", error);
    return { success: false, message: error.message };
  }
}
