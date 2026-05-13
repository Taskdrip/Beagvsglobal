import { db } from "./db";
import { users, listings, blogPosts } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@beagvsglobal.com";
const WHATSAPP = "+2348037232210";

// Auto-run when executed directly as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin().then(() => { console.log("[startup-seed] Done."); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
}

export async function seedAdmin() {
  const passwordHash = await bcrypt.hash("Admin@2025!", 12);
  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

  let adminId: string;
  if (existing.length > 0) {
    await db.update(users).set({ passwordHash, role: "ADMIN", accountType: "BOTH", mustChangePassword: false })
      .where(eq(users.email, ADMIN_EMAIL));
    adminId = existing[0].id;
    console.log("[startup-seed] Admin user verified.");
  } else {
    const [u] = await db.insert(users).values({
      email: ADMIN_EMAIL, username: "admin", firstName: "Super", lastName: "Admin",
      passwordHash, role: "ADMIN", accountType: "BOTH", mustChangePassword: false,
    }).returning();
    adminId = u.id;
    console.log("[startup-seed] Admin user created.");
  }

  await seedProperties(adminId);
  await seedBlog(adminId);
}

async function seedProperties(adminId: string) {
  const existing = await db.select().from(listings).limit(1);
  if (existing.length > 0) {
    console.log("[startup-seed] Properties already exist in DB, skipping seed.");
    return;
  }

  const PROPS = [
    {
      title: "4 Units 2-Bedroom Apartments – First Unity Estate Ajah Badore",
      slug: "4-units-2bed-first-unity-estate-ajah-badore",
      description: `Premium 2-bedroom apartments at First Unity Estate, Ajah Badore, Lagos. Available individually at ₦90,000,000 per unit or all 4 units together at ₦360,000,000. Each apartment features spacious living areas, modern kitchen, fitted wardrobes, and ample parking. Gated estate with tarred road access.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "90000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Ajah Badore, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "apartment", category: "sale", bedrooms: 2, bathrooms: 2, areaSqft: 1200, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Gated Estate","CCTV Security","Ample Parking","Borehole Water","24hr Electricity","Tarred Road"], amenities: ["Fitted Kitchen","Wardrobes","POP Ceiling","Tiled Floors"], unitsAvailable: 4, whatsapp: WHATSAPP },
    },
    {
      title: "Adesoye Golden Estate – 50-Unit 4-Bedroom Duplexes, Grand Inn GRA Ijebu-Ode",
      slug: "adesoye-golden-estate-ijebu-ode",
      description: `Prestigious development of 50 units of 4-bedroom fully-detached duplexes at Grand Inn GRA, Ijebu-Ode, Ogun State. Priced at ₦115,000,000 per unit. Each duplex comes with a BQ, spacious compound, modern finishing, and GRA estate facilities.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "115000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Grand Inn GRA, Ijebu-Ode, Ogun State, Nigeria",
      images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 4, areaSqft: 3500, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["GRA Location","BQ Inclusive","Estate Security","Perimeter Fencing","Road Network","Drainage System"], amenities: ["4 Bedrooms","BQ","Spacious Compound","Modern Finishing","Fitted Kitchen","POP Ceiling"], unitsAvailable: 50, whatsapp: WHATSAPP },
    },
    {
      title: "Filling Station with 4 Acres Land – C of O, Abeokuta",
      slug: "filling-station-4acres-coo-abeokuta",
      description: `Rare investment opportunity — fully operational filling station on 4-acre land with Certificate of Occupancy in Abeokuta, Ogun State. Priced at ₦1,600,000,000. Includes filling station structure, storage tanks, functional canopy, office space, and extensive land with significant development potential.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "1600000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Abeokuta, Ogun State, Nigeria",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "commercial", category: "sale", areaSqft: 174240, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Operational Filling Station","Storage Tanks","Canopy Structure","Office Space","4 Acres Land","Tarred Access Road"], amenities: ["C of O Title","High Commercial Value","Strategic Location","Development Potential"], landSize: "4 Acres", whatsapp: WHATSAPP },
    },
    {
      title: "4-Bedroom Detached Duplex – Lekki Scheme 2 (₦180m)",
      slug: "4bed-detached-duplex-lekki-scheme2-180m",
      description: `Magnificent 4-bedroom fully-detached duplex in exclusive Lekki Scheme 2, Lagos. Priced at ₦180,000,000. Features 4 en-suite bedrooms, a BQ, expansive living and dining areas, modern kitchen with island, beautiful landscaping, and 2-car garage. 24/7 security.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "180000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Lekki Scheme 2, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 5, areaSqft: 4200, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["24/7 Security","2-Car Garage","BQ","Landscaped Garden","Borehole Water","Prepaid Meter"], amenities: ["4 En-suite Bedrooms","Kitchen Island","Family Lounge","Staff Quarters","POP Ceiling","Imported Tiles"], whatsapp: WHATSAPP },
    },
    {
      title: "4-Bedroom Detached Duplex – Lekki Scheme 2 (₦200m Premium)",
      slug: "4bed-detached-duplex-lekki-scheme2-200m",
      description: `Premium 4-bedroom fully-detached duplex in Lekki Scheme 2, Lagos. Priced at ₦200,000,000. Features 4 en-suite bedrooms with walk-in closets, home office, cinema room, rooftop terrace, swimming pool, and double BQ. Corner plot with exceptional finishes.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "200000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Lekki Scheme 2, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "house", category: "sale", bedrooms: 4, bathrooms: 5, areaSqft: 5500, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Swimming Pool","Rooftop Terrace","Double BQ","Home Cinema","Corner Plot","Smart Home System"], amenities: ["Walk-in Closets","Home Office","Kitchen Island","Granite Countertops","Imported Fixtures","Solar Inverter"], whatsapp: WHATSAPP },
    },
    {
      title: "Industrial Warehouse – Ikeja, 17,000 sqm at ₦15.5 Billion",
      slug: "industrial-warehouse-ikeja-17000sqm",
      description: `Massive 17,000 sqm industrial warehouse in Ikeja Industrial Estate, Lagos. Priced at ₦15,500,000,000. Features reinforced concrete floors, 12m clear height, multiple loading bays, 33KVA dedicated power supply, overhead cranes, fire suppression system, and extensive office space. Near Murtala Muhammed Airport.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "15500000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Ikeja Industrial Estate, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1565891741441-64926e3838b0?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "warehouse", category: "sale", areaSqft: 183000, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Multiple Loading Bays","Overhead Cranes","33KVA Power Supply","Fire Suppression","Security House","Rail Access"], amenities: ["12m Clear Height","Reinforced Floors","Office Block","Staff Facilities","CCTV System","24hr Security"], floorArea: "17,000 sqm", whatsapp: WHATSAPP },
    },
    {
      title: "Block of 8 Luxury 3-Bedroom Apartments – Lekki Phase 1 at ₦4 Billion",
      slug: "block-8-luxury-3bed-apartments-lekki-phase1",
      description: `Full block of 8 luxury 3-bedroom apartments in the heart of Lekki Phase 1, Lagos. Priced at ₦4,000,000,000 for the entire block. Each of the 8 apartments is finished to international standards. Includes rooftop facilities, underground car park for 16 cars, backup power, swimming pool, gym, and 24/7 concierge service.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "4000000000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "Lekki Phase 1, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "apartment", category: "sale", bedrooms: 3, bathrooms: 4, areaSqft: 2400, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Swimming Pool","Gym","Rooftop Terrace","Underground Parking","24hr Concierge","Backup Generator"], amenities: ["Premium Finishing","Smart Home","Central A/C","American Kitchen","Marble Floors","En-suite Rooms"], totalUnits: 8, pricePerUnit: 500000000, whatsapp: WHATSAPP },
    },
    {
      title: "3-Bedroom Flat – Ikota Villa Estate, VGC, Lekki (For Rent)",
      slug: "3bed-flat-ikota-villa-estate-vgc-lekki-rent",
      description: `Spacious and well-maintained 3-bedroom flat available for rent at Ikota Villa Estate, Victoria Garden City (VGC), Lekki. Annual rent: ₦4,500,000. The flat features 3 en-suite bedrooms, a large sitting room, modern kitchen, and private parking. Located in a secure, well-managed estate with 24hr security and excellent facilities.\n\nFor enquiries: ${WHATSAPP}`,
      priceCrypto: "4500000", currency: "NGN" as const, network: "BANK_TRANSFER" as const, type: "REAL_ESTATE" as const,
      location: "VGC, Lekki, Lagos, Nigeria",
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop"],
      metadata: { propertyType: "apartment", category: "rent", bedrooms: 3, bathrooms: 3, areaSqft: 1800, propertyTitle: "Certificate of Occupancy (C of O)", facilities: ["Gated Estate","24hr Security","Generator Backup","Borehole Water","Parking Space"], amenities: ["3 En-suite Rooms","Modern Kitchen","Large Sitting Room","Balcony","Wardrobe"], whatsapp: WHATSAPP },
    },
  ];

  for (const prop of PROPS) {
    await db.insert(listings).values({ ...prop, sellerId: adminId, isActive: true }).onConflictDoNothing();
  }
  console.log(`[startup-seed] ${PROPS.length} properties seeded.`);
}

async function seedBlog(adminId: string) {
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.authorId, adminId)).limit(1);
  if (existing.length > 0) {
    console.log("[startup-seed] Blog posts already seeded, skipping.");
    return;
  }

  const { seedBlogPosts } = await import("./seed-blog");
  const result = await seedBlogPosts();
  console.log(`[startup-seed] Blog: ${JSON.stringify(result)}`);
}
