import { db } from "./db";
import { listings, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const WHATSAPP = "+2348037232210";

const PROPERTIES = [
  {
    title: "SALE! 4 Units of 2-Bedroom Apartments + BQ – First Unity Estate, Ajah Badore",
    slug: "4-units-2bed-first-unity-estate-ajah-badore",
    description: `🔥 Sale! Sale!! Sale!!!

These ultra-modern 4 Units of 2-bedroom apartments, each with a separate boys-quarter (BQ), are situated in the serene environment (by the gate) of the First Unity Estate. Just adjacent to the entrance of the magnificent Co-Operative Villas.

Additionally, the tastefully finished building contains:
• 4nos of 2-bedroom apartments
• 4nos of 1 room self-contained (BQ per apartment). All rooms are ensuite.

✅ Superb finishes  ✅ Ample parking space  ✅ Good electricity  ✅ 24hrs security
✅ Serene environment  ✅ Fitted kitchen  ✅ Balcony  ✅ POP, Tiles & Wardrobe
✅ Well clean, treated water  ✅ Modern kitchen  ✅ Separate Family lounge  ✅ All rooms ensuite

NET PRICE:
• The entire 4 units: ₦360,000,000
• Each unit: ₦90,000,000

HURRY NOW — Great buy for an INVESTOR. All apartments and Self-Contained are tenanted!!!

For enquiries: ${WHATSAPP}`,
    priceCrypto: "90000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "First Unity Estate (Adjacent to Cooperative Villa), Ajah Badore, Lagos",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "apartment", category: "sale", bedrooms: 2, bathrooms: 2, areaSqft: 1200,
      propertyTitle: "Governor's Consent",
      facilities: ["Gated Estate", "24hr Security", "Ample Parking", "Good Electricity", "Borehole Water", "Tarred Road"],
      amenities: ["Fitted Kitchen", "Wardrobe", "POP Ceiling", "Tiled Floors", "Balcony", "All Rooms Ensuite"],
      thankYouMessage: "Thank you for your interest! Our agent will contact you on WhatsApp within 24 hours. HURRY — this is a great investor buy!",
      unitsAvailable: 4, pricePerUnit: 90000000, totalPrice: 360000000, whatsapp: WHATSAPP,
    },
  },
  {
    title: "Adesoye Golden Estate – 50 Units, 4-Bedroom Duplex + BQ, Grand Inn GRA, Ijebu-Ode",
    slug: "adesoye-golden-estate-ijebu-ode",
    description: `ADESOYE GOLDEN ESTATE

Consisting of 50 units in total. Each unit is a 4-bedroom duplex with one bedroom boys quarters.

🏊 Features:
• 24/7 power supply • Fully equipped gym • Hall for events • Swimming pool
• Relaxation lounge • 24 hours Security • 24 hours CCTV surveillance
• Refuse Disposal Services • Pharmacy & minimart • Standby Transformer and Generator

PRICE: ₦115,000,000
LANDMARK: Grand Inn & Suites GRA, Ijebu-Ode, Ogun State

For enquiries: ${WHATSAPP}`,
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
      propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 4, areaSqft: 3500,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["24/7 Power Supply", "Swimming Pool", "Fully Equipped Gym", "Event Hall", "Relaxation Lounge", "24hr CCTV Security", "Refuse Disposal", "Pharmacy & Minimart", "Standby Generator"],
      amenities: ["4 Bedrooms", "BQ Inclusive", "Spacious Compound", "Modern Finishing", "Fitted Kitchen", "POP Ceiling"],
      thankYouMessage: "Thank you for your interest in Adesoye Golden Estate! Our agent will contact you on WhatsApp within 24 hours.",
      unitsAvailable: 50, whatsapp: WHATSAPP,
    },
  },
  {
    title: "⛽ Filling Station for Sale – PMS 4 Pumps + AGO, 4 Acres C of O, Abeokuta",
    slug: "filling-station-pms-ago-4acres-coo-abeokuta",
    description: `⛽ FILLING STATION FOR SALE

PMS Pump: 4nos  |  AGO Pump: 1 unit

On 4 acres of land with Certificate of Occupancy, after FMC, Idi Aba, Abeokuta.
Facing the Main Road — excellent commercial position.

PRICE: ₦1,600,000,000 (₦1.6 Billion Naira)

For enquiries: ${WHATSAPP}`,
    priceCrypto: "1600000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Idi Aba, Abeokuta, Ogun State, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "commercial", category: "sale", areaSqft: 174240,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["PMS Pumps x4", "AGO Pump x1", "4 Acres Land", "Main Road Frontage", "Office Space", "Underground Tanks"],
      amenities: ["C of O Title", "High Commercial Value", "Strategic Location", "Full Operational Status"],
      thankYouMessage: "Thank you for your interest in this investment property! Our agent will contact you via WhatsApp within 24 hours.",
      landSize: "4 Acres", whatsapp: WHATSAPP,
    },
  },
  {
    title: "4-Bedroom Fully Detached Duplex + BQ – Lekki Scheme 2, Ajah (₦180m)",
    slug: "4bed-detached-duplex-lekki-scheme2-180m",
    description: `Semi-direct Brief

4 bedroom Fully Detached Duplex with BQ for Sale at Lekki Scheme 2, Ajah, Lagos.
Location: Lekki Scheme 2 Estate, Ogombo Road, Ajah. Easy access via Lagos-Calabar Coastal Road.

Title: Governor's Consent
Land Size: 218 square meters
Price: ₦180,000,000 asking

For enquiries: ${WHATSAPP}`,
    priceCrypto: "180000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Lekki Scheme 2 Estate, Ogombo Road, Ajah, Lagos",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 5, areaSqft: 4200,
      propertyTitle: "Governor's Consent",
      facilities: ["24/7 Security", "BQ Inclusive", "Gated Estate", "Borehole Water", "Prepaid Meter", "Easy Road Access"],
      amenities: ["4 En-suite Bedrooms", "Boys Quarters", "Family Lounge", "Modern Kitchen", "POP Ceiling", "Imported Tiles"],
      thankYouMessage: "Thank you for your interest! Our agent will contact you on WhatsApp within 24 hours.",
      landSize: "218 sqm", whatsapp: WHATSAPP,
    },
  },
  {
    title: "4-Bedroom Fully Detached Duplex + BQ – Lekki Scheme 2, Ajah (₦200m Premium)",
    slug: "4bed-detached-duplex-lekki-scheme2-200m",
    description: `Semi-direct Brief

4 bedroom Fully Detached Duplex with BQ for Sale at Lekki Scheme 2, Ajah, Lagos.
Location: Lekki Scheme 2 Estate, Ogombo Road, Ajah. Easy access via Lagos-Calabar Coastal Road.

Title: Governor's Consent
Land Size: 218 square meters
Price: ₦200,000,000 asking

For enquiries: ${WHATSAPP}`,
    priceCrypto: "200000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Lekki Scheme 2 Estate, Ogombo Road, Ajah, Lagos",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 5, areaSqft: 5500,
      propertyTitle: "Governor's Consent",
      facilities: ["24/7 Security", "BQ Inclusive", "Gated Estate", "Swimming Pool", "Corner Plot", "Smart Home System"],
      amenities: ["Walk-in Closets", "Home Office", "Kitchen Island", "Granite Countertops", "Rooftop Terrace", "Solar Inverter"],
      thankYouMessage: "Thank you for your interest in this premium property! Our agent will contact you on WhatsApp within 24 hours.",
      landSize: "218 sqm", whatsapp: WHATSAPP,
    },
  },
  {
    title: "Industrial Warehouse for Sale – Ikeja Industrial Estate, 17,000 sqm at ₦15.5 Billion",
    slug: "industrial-warehouse-ikeja-17000sqm",
    description: `FOR SALE: INDUSTRIAL WAREHOUSE

Location: Ikeja Industrial Estate, Lagos
Land Size: 17,000 sqm  |  Property Type: Warehouse / Industrial Facility
Title: C of O  |  Price: ₦15,500,000,000

Massive industrial warehouse in Ikeja Industrial Estate, Lagos — reinforced concrete floors, 12m clear height, multiple loading bays, 33KVA dedicated power supply, overhead cranes, fire suppression system, and extensive office space. Near Murtala Muhammed Airport.

For enquiries: ${WHATSAPP}`,
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
      propertyType: "warehouse", category: "sale", areaSqft: 183000,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Multiple Loading Bays", "Overhead Cranes", "33KVA Power Supply", "Fire Suppression", "Security House", "Rail Access"],
      amenities: ["12m Clear Height", "Reinforced Floors", "Office Block", "Staff Facilities", "CCTV System", "24hr Security"],
      thankYouMessage: "Thank you for your interest! Our team will contact you via WhatsApp within 24 hours to arrange a site inspection.",
      floorArea: "17,000 sqm", whatsapp: WHATSAPP,
    },
  },
  {
    title: "Luxury Block of 8 Units of 3-Bedroom Apartments – Lekki Phase 1 at ₦4 Billion",
    slug: "block-8-luxury-3bed-apartments-lekki-phase1",
    description: `Luxury Block of 8 Units of 3 Bedroom apartments is up for sale

A solid income yielding investment in the heart of Lekki Phase 1. This premium residential block sits on approximately 1,400sqm and is currently occupied by a single corporate tenant, providing stable dollar denominated rental income.

📍 Location: Kunle Ogunba St off 21st Century Lekki 1 by Studio 24, Lekki Phase 1
Price: ₦4,000,000,000  |  Title: C of O

Installed Fixtures & Facilities:
• 8 units of luxury 3 bedroom apartments • 49 air conditioning units (2HP & 1.5HP)
• 8 units of 10kg Kelvinator washing machine and dryer • 8 Samsung side by side refrigerators
• 8 microwave ovens • 8 units of 6 burner gas cookers with ovens
• Water heaters in all rooms • Centralized TV dish system • CCTV camera system
• 100kVA standby generator • Reverse osmosis water treatment plant
• Dedicated 200kVA transformer • Video access control system

For enquiries: ${WHATSAPP}`,
    priceCrypto: "4000000000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Kunle Ogunba St, Lekki Phase 1, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "apartment", category: "sale", bedrooms: 3, bathrooms: 4, areaSqft: 2400,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["100kVA Standby Generator", "200kVA Dedicated Transformer", "CCTV Camera System", "Reverse Osmosis Water Plant", "Video Access Control", "Centralized TV Dish"],
      amenities: ["49 AC Units", "Washing Machines & Dryers", "Samsung Refrigerators", "6-Burner Gas Cookers", "Water Heaters All Rooms", "Premium Finishing"],
      thankYouMessage: "Thank you for your interest in this premium investment property! Our agent will contact you via WhatsApp within 24 hours.",
      totalUnits: 8, pricePerUnit: 500000000, landSize: "1,400 sqm", whatsapp: WHATSAPP,
    },
  },
  {
    title: "3-Bedroom Flat for Rent – Ikota Villa Estate, VGC, Lekki",
    slug: "3bed-flat-ikota-villa-estate-vgc-lekki-rent",
    description: `Spacious 3-bedroom flat for rent at Ikota Villa Estate, VGC, Lekki.
Annual rent: ₦4,500,000

Features 3 en-suite bedrooms, large sitting room, modern kitchen, private parking.
Secure, well-managed estate with 24hr security.

For enquiries: ${WHATSAPP}`,
    priceCrypto: "4500000",
    currency: "NGN" as const,
    network: "BANK_TRANSFER" as const,
    type: "REAL_ESTATE" as const,
    location: "Ikota Villa Estate, VGC, Lekki, Lagos, Nigeria",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop",
    ],
    metadata: {
      propertyType: "apartment", category: "rent", bedrooms: 3, bathrooms: 3, areaSqft: 1800,
      propertyTitle: "Certificate of Occupancy (C of O)",
      facilities: ["Gated Estate", "24hr Security", "Generator Backup", "Borehole Water", "Parking Space", "Serene Environment"],
      amenities: ["3 En-suite Rooms", "Modern Kitchen", "Large Sitting Room", "Balcony", "Wardrobe"],
      thankYouMessage: "Thank you for your rental enquiry! Our agent will contact you on WhatsApp within 24 hours.",
      whatsapp: WHATSAPP,
    },
  },
];

export async function seedProperties() {
  try {
    const adminUsers = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);
    if (adminUsers.length === 0) {
      return { success: false, message: "No admin user found" };
    }
    const adminUser = adminUsers[0];

    let created = 0;
    let skipped = 0;

    for (const prop of PROPERTIES) {
      const existing = await db.select({ id: listings.id }).from(listings).where(eq(listings.slug, prop.slug)).limit(1);
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      await db.insert(listings).values({ ...prop, sellerId: adminUser.id, isActive: true });
      created++;
    }

    return { success: true, created, skipped, total: PROPERTIES.length };
  } catch (error: any) {
    console.error("Seed error:", error);
    return { success: false, message: error.message };
  }
}
